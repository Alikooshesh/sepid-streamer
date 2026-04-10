# Next Video Player

A high-performance PWA video player built with Next.js, Genkit, and Gemini 1.5 Flash.

## 🚀 Features Implemented

- [x] **Installable PWA:** Install on desktop or mobile for a native app experience.
- [x] **Offline Support:** Core player features, history, and collections work without internet (uses Service Workers).
- [x] **Chrome Extension Support:** Scaffolding provided to load the player in a Chrome Side Panel.
- [x] **Advanced Playback Controls:**
    - Seamless proxy support for hotlink-protected sources.
    - Persistent URL input across navigation and sessions.
    - **Keyboard Shortcuts:**
        - `ArrowLeft/Right`: Seek 5s.
        - `ArrowUp/Down`: Volume control.
- [x] **Subtitles & Audio:**
    - Load external .vtt or .srt files.
    - Precise timing controls (offset and playback rate).
- [x] **Collections Management:**
    - Group videos into Series.
    - Resume playback precisely where you left off.
- [x] **GenAI Intelligence:**
    - **Video Analysis:** Summary, transcript, and chapters using Gemini 1.5 Flash.
    - **Series Generator:** Automatically predict full season URLs from a single link pattern.

## 📲 Installation

### Progressive Web App (PWA)
1. Open the app in Chrome or Safari.
2. Click the **Install** icon in the address bar (Chrome) or **Add to Home Screen** (Safari iOS).
3. The app will now be available in your app drawer/applications folder and work offline.

### Chrome Extension (Side Panel)
1. Navigate to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `public/extension` folder from this project.
5. You can now pin the extension and open the video player in Chrome's Side Panel.

*Note: AI features and the Server Proxy require an internet connection.*
