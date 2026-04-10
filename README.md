# Next Video Player

A high-performance PWA video player built with Next.js, Genkit, and Gemini 1.5 Flash.

## Features Implemented

- [x] **Advanced Playback Controls:**
    - Seamless proxy support for hotlink-protected sources.
    - Persistent URL input across navigation and sessions.
    - Robust error reporting for failed video loads.
    - **Keyboard Shortcuts:**
        - `ArrowLeft`: Seek back 5 seconds.
        - `ArrowRight`: Seek forward 5 seconds.
        - `ArrowUp`: Increase volume.
        - `ArrowDown`: Decrease volume.

- [x] **Subtitles & Audio:**
    - Load external .vtt or .srt subtitle files.
    - Native browser support for embedded CC/Audio tracks.
    - Precise timing controls (offset and playback rate).

- [x] **Collections Management:**
    - Group videos into Series and Seasons.
    - Resume playback from where you left off.
    - Persistent storage using LocalStorage.

- [x] **GenAI Intelligence:**
    - **Video Analysis:** Automatic summary, transcript, and chapters using Gemini 1.5 Flash.
    - **Series Generator:** Automatically predict full season episode URLs from a single link pattern.
