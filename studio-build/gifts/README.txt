To add your own MP4 gifts:

1. Place your .mp4 files in this folder.
   Example: `my-cool-beat.mp4`

2. Open `public/index.html` and find the `giftAnimations` object (around line 2100).
   Add your file like this:
   ```javascript
   'my-cool-beat': '/assets/gifts/my-cool-beat.mp4',
   ```

3. Find the `giftNames` object (around line 1280) and add a display name:
   ```javascript
   'my-cool-beat': '🎵 My Cool Beat',
   ```

4. Add a "Buy" button in the HTML (around line 370) so users can unlock it:
   ```html
   <button data-gift-id="my-cool-beat" data-stripe-url="..." class="buy-gift-btn ...">
       Buy My Cool Beat ($5)
   </button>
   ```
