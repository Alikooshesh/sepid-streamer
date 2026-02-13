# **App Name**: Sepid Streamer

## Core Features:

- Online & Local Video Playback: Play videos from an online URL (http/https) or offline local video files chosen from the user's device, supporting WebM and MP4 formats.
- Customizable Subtitle Display & Sync: Load subtitles from URL or file (SRT/VTT), render them over the video with customizable font, size, color, background/outline, and adjustable playback offset.
- Synchronized Separate Audio Track: Upload a local audio file and play it in precise synchronization with the video, including shared pause, seek, and playback rate controls with individual offset adjustments.
- Local Watch History Persistence: Automatically store and update watch history in local storage (localStorage and/or IndexedDB), including video title, source type, last watched time, and date.
- Series Album Management: Create and manage local 'Series Albums' with ordered lists of videos (episodes) and play them sequentially, persisting metadata locally without a login.
- PWA Offline Capabilities: The application must load and display its UI offline, ensuring previously saved series metadata and watch history are accessible.

## Style Guidelines:

- Primary color: A muted, deep violet-blue (#8A8EED), symbolizing digital elegance and depth for interactive elements and highlights.
- Background color: A very dark, subtle blue-grey (#1C1C22), providing a cinematic backdrop for video content, ensuring excellent contrast.
- Accent color: A vibrant sky-blue (#1EC9F7), drawing attention to calls-to-action and important notifications, ensuring visibility against the dark background.
- Headline font: 'Space Grotesk' (sans-serif) for a modern, slightly technical feel on titles and key information.
- Body text font: 'Inter' (sans-serif) for clear readability in longer descriptions, labels, and subtitle display.
- Use minimalist line-art icons for player controls, navigation, and settings, maintaining consistency with the clean, modern UI and prioritizing clear function.
- A responsive two-column layout features a dominant video player area (left/top) paired with a collapsible tabbed control panel (right/bottom) for source, subtitles, audio, and history management.
- Incorporate smooth transitions for tab switching, control panel expansion/collapse, and progress updates to ensure a fluid user experience without distracting from content.