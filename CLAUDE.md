# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glass is a desktop application that acts as a digital mind extension - it captures screen content and audio, allows real-time AI-powered queries, and provides meeting summaries. Built with Electron + React/Next.js.

## Key Commands

### Development
```bash
# Initial setup - installs all dependencies and builds web app
npm run setup

# Start the app (builds renderer + starts Electron)
npm start

# Build renderer with watch mode for development
npm run watch:renderer

# Build everything (renderer + web app)
npm run build:all
```

### Web App (Next.js)
```bash
cd pickleglass_web
npm run dev    # Development server
npm run build  # Production build
```

### Building & Packaging
```bash
npm run build       # Build for current platform
npm run build:win   # Build for Windows specifically
npm run package     # Create unpacked directory
npm run publish     # Build and publish release
```

### Code Quality
```bash
npm run lint  # Run ESLint on .ts,.tsx,.js files
```

## Architecture Overview

### Main Process (Electron)
- **Entry**: `src/index.js` - Initializes app, manages windows, handles IPC
- **Windows**: `src/window/` - Window creation and management
- **Bridges**: `src/bridge/` - IPC communication bridges between processes

### Features (Domain-driven structure)
Each feature in `src/features/` follows this pattern:
- `*Service.js` - Business logic and orchestration
- `repositories/` - Data access layer with Firebase and SQLite implementations
- Repository pattern allows switching between local (SQLite) and cloud (Firebase) storage

Key features:
- **ask**: AI query functionality based on screen/audio context
- **listen**: Audio capture, speech-to-text, and meeting summaries
- **settings**: User preferences and API key management
- **shortcuts**: Keyboard shortcut configuration

### UI Layer
- **Renderer UI**: `src/ui/` - Lit-based custom elements for the main app
- **Web UI**: `pickleglass_web/` - Next.js app for web-based settings/activity views

### Data Layer
- **SQLite**: Local storage for offline mode
- **Firebase**: Cloud sync for authenticated users
- Repository interfaces allow seamless switching between storage backends

### AI Providers
Located in `src/features/common/ai/providers/`:
- OpenAI, Anthropic, Gemini, Ollama (local), Whisper (local STT)
- Factory pattern for provider selection

## Critical Implementation Details

### Authentication Flow
- Electron app can work offline (SQLite) or with Firebase auth
- Web app (`pickleglass_web`) requires authentication
- Auth state managed by `authService.js`

### Screen Capture
- Uses Electron's `desktopCapturer` API
- Captures are processed and sent to AI providers based on user queries

### Audio Processing
- Real-time audio capture with echo cancellation (`src/ui/listen/audioCore/`)
- STT service supports multiple providers (Deepgram, Whisper, etc.)

### IPC Communication
- Feature bridge: `featureBridge.js` handles service-level IPC
- Window bridge: `windowBridge.js` manages window-specific events
- All IPC channels prefixed by feature name (e.g., 'ask:', 'listen:')

### Build Process
- Renderer code built with esbuild (`build.js`)
- Two entry points: HeaderController and PickleGlassApp
- Web app built with Next.js standard build process

## Security Considerations
- API keys stored using Electron's safeStorage
- Keychain permissions required on macOS for secure storage
- Never commit API keys or sensitive data