# Troubleshooting Guide

This guide provides solutions to common issues encountered in the AI Enterprise Studio.

## 1. Connection Issues

**Symptom:** The application is stuck on "Connecting to the studio..."

*   **Check Firebase Status:** Ensure Firebase services are operational by visiting the [Firebase Status Dashboard](https://status.firebase.google.com/).
*   **Clear Browser Cache:** Outdated cached data can sometimes interfere with the connection. Clear your browser's cache and cookies and try again.
*   **Check Network Configuration:** If you are on a corporate network, ensure that firewalls or proxies are not blocking connections to `*.firebaseio.com` or `*.googleapis.com`.

## 2. Video/Audio Problems

**Symptom:** Camera or microphone is not working. The video screen is black.

*   **Browser Permissions:**
    *   When prompted, you **must** allow the browser to access your camera and microphone.
    *   If you accidentally blocked it, click the camera icon in the address bar to change the permission settings.
*   **Other Applications:** Make sure no other application (e.g., Zoom, Skype, OBS) is currently using your camera. Browsers can only access a camera if it's not in use elsewhere.
*   **Correct Device:** If you have multiple cameras or microphones, ensure the correct one is selected in your browser's settings.

**Symptom:** Remote video is not appearing.

*   **Peer ID:** Double-check that you have entered the correct Peer ID for the person you are trying to call.
*   **Network:** Both users must have a stable internet connection. WebRTC can be sensitive to network changes or firewalls.

## 3. Gift Shop & Payments

**Symptom:** A purchased gift is not unlocking.

*   **Stripe Webhook:** The automatic unlocking of gifts depends on a server-side webhook from Stripe. If this is not configured, the process will fail. This is a known limitation in the current "demo" setup.
*   **Manual Refresh:** Try doing a hard refresh of the page (Ctrl+F5 or Cmd+Shift+R).
*   **Contact Admin:** If the issue persists, the administrator may need to check the Stripe and Firebase logs.

## 4. Image Display Issues

**Symptom:** Avatars or other images are not loading, showing an error icon.

*   **CORS/Hotlinking:** Many image hosting sites (like some wikis or personal websites) block "hotlinking," which prevents their images from being displayed on other domains.
*   **Solution:** Use a host that allows direct linking, such as [Imgur](https://imgur.com/).
    1.  Upload your image to Imgur.
    2.  Right-click the uploaded image and select "Copy Image Address".
    3.  Paste this direct link (which usually starts with `https://i.imgur.com/...`) into the profile editor.

## 5. General Errors

**Symptom:** A generic error message appears.

*   **Open Developer Console:**
    *   **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I` and click the "Console" tab.
    *   **Firefox:** Press `F12` or `Ctrl+Shift+I` and click the "Console" tab.
    *   **Safari:** Enable the Develop menu in Preferences > Advanced, then press `Cmd+Option+C`.
*   **Look for Red Text:** Error messages are usually displayed in red. This information is invaluable for debugging. Take a screenshot or copy the text when reporting an issue.
