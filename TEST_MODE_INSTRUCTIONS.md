# 🧪 How to Create a Stripe Test Link

Since you can't use your real card, let's create a **Test Mode** link. This lets you "buy" the item using a fake card number to prove the system works.

## Step 1: Switch to Test Mode

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. **Toggle the "Test Mode" switch** in the top right corner (it should turn orange).

## Step 2: Create a Test Product

1. Go to **Products**.
2. Click **+ Add Product**.
3. **Name:** `Test Raydiant Beat`
4. **Price:** `$1.99` (One-time).
5. Click **Save product**.

## Step 3: Create a Payment Link

1. On the product page you just created, look for the **"Payment Links"** section (usually at the bottom).
2. Click **Create payment link**.
3. (Optional) You can customize the page, but the defaults are fine.
4. Click **Create link**.
5. **Copy the URL**. It should start with: `https://buy.stripe.com/test_...`

## Step 4: Paste the Link Here

Paste that `test_...` link into the chat, and I will update your app to use it!

---

## 💳 How to "Pay"

When you click the button in your app later:
- **Card Number:** `4242 4242 4242 4242`
- **Expiration:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **Zip:** Any valid zip (e.g., `90210`)
