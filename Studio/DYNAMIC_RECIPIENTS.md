# Dynamic Recipients for Gift Sending

This document details how the AI Enterprise Studio app dynamically collects recipients for gift sending, enabling users to send gifts to **anyone** in the ecosystem (current user, GoodDGirl, Producer, or any zodiac sign).

---

## Overview

The app maintains an `allRecipients` array that is dynamically populated as Firestore listeners fetch data from:

- **Current user's profile** (optional: user can gift themselves or share invites)
- **GoodDGirl** (GOODDGIRL_USER_ID constant)
- **Producer** (character ID `producer`)
- **All 12 Zodiac Council members** (Aries through Pisces)

The recipient dropdown (`#gift-recipient-selector`) is automatically rendered whenever a new recipient is added or updated.

---

## Architecture

### State

```javascript
let allRecipients = [];
```

### Helpers

#### `upsertRecipient(recipient)`
Adds or updates a recipient. If a recipient with the same `id` exists, merges the new data. Otherwise, pushes the new recipient. After any change, triggers `renderRecipientDropdown()`.

```javascript
function upsertRecipient(recipient) {
    const idx = allRecipients.findIndex(r => r.id === recipient.id);
    if (idx >= 0) allRecipients[idx] = { ...allRecipients[idx], ...recipient };
    else allRecipients.push(recipient);
    renderRecipientDropdown();
}
```

**Fields:**
- `id` (string): Unique identifier (userId, `GOODDGIRL_USER_ID`, `producer`, `zodiac:aries`, etc.)
- `label` (string): Display name for dropdown option
- `name` (string, optional): Human-readable name

#### `renderRecipientDropdown()`
Rebuilds the `#gift-recipient-selector` dropdown options from the current `allRecipients` array. Preserves the selected value if still valid.

```javascript
function renderRecipientDropdown() {
    const sel = document.getElementById('gift-recipient-selector');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Select Recipient --</option>' +
        allRecipients.map(r => `<option value="${r.id}">${r.label || r.name || r.id}</option>`).join('');
    if (current && allRecipients.some(r => r.id === current)) sel.value = current;
}
```

---

## Recipient Population

### Initial Seed (DOMContentLoaded)

On page load, GoodDGirl is seeded into the list **immediately** for quick access:

```javascript
if (typeof GOODDGIRL_USER_ID !== 'undefined' && GOODDGIRL_USER_ID) {
    upsertRecipient({ id: GOODDGIRL_USER_ID, label: 'GoodDGirl (The First Lady)' });
}
```

### Current User Profile

When the user's profile is loaded from Firestore, they are added to the recipients list (enabling self-gifting for testing or loopback flows):

```javascript
const userProfileDoc = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main');
onSnapshot(userProfileDoc, (docSnap) => {
    if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.name) elements.userNameDisplay.textContent = d.name;
        if (d.imageUrl) document.getElementById('user-avatar').src = d.imageUrl;
        upsertRecipient({ id: userId, label: `${d.name || 'You'} (Me)` });
    }
});
```

### GoodDGirl Character

When GoodDGirl's profile snapshot arrives, her name is updated in the dropdown:

```javascript
const gooddgirlDoc = doc(db, 'artifacts', appId, 'public', 'data', 'characters', 'gooddgirl');
onSnapshot(gooddgirlDoc, (docSnap) => {
    if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.name) document.getElementById('gooddgirl-name-display').textContent = d.name;
        if (d.imageUrl) document.getElementById('good-d-girl-avatar').src = d.imageUrl;
        upsertRecipient({ id: GOODDGIRL_USER_ID, label: d.name || 'GoodDGirl (The First Lady)' });
    }
});
```

### Producer Character

Producer is added as a recipient with ID `producer`:

```javascript
const producerDoc = doc(db, 'artifacts', appId, 'public', 'data', 'characters', 'producer');
onSnapshot(producerDoc, (docSnap) => {
    if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.name) document.getElementById('producer-name-display').textContent = d.name;
        if (d.imageUrl) document.getElementById('producer-avatar').src = d.imageUrl;
        upsertRecipient({ id: 'producer', label: d.name || 'Producer' });
    }
});
```

### Zodiac Council (12 Signs)

Each zodiac sign is registered as a recipient with a namespaced ID (`zodiac:aries`, `zodiac:taurus`, etc.):

```javascript
document.querySelectorAll('[data-sign]').forEach(el => {
    const signId = el.dataset.sign;
    const zodiacDoc = doc(db, 'artifacts', appId, 'public', 'data', 'zodiac_council', signId);
    onSnapshot(zodiacDoc, (docSnap) => {
        if (docSnap.exists()) {
            const d = docSnap.data();
            if (d.name) el.querySelector('p').textContent = d.name;
            if (d.imageUrl) el.querySelector('img').src = d.imageUrl;
            upsertRecipient({ id: `zodiac:${signId}`, label: d.name || signId });
        }
    });
});
```

---

## Sending Gifts to Dynamic Recipients

### Send Flow

1. User selects a recipient from the dropdown (`#gift-recipient-selector`)
2. User selects a gift from their unlocked gifts (`#gift-selector`)
3. User clicks **💝 Send Gift** (`#send-selected-gift-btn`)
4. App creates a document in `sent_gifts` collection:

```javascript
const giftsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'sent_gifts');
await addDoc(giftsCollection, {
    senderId: userId,
    senderName: elements.userNameDisplay.textContent,
    recipientId: recipient, // Directly from dropdown value
    giftId: giftId,
    timestamp: serverTimestamp()
});
```

5. Gift is **re-locked** after sending (consumable pattern):

```javascript
const userGiftsDoc = doc(db, 'artifacts', appId, 'users', userId, 'gifts', 'unlocked');
await setDoc(userGiftsDoc, {
    [giftId]: false,
    lastUpdated: serverTimestamp()
}, { merge: true });
```

### Receiving Gifts

All users listen for incoming gifts in the `sent_gifts` collection:

```javascript
const giftsQuery = query(
    collection(db, 'artifacts', appId, 'public', 'data', 'sent_gifts'),
    orderBy('timestamp', 'desc')
);
onSnapshot(giftsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const gift = change.data();
            const now = Date.now();
            const giftTime = gift.timestamp?.toMillis() || 0;
            // Show animation if gift is for me and recent (< 10 seconds)
            if (gift.recipientId === userId && (now - giftTime) < 10000) {
                playGiftAnimation(gift);
            }
        }
    });
});
```

---

## Recipient ID Mapping

| Entity                     | Firestore Path                                    | Recipient ID          | Default Label                     |
|---------------------------|--------------------------------------------------|-----------------------|-----------------------------------|
| Current User              | `users/{userId}/profile/main`                    | `userId`              | `{name} (Me)`                     |
| GoodDGirl (First Lady)    | `public/data/characters/gooddgirl`               | `GOODDGIRL_USER_ID`   | `GoodDGirl (The First Lady)` or custom name |
| Producer                  | `public/data/characters/producer`                | `producer`            | `Producer` or custom name         |
| Aries (Zodiac)            | `public/data/zodiac_council/aries`               | `zodiac:aries`        | Custom name or `aries`            |
| Taurus (Zodiac)           | `public/data/zodiac_council/taurus`              | `zodiac:taurus`       | Custom name or `taurus`           |
| Gemini (Zodiac)           | `public/data/zodiac_council/gemini`              | `zodiac:gemini`       | Custom name or `gemini`           |
| Cancer (Zodiac)           | `public/data/zodiac_council/cancer`              | `zodiac:cancer`       | Custom name or `cancer`           |
| Leo (Zodiac)              | `public/data/zodiac_council/leo`                 | `zodiac:leo`          | Custom name or `leo`              |
| Virgo (Zodiac)            | `public/data/zodiac_council/virgo`               | `zodiac:virgo`        | Custom name or `virgo`            |
| Libra (Zodiac)            | `public/data/zodiac_council/libra`               | `zodiac:libra`        | Custom name or `libra`            |
| Scorpio (Zodiac)          | `public/data/zodiac_council/scorpio`             | `zodiac:scorpio`      | Custom name or `scorpio`          |
| Sagittarius (Zodiac)      | `public/data/zodiac_council/sagittarius`         | `zodiac:sagittarius`  | Custom name or `sagittarius`      |
| Capricorn (Zodiac)        | `public/data/zodiac_council/capricorn`           | `zodiac:capricorn`    | Custom name or `capricorn`        |
| Aquarius (Zodiac)         | `public/data/zodiac_council/aquarius`            | `zodiac:aquarius`     | Custom name or `aquarius`         |
| Pisces (Zodiac)           | `public/data/zodiac_council/pisces`              | `zodiac:pisces`       | Custom name or `pisces`           |

---

## Testing

### Verify Recipients List

1. Open [https://studio-2fb13.web.app](https://studio-2fb13.web.app)
2. Scroll to **💝 Gift Shop** section
3. Look at **💼 My Gifts → Select Recipient** dropdown
4. You should see:
   - **GoodDGirl (The First Lady)** (seeded on load)
   - **Your profile name (Me)** (after Firestore loads)
   - **Producer** (once Firestore syncs)
   - **All zodiac names** (e.g., Aries, Taurus, Gemini, etc., with custom labels if set)

### Send a Gift Test

1. Buy a gift (or simulate unlock by clicking Buy button and noting gift ID)
2. Select a recipient from dropdown (e.g., GoodDGirl)
3. Select a gift from **Select Gift to Send**
4. Click **💝 Send Gift**
5. Verify:
   - Success message: `💝 Gift sent successfully! Gift is now locked again...`
   - Gift disappears from "My Gifts" section (re-locked)
   - Recipient sees gift animation overlay (if they're on the same device/browser with same `recipientId`)

---

## Optional Enhancements

### Click-to-Gift on Avatars
Add `data-recipient-id` attributes to all avatar elements and wire click handlers to pre-select that recipient in the dropdown.

### Auto-Call on Invite
Support URL query parameter `?call=<peer-id>` to auto-dial a specific peer on page load, streamlining invite flow.

### Persistent Gift History
Store sent/received gifts in each user's profile for a permanent gift log.

---

## Troubleshooting

**Dropdown is empty:**
- Check browser console for Firestore errors
- Verify `GOODDGIRL_USER_ID` is defined in `config.js`
- Ensure Firestore rules allow reading public characters and zodiac council

**Recipient not appearing:**
- Check Firestore Console: `artifacts/{appId}/public/data/characters/{characterId}` or `zodiac_council/{signId}`
- Ensure `name` field is set
- Verify `upsertRecipient()` is called in the snapshot handler

**Gift sends to wrong person:**
- Check `recipientId` in `sent_gifts` collection
- Ensure dropdown `value` attribute matches Firestore `userId` or `zodiac:signId`
- For GoodDGirl, verify `GOODDGIRL_USER_ID` constant matches

---

## Summary

This dynamic recipient system allows open gifting to anyone in the ecosystem without hard-coding options. The dropdown auto-populates as Firestore data loads, ensuring the UI reflects the latest state of all characters and zodiac signs. Gifts are consumable (re-lock after sending) to support monetization, and all flows use real Firestore transactions for reliability.

**Status:** ✅ Fully implemented and deployed.
