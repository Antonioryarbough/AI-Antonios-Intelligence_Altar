# VSCode Debugging Setup

This document explains how to debug the AI Antonio's Intelligence web application using VSCode.

## Prerequisites

1. **VSCode Extensions Required:**
   - [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) OR
   - [Debugger for Microsoft Edge](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-edge) OR
   - [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug)

2. **Live Server Extension:**
   - [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
   - The project is configured to use port 5501 (see `.vscode/settings.json`)

## How to Debug

### Method 1: Using Chrome (Recommended)

1. Start Live Server:
   - Right-click on `index.html` in VSCode
   - Select "Open with Live Server"
   - The app should open at `http://localhost:5501/index.html`

2. Start debugging:
   - Press `F5` or go to Run → Start Debugging
   - Select "Launch Chrome (AI Antonio's Intelligence)"
   - Chrome will open with DevTools automatically

3. Set breakpoints:
   - Click on the left margin of any line in the JavaScript code within `index.html`
   - The debugger will pause execution when that line is reached

### Method 2: Using Edge

Same steps as Chrome, but select "Launch Edge (AI Antonio's Intelligence)" configuration.

### Method 3: Using Firefox

1. Install the Firefox debugger extension first
2. Start Live Server
3. Select "Launch Firefox (AI Antonio's Intelligence)" configuration
4. Firefox will launch and connect to the debugger

### Method 4: Attach to Running Chrome

If you already have Chrome running with the app:

1. Start Chrome with remote debugging:
   ```bash
   # Windows
   chrome.exe --remote-debugging-port=9222

   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

   # Linux
   google-chrome --remote-debugging-port=9222
   ```

2. Navigate to `http://localhost:5501/index.html`

3. In VSCode, select "Attach to Chrome" configuration and press `F5`

## Available Debug Configurations

All configurations are defined in `.vscode/launch.json`:

- **Launch Chrome (AI Antonio's Intelligence)**: Opens Chrome with DevTools
- **Launch Edge (AI Antonio's Intelligence)**: Opens Edge browser
- **Attach to Chrome**: Connects to an already running Chrome instance
- **Launch Firefox (AI Antonio's Intelligence)**: Opens Firefox with debugger

## Debugging Features

Once debugging is active, you can:

- Set breakpoints in JavaScript code
- Step through code execution (F10, F11)
- Inspect variables and object properties
- View the call stack
- Watch expressions
- Use the debug console to execute JavaScript
- Inspect Firebase real-time data
- Monitor API calls to Gemini and other services

## Troubleshooting

### Issue: "Cannot connect to runtime process"

**Solution:** Make sure Live Server is running before starting the debugger.

### Issue: "Port 5501 is already in use"

**Solution:** Stop other Live Server instances or change the port in `.vscode/settings.json`.

### Issue: Browser doesn't launch

**Solution:** 
- Ensure the browser debugger extension is installed
- Check that the browser is installed on your system
- Try a different browser configuration

### Issue: Breakpoints show as "unverified"

**Solution:**
- Ensure source maps are enabled
- Check that the `webRoot` path is correct
- Reload the browser window after setting breakpoints

## Firebase Debugging Tips

This app uses Firebase Firestore and Auth. To debug Firebase operations:

1. Set breakpoints in the Firebase initialization code (around line 390 in index.html)
2. Watch the `db`, `auth`, and `userId` variables
3. Check the Network tab for Firebase API calls
4. Use the Debug Console to query Firebase: `db`, `auth.currentUser`

## API Key Management

⚠️ **Important:** The Gemini API key in the code is currently empty. For debugging API functionality:

1. Never commit API keys to version control
2. Use environment variables or a config file (gitignored)
3. Test with mock responses when the API key is not available

## Additional Resources

- [VSCode Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Firebase Debugging Guide](https://firebase.google.com/docs/web/setup)
