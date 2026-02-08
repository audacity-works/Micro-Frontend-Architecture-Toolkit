# Micro-Frontend Platform

A micro-frontend architecture platform built with React, TypeScript, Vite, Bootstrap, and Module Federation.

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
│   └── vite.config.ts       # Module Federation config
│
└── auth-mfe/                 # Authentication Micro-Frontend
    ├── src/
    │   ├── components/
    │   │   └── SignIn.tsx   # Sign-in component (exposed)
    │   ├── App.tsx          # Auth MFE app
    │   └── main.tsx         # Entry point
    └── vite.config.ts       # Module Federation config
```

## Running the Applications

### Auth MFE (must start first)
```bash
cd auth-mfe
npm install
npm run build      # Build for Module Federation
npm run preview    # Run in preview mode on port 5177
```
Access at: http://localhost:5177/

### Shell Container
```bash
cd shell-container
npm install
npm run dev        # Run in dev mode on port 5176
```
Access at: http://localhost:5176/

**Important:** 
- Auth-mfe must be built and running in preview mode for Module Federation to work
- The shell container loads the remote component from the built auth-mfe
- Start auth-mfe before shell-container

## Features

### Shell Container
- ✅ Bootstrap 5 navbar with dropdown menu
- ✅ React Router for navigation
- ✅ Responsive layout with header and footer
- ✅ Home page with MFE overview
- ✅ **Module Federation integration** - dynamically loads auth-mfe SignIn component
- ✅ Loading spinner while remote component loads

### Auth MFE
- ✅ Sign-in component with Bootstrap floating labels
- ✅ Form validation
- ✅ Responsive design
- ✅ Beautiful gradient background
- ✅ **Exposed via Module Federation** - SignIn component available to shell

## Module Federation Setup

The platform uses `@originjs/vite-plugin-federation` to enable runtime integration:

- **auth-mfe** exposes `./SignIn` component
- **shell-container** consumes it as `authMfe/SignIn`
- Shared dependencies: React, React-DOM

When you click "Authentication" in the navbar, the shell dynamically loads the SignIn component from auth-mfe at runtime.

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite (Rolldown)** - Build tool (experimental Rust-based bundler)
- **Bootstrap 5** - UI framework
- **React Router** - Client-side routing
- **Popper.js** - Dropdown positioning
- **Module Federation** - Runtime micro-frontend integration

## Next Steps

1. ✅ Configure Module Federation for runtime integration
2. Add shared state management
3. Implement authentication logic
4. Create additional MFEs (Payments, Orders, Profile)
5. Add error boundaries and loading states
