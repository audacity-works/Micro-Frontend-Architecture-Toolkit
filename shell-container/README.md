# Shell Container (Host Application)

The main host application that orchestrates and loads micro-frontends at runtime using Module Federation.

## Overview

The shell container provides:
- Navigation and routing
- Layout structure (header, main content, footer)
- Dynamic loading of remote micro-frontends
- Shared dependencies management

## Project Structure

```
shell-container/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx        # Bootstrap navbar with dropdown
│   │   └── Layout.tsx        # Main layout wrapper
│   ├── pages/
│   │   ├── Home.tsx          # Home page
│   │   └── AuthPage.tsx      # Loads remote Auth MFE SignIn
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts         # TypeScript declarations for remotes
├── vite.config.ts            # Module Federation config
└── package.json
```

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite (Rolldown)** - Build tool with experimental Rust-based bundler
- **Bootstrap 5** - UI framework
- **React Router DOM** - Client-side routing
- **@popperjs/core** - Dropdown positioning
- **@originjs/vite-plugin-federation** - Module Federation for Vite

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs on: http://localhost:5176/

## Build

```bash
npm run build
```

## Module Federation Configuration

The shell container consumes remote micro-frontends:

```typescript
federation({
  name: 'shell_container',
  remotes: {
    authMfe: 'http://localhost:5177/assets/remoteEntry.js',
  },
  shared: ['react', 'react-dom']
})
```

### Remote MFEs

- **authMfe** - Authentication micro-frontend
  - URL: http://localhost:5177/assets/remoteEntry.js
  - Exposed: `./SignIn` component

## Routes

- `/` - Home page
- `/auth` - Authentication (loads remote SignIn from auth-mfe)
- `/payments` - Payments (placeholder)
- `/orders` - Orders (placeholder)
- `/profile` - Profile (placeholder)

## Features

✅ Bootstrap 5 responsive navbar with dropdown menu  
✅ React Router for client-side navigation  
✅ Layout with header, main content area, and footer  
✅ Dynamic remote component loading with Suspense  
✅ Loading spinner while remote components load  
✅ TypeScript support with remote module declarations  

## Prerequisites

Before running the shell container, ensure the following remote MFEs are running:

1. **auth-mfe** must be built and running in preview mode on port 5177

## Running the Complete Platform

1. Start auth-mfe (in preview mode):
   ```bash
   cd ../auth-mfe
   npm run build
   npm run preview
   ```

2. Start shell-container (in dev mode):
   ```bash
   npm run dev
   ```

3. Open http://localhost:5176/ in your browser

4. Click "Authentication" in the navbar dropdown to see the remote SignIn component load

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment

- Node.js 18+ recommended
- Port 5176 (configurable in vite.config.ts)
