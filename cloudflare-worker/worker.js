// Cloudflare Worker: Stripe Webhook -> Firestore Gift Unlock
// Edge-safe implementation without depending on Firebase Admin SDK.
// Expects Checkout Sessions (or Payment Link sessions) to include metadata:
//   metadata: { giftId: 'rose-bouquet', userId: '<UID>', appId: '<yourAppId>' }
// Environment (configure via wrangler secrets):
//   STRIPE_WEBHOOK_SECRET  - webhook signing secret from Stripe dashboard
//   GOOGLE_SERVICE_ACCOUNT_EMAIL - service account email with Datastore access
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY - private key (PEM, keep \n newlines)
//   FIRESTORE_PROJECT_ID - your GCP project id (same as Firebase project id)
//   APP_ID - the appId constant used in Firestore paths (defense-in-depth)
// Optional:
//   TOKEN_CACHE_SECONDS - override default 300s token cache lifetime
//
// Firestore doc updated:
//   artifacts/{APP_ID}/users/{userId}/gifts/unlocked
// Field set: giftId -> true (boolean)
// Uses Firestore REST API PATCH with updateMask for idempotency.

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method !== 'POST') {
        return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
      }

      const rawBody = await request.text();
      const sigHeader = request.headers.get('Stripe-Signature');
      if (!sigHeader) {
        return jsonResponse({ ok: false, error: 'Missing Stripe-Signature' }, 400);
      }

      const verified = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
      if (!verified.valid) {
        return jsonResponse({ ok: false, error: verified.error || 'Invalid signature' }, 400);
      }

      let event;
      try { event = JSON.parse(rawBody); } catch (e) {
        return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
      }

      if (event.type !== 'checkout.session.completed') {
        // Accept but ignore other event types
        return jsonResponse({ ok: true, ignored: true, type: event.type });
      }

      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      
      // SMART FALLBACK: If metadata is missing (Payment Links), check client_reference_id
      // Format: "USER_ID__GIFT_ID"
      let giftId = metadata.giftId;
      let userId = metadata.userId;
      
      if (!giftId || !userId) {
        const ref = session.client_reference_id;
        if (ref && ref.includes('__')) {
          const parts = ref.split('__');
          userId = parts[0];
          giftId = parts[1];
        }
      }

      const appId = metadata.appId || env.APP_ID;

      if (!giftId || !userId || !appId) {
        return jsonResponse({ ok: false, error: 'Missing metadata or client_reference_id' }, 400);
      }
      if (appId !== env.APP_ID) {
        return jsonResponse({ ok: false, error: 'AppId mismatch' }, 403);
      }

      // Obtain (cached) OAuth access token
      const accessToken = await getAccessToken(env);
      if (!accessToken) {
        return jsonResponse({ ok: false, error: 'Token acquisition failed' }, 500);
      }

      const projectId = env.FIRESTORE_PROJECT_ID;
      const path = `projects/${projectId}/databases/(default)/documents/artifacts/${encodeURIComponent(appId)}/users/${encodeURIComponent(userId)}/gifts/unlocked`;
      const updateUrl = `https://firestore.googleapis.com/v1/${path}?updateMask.fieldPaths=${encodeURIComponent(giftId)}`;

      const body = {
        fields: {
          [giftId]: { booleanValue: true }
        }
      };

      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        return jsonResponse({ ok: false, error: 'Firestore update failed', status: res.status, detail: text }, 500);
      }

      return jsonResponse({ ok: true, unlocked: giftId, userId });
    } catch (e) {
      return jsonResponse({ ok: false, error: e.message || String(e) }, 500);
    }
  }
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Stripe signature verification (minimal) per https://stripe.com/docs/webhooks/signatures
async function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    if (!secret) return { valid: false, error: 'Missing webhook secret' };
    // Header format: t=timestamp,v1=signature[,v0=old]
    const parts = sigHeader.split(',').map(p => p.trim());
    const timestampPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));
    if (!timestampPart || !v1Part) return { valid: false, error: 'Malformed signature header' };

    const timestamp = parseInt(timestampPart.slice(2), 10);
    const theirSig = v1Part.slice(3);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes
    if (Math.abs(now - timestamp) > tolerance) {
      return { valid: false, error: 'Timestamp outside tolerance' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = await hmacSHA256Hex(secret, signedPayload);
    const matches = constantTimeCompare(expected, theirSig);
    return { valid: matches, error: matches ? null : 'Signature mismatch' };
  } catch (e) {
    return { valid: false, error: e.message || String(e) };
  }
}

function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

async function hmacSHA256Hex(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return bufferToHex(sig);
}

function bufferToHex(buf) {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

// Token cache (shared global between requests until worker evicted)
let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedExpiry) return cachedToken;

  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) return null;

  // Normalize PEM newlines if stored escaped
  privateKey = privateKey.replace(/\\n/g, '\n');

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600; // 1 hour
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: email,
    sub: email,
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
    scope: 'https://www.googleapis.com/auth/datastore'
  };

  const base64url = (obj) => btoa(JSON.stringify(obj))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const unsigned = `${base64url(header)}.${base64url(claims)}`;
  const signature = await signRS256(privateKey, unsigned);
  const jwt = `${unsigned}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });

  if (!tokenRes.ok) return null;
  const data = await tokenRes.json();
  const lifetime = (data.expires_in || 3600) * 1000;
  cachedToken = data.access_token;
  cachedExpiry = now + Math.min(lifetime, (env.TOKEN_CACHE_SECONDS ? parseInt(env.TOKEN_CACHE_SECONDS, 10) * 1000 : 300000)); // cap cache at 5m by default
  return cachedToken;
}

async function signRS256(pemPrivateKey, data) {
  // Extract base64 key between PEM markers
  const pem = pemPrivateKey.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  
  // Manual conversion from base64 string to Uint8Array
  const binaryString = atob(pem);
  const binaryDer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryDer[i] = binaryString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    'pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(data));
  return bufferToBase64Url(signature);
}

function bufferToBase64Url(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
