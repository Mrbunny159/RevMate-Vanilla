# 🚀 How to Run RevMate Locally

## Why You Need a Local Server

RevMate uses modern JavaScript modules (ES6) and Firebase authentication, which require the app to be served over HTTP/HTTPS protocol. Opening `index.html` directly from your file system (`file:///`) will cause **CORS errors** and prevent the app from working.

## Quick Start (Choose One Method)

### ✅ Option 1: Python (Easiest)

**Requirements:** Python installed on your system

```bash
# Navigate to the public folder
cd "C:\Users\sufiyaan\Desktop\git recmate\gitRevMate\RevMate-Vanilla\public"

# Start server (Python 3)
python -m http.server 8000

# OR for Python 2
python -m SimpleHTTPServer 8000
```

**Then open:** `http://localhost:8000`

---

### ✅ Option 2: Node.js http-server

**Requirements:** Node.js installed

```bash
# Install http-server globally (one-time setup)
npm install -g http-server

# Navigate to public folder
cd "C:\Users\sufiyaan\Desktop\git recmate\gitRevMate\RevMate-Vanilla\public"

# Start server
http-server -p 8000
```

**Then open:** `http://localhost:8000`

---

### ✅ Option 3: VS Code Live Server

**Requirements:** Visual Studio Code

1. Install the **"Live Server"** extension by Ritwick Dey
2. Open the project folder in VS Code
3. Right-click on `public/index.html`
4. Select **"Open with Live Server"**

**Automatically opens at:** `http://127.0.0.1:5500`

---

## Troubleshooting

### Port Already in Use
If you see "Address already in use" error, try a different port:
```bash
python -m http.server 8080
# or
http-server -p 8080
```

### Google Login Not Working
1. Make sure you're accessing via `http://localhost` (not `file:///`)
2. Check browser console (F12) for errors
3. Ensure popup blockers are disabled for localhost
4. Try a different browser if issues persist

### Firebase Errors
- Verify your Firebase configuration in `js/firebase-init.js`
- Check that your Firebase project has Google authentication enabled
- Ensure your domain is authorized in Firebase Console

---

## 🔐 Authentication Methods

Your app uses a **hybrid authentication approach**:

- **Desktop Browsers:** Google sign-in popup window
- **Mobile/PWA:** Redirect to Google sign-in page
- **Automatic Fallback:** Switches to redirect if popup is blocked

---

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Verify the server is running and accessible
3. Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)
