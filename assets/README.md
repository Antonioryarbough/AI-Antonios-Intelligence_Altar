# Beat Gift Videos

Place your beat MP4 files here with these exact names:

1. `beat1.mp4` - Beat Gift 1 (costs 4 credits)
2. `beat2.mp4` - Beat Gift 2 (costs 2 credits)
3. `beat3.mp4` - Beat Gift 3 (costs 3 credits)
4. `beat4.mp4` - Beat Gift 4 (costs 1 credit)

These videos will:
- Play when users send gifts (costing credits from their balance)
- Show your beats/music productions
- Display on the sender's camera feed with fade in/out (~10 seconds)
- Show in the giftbox modal for users to choose from

**Video Requirements:**
- Format: MP4
- Duration: ~10 seconds (auto-stops after 10 sec)
- Resolution: Any (will be auto-sized)
- Content: Your beats, music tracks, or promotional content

## How it works:

1. Users buy balance credits via Stripe ($1 = 1 credit)
   - 💵 $5 = 5 credits
   - 💵 $10 = 10 credits
   - 💵 $20 = 20 credits
   - 💵 $50 = 50 credits
   - 💵 $100 = 100 credits

2. User clicks giftbox icon 🎁
3. Modal opens showing your 4 beat gift videos
4. User clicks beat gift → balance deducted → video plays on their camera feed
5. Gift recorded to Firestore for tracking

**Note:** Currently using your learning beats as placeholders. Replace with your final beat videos when ready!
