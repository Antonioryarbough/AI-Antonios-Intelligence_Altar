import hmac, hashlib
secret = 'whsec_test'
ts = '1234567890'
payload = '{"id":"evt_test","type":"checkout.session.completed"}'
raw = f'{ts}.{payload}'
print('Raw:', raw)
print('Computed HMAC SHA256:', hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest())