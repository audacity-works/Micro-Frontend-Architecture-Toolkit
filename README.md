# Micro-Frontend Platform

A micro-frontend architecture platform built with React, TypeScript, Vite, Bootstrap, and Module Federation.

## Overview

This platform demonstrates a production-ready micro-frontend architecture where independent applications are dynamically loaded at runtime. The shell container orchestrates multiple micro-frontends, providing seamless navigation and integration.

## Project Structure

```
.
├── shell-container/          # Host application (Shell)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx   # Bootstrap navbar with dropdown
│   │   │   └── Layout.tsx   # Main layout wrapper
│   │   ├── pages/
│   │   │   ├── Home.tsx     # Home page
│   │   │   └── AuthPage.tsx # Loads remote Auth MFE
│   │   ├── App.tsx          # Main app with routing
│   │   └── main.tsx         # Entry point
│   ├── vite.config.ts       # Module Federation config
│   └── README.md            # Shell-specific documentation
│
├── auth-mfe/                 # Authentication Micro-Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── SignIn.tsx   # Sign-in component (exposed)
│   │   ├── App.tsx          # Auth MFE app
│   │   └── main.tsx         # Entry point
│   ├── vite.config.ts       # Module Federation config
│   └── README.md            # Auth MFE-specific documentation
│
└── README.md                 # This file - platform overview
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies for both applications
cd shell-container && npm install
cd ../auth-mfe && npm install
```

### Running the Platform

**Step 1: Start Auth MFE (must be first)**

```bash
cd auth-mfe
npm run build      # Build for Module Federation
npm run preview    # Run in preview mode on port 5177
```

**Step 2: Start Shell Container**

```bash
cd shell-container
npm run dev        # Run in dev mode on port 5176
```

**Step 3: Access the Application**

Open http://localhost:5176/ in your browser and click "Authentication" in the navbar dropdown to see the remote SignIn component load dynamically.

## Architecture

### Module Federation

The platform uses `@originjs/vite-plugin-federation` to enable runtime integration:

```
┌─────────────────────────────────────────────────┐
│         Shell Container (Host)                   │
│  - Port: 5176 (dev mode)                        │
│  - Provides: Navigation, Layout, Routing        │
│  - Consumes: Remote MFE components              │
└─────────────────────────────────────────────────┘
                    ▲
                    │ (Module Federation - Runtime)
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────▼───────┐         ┌────▼────────┐
   │  Auth MFE  │         │ Future MFEs │
   │ Port: 5177 │         │  (Payments, │
   │ (preview)  │         │   Orders)   │
   └────────────┘         └─────────────┘
```

### Key Concepts

- **Shell Container**: Host application that provides the main layout and orchestrates MFEs
- **Remote MFEs**: Independent applications that expose components via Module Federation
- **Runtime Integration**: MFEs are loaded dynamically at runtime, not bundled at build time
- **Shared Dependencies**: React and React-DOM are shared between shell and MFEs

## Technologies

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Vite (Rolldown)** | Build tool (experimental Rust-based bundler) |
| **Bootstrap 5** | UI framework |
| **React Router** | Client-side routing |
| **Module Federation** | Runtime micro-frontend integration |
| **Popper.js** | Dropdown positioning |

## Features

### Shell Container
✅ Bootstrap 5 navbar with dropdown menu  
✅ React Router for navigation  
✅ Responsive layout with header and footer  
✅ Home page with MFE overview  
✅ Dynamic remote component loading  
✅ Loading spinner while remote components load  
✅ TypeScript support  

### Auth MFE
✅ Sign-in component with Bootstrap floating labels  
✅ Form validation  
✅ Responsive design  
✅ Beautiful gradient background  
✅ Exposed via Module Federation  
✅ Standalone development mode  

## Development Workflow

### Developing Shell Container

```bash
cd shell-container
npm run dev
```

The shell runs in dev mode with hot module replacement.

### Developing Auth MFE

**Standalone mode** (for independent development):
```bash
cd auth-mfe
npm run dev
```

**Integration mode** (for testing with shell):
```bash
cd auth-mfe
npm run build && npm run preview
```

### Making Changes

1. **Auth MFE changes**: After making changes, rebuild and restart preview
   ```bash
   npm run build && npm run preview
   ```

2. **Shell Container changes**: Hot reload works automatically in dev mode

## Routes

| Path | Description | Source |
|------|-------------|--------|
| `/` | Home page | Shell Container |
| `/auth` | Authentication | Auth MFE (remote) |
| `/payments` | Payments | Placeholder |
| `/orders` | Orders | Placeholder |
| `/profile` | Profile | Placeholder |

## Module Federation Details

### Shell Container Configuration

```typescript
remotes: {
  authMfe: 'http://localhost:5177/assets/remoteEntry.js',
}
```

### Auth MFE Configuration

```typescript
exposes: {
  './SignIn': './src/components/SignIn.tsx',
}
```

## Troubleshooting

### 404 Error Loading Remote

**Problem**: `Failed to load resource: 404 (Not Found)` for remoteEntry.js

**Solution**: Ensure auth-mfe is built and running in preview mode:
```bash
cd auth-mfe
npm run build
npm run preview
```

### CORS Errors

**Problem**: CORS policy blocking remote loading

**Solution**: CORS is enabled in auth-mfe vite.config.ts. Ensure both apps are running on their configured ports.

### Port Conflicts

**Problem**: Port already in use

**Solution**: 
- Auth MFE uses port 5177 (configured in vite.config.ts)
- Shell Container uses port 5176 (configured in vite.config.ts)
- Change ports in respective vite.config.ts files if needed

## Project Documentation

- [Shell Container README](./shell-container/README.md) - Detailed shell documentation
- [Auth MFE README](./auth-mfe/README.md) - Detailed auth-mfe documentation
- [Micro-Frontend Toolkit Guide](./micro-frontend-toolkit-guide.md) - Architecture guide

## Next Steps

- [ ] Add shared state management (Context API or Redux)
- [ ] Implement actual authentication logic with JWT
- [ ] Create additional MFEs (Payments, Orders, Profile)
- [ ] Add error boundaries for better error handling
- [ ] Implement loading states and skeleton screens
- [ ] Add E2E tests with Playwright or Cypress
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and analytics
- [ ] Implement version management for MFEs
- [ ] Add deployment documentation

## Contributing

Each micro-frontend can be developed independently. Follow these guidelines:

1. Maintain independent package.json for each MFE
2. Use semantic versioning for MFE releases
3. Document exposed components in MFE README
4. Test both standalone and integrated modes
5. Keep shared dependencies in sync

## License

MIT

## Resources

- [Module Federation Documentation](https://module-federation.io/)
- [Vite Plugin Federation](https://github.com/originjs/vite-plugin-federation)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [React Router Documentation](https://reactrouter.com/)
