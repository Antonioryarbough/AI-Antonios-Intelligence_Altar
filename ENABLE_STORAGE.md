# Enable Firebase Storage

Your images aren't loading because Firebase Storage needs to be enabled in your Firebase project.

## Quick Fix (5 minutes)

1. **Go to Firebase Console**: [Storage page](https://console.firebase.google.com/project/studio-2fb13/storage)

2. **Click "Get Started"** button in the Storage section

3. **Select production mode** (or test mode if you want open access temporarily):
   - **Production mode** (recommended):
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /images/{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
   - **Test mode** (easier but less secure - for testing only):
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read, write: if true;
         }
       }
     }
     ```

4. **Click "Next"** and **"Done"**

5. **Refresh your app** - images should now upload and load!

## Verify Storage is Working

After enabling Storage:
1. Go to your app
2. Click the ✏️ edit button on any character
3. Upload an image
4. Check Firebase Console > Storage to see if the file appears

## Storage Rules Explanation

The production rules above:
- ✅ Allow **anyone** to read/download images (public gallery)
- ✅ Allow **authenticated users** to upload images
- ❌ Block **anonymous/unauthenticated** uploads

This is secure and appropriate for your app since you're using Firebase Anonymous Auth.

## Troubleshooting

If images still don't load after enabling Storage:
1. Open browser DevTools (F12) and check Console tab for errors
2. Verify the `storageBucket` in `public/config.js` is: `studio-2fb13.appspot.com`
3. Make sure you've deployed the latest code: `firebase deploy`
4. Clear browser cache and reload

## Cost

Firebase Storage free tier:
- **5 GB** storage
- **1 GB/day** download
- **20,000 uploads/day**

This is **FREE** for small apps!
