<div align="center">
  <img src="src/assets/logo.png" alt="Crossenter Logo" width="120" />
  <h1>Crossenter</h1>
  <p><strong>Powerful, free, and open-source multi-window presentation software for live media and projection teams.</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
  [![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB.svg)](https://reactjs.org/)
  [![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-47848F.svg)](https://www.electronjs.org/)

  <p>
    <a href="#key-features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#for-developers">Developers</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 📽️ What is Crossenter?

Crossenter is a high-performance presentation desktop application designed specifically for churches and live events. Built with modern web technologies, it offers a sleek, intuitive interface that handles complex multi-window displays, media playback, and professional equipment integration with ease.

Whether you're projecting scripture, managing lyrics, or triggering network-based cues via MIDI or OSC, Crossenter provides a reliable and free alternative to expensive proprietary solutions.

---

## ✨ Key Features

### 📖 Scripture & Bible Management
- **Multiple Versions**: Import and manage various Bible versions via standard XML formats.
- **Smart Formatting**: Control verse layout, numbers, and references with granular precision.
- **Quick Search**: Find any verse in seconds with the global quick-search bar.

### 🎵 Songs & Lyrics
- **Genius Integration**: Fetch lyrics directly from the web with built-in Genius Lyrics support.
- **Dynamic Slide Layouts**: Professional typography and background management for readable presentations.

### 🖼️ Rich Media Library
- **Local & Remote**: Seamlessly manage local videos, images, and PDFs alongside YouTube and Vimeo streams.
- **Native Performance**: Leverages Electron's hardware acceleration for smooth 4K playback.

### 🕹️ Professional Control
- **Multi-Window Output**: Dedicated windows for Main Output and Stage Display (foldback).
- **Network Triggers**: Full support for **MIDI**, **OSC**, and **Bitfocus Companion** for professional production workflows.
- **NDI Support**: Send high-quality video over your network for streaming or recording.

---

## 🚀 Getting Started

To get started with Crossenter, simply download the latest release for your operating system (Windows, Mac, or Linux) from our [Releases](https://github.com/Olixfills/crossenter/releases) page.

1. **Install** the application.
2. **Import** your Bible XML files.
3. **Build** your first playlist by adding songs, scripture, and media.
4. **Go Live!**

---

## 💻 For Developers

Crossenter is built with **Vite**, **React**, and **Electron**, using **Tailwind CSS** for styling and **Better-SQLite3** for high-performance data persistence.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Olixfills/crossenter.git
   cd crossenter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run electron:build
   ```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Zustand (State Management), Tailwind CSS
- **Backend/Main Process**: Electron, Node.js
- **Database**: Better-SQLite3
- **Tools**: Vite, TypeScript, Lucide Icons, Adm-Zip

---

## 🤝 Contributing

We love contributions! Whether you're fixing a bug, adding a feature, or improving documentation, feel free to open a Pull Request.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by the Crossenter Community</p>
</div>
