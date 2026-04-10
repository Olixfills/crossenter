# Crossenter Features & UX Overview

Crossenter is a powerful, open-source presentation software designed for churches and live events. It handles complex media and display requirements with a focus on ease of use.

## Core Presentation Features

- **Dynamic Slideshows**: Create and edit slides with rich text, backgrounds, and transitions.
- **Show Mode**: A dedicated interface for managing live presentations, triggering slides, and monitoring outputs.
- **Rich Media Support**:
  - **Native Video & Audio**: Play local media files with advanced controls.
  - **Streaming Integration**: Built-in support for YouTube and Vimeo videos.
  - **Image Support**: Management of image assets for backgrounds and slides.
- **Scripture & Bible Integration**:
  - **Multiple Versions**: Support for various Bible versions via `json-bible`.
  - **Custom Formatting**: Control verses per slide, verse numbers, and reference display.
  - **Scripture History**: Quickly access recently used verses.
- **Song Lyrics**: Fetch lyrics directly via the **Genius Lyrics** integration.
- **PDF Display**: Import and project PDF documents.
- **Timed Events**: Use the **Calendar & Timers** system to schedule automated actions and triggers.

## Advanced Display & Output

- **Multi-Window Support**: Manage separate windows for Main Output, Stage Display, and PDF viewing.
- **Stage Display**: Custom layouts for performers and speakers, including clocks, timers, and current/next slide previews.
- **Hardware Integrations**:
  - **NDI Output**: Send high-quality video over the network.
  - **Blackmagic Design**: Support for DeckLink and other professional video hardware.
  - **LTC (Linear Timecode)**: Synchronize with other production equipment.
- **Transitions**: Smooth transitions between slides (Fade, Ease, etc.) for both media and text.

## Remote & Control

- **Remote Control**: Control the presentation from any device via a local web server or the dedicated companion app.
- **MIDI Support**: Use MIDI controllers to trigger slides or send MIDI commands to other hardware/software.
- **OSC (Open Sound Control)**: Integration with lighting boards, audio consoles, and automation systems.
- **Companion Integration**: Seamless connection with Bitfocus Companion for stream deck control.
- **Trigger System**: Set up complex triggers to automate tasks based on specific actions or conditions.

## Power User Tools & Automation

- **Conditional Logic**: Set up complex "If-Then" conditions for slide transitions and automated actions.
- **Dynamic Values & Variables**: Use variables within slides that can be updated in real-time or via external triggers (MIDI/OSC).
- **Regex Manager**: Advanced text processing and formatting using Regular Expressions.
- **Timer & Countdown System**: Manage multiple timers, countdowns, and clocks for service segments.
- **Action History**: A dedicated log of all triggered actions for debugging and review.

## UX Features & Interface

- **Profile Management**: Support for multiple user profiles, each with their own settings, projects, and permissions.
- **Global Keyboard Shortcuts**: Fully customizable hotkeys for every major action in the app.
- **Quick Search**: A global search for finding songs, scriptures, and media instantly.
- **On-Slide Drawing**:
  - **Focus Tool**: Highlight specific areas of the screen during a presentation.
  - **Paint Tool**: Draw or write directly on the projected slides in real-time.
- **Advanced Media Handling**:
  - **Media Fit & Aspect Ratio**: Granular control over how images and videos scale to fit different screen sizes.
  - **Camera Integration**: Select and project live camera feeds directly from within the app.
  - **Video Markers**: Tag specific timestamps in videos for quick navigation.

## Audio Power Tools

- **Multi-Channel Audio**: Routing audio to different outputs.
- **Audio Equalizer**: Fine-tune sound with a built-in EQ and presets.
- **Metronome**: Built-in metronome for musical synchronization.
- **Audio Streams**: Support for various audio streaming formats.

## Collaborative Cloud Sync & Data

- **Team Collaboration**: Sync projects and settings across multiple devices using **Google Drive** or the Crossenter cloud integration.
- **Import/Export Suite**: Support for importing from various presentation formats (e.g., Songbeamer) and exporting to PDF.
- **Local Data Reliability**: Efficient data management using a local SQLite database, ensuring performance even with large libraries.
- **Undo/Redo History**: Comprehensive history tracking for all editing actions.
