# Auth MFE (Authentication Micro-Frontend)

A standalone authentication micro-frontend that exposes a SignIn component via Module Federation.

## Overview

The auth-mfe provides:
- Sign-in/login functionality
- Bootstrap-styled authentication UI
- Exposed components for consumption by the shell container

## Project Structure

```
auth-mfe/
├── src/
│   ├── components/
│   │   ├── SignIn.tsx        # Sign-in component (exposed via Module Federation)
│   │   └── SignIn.css        # Sign-in component styles
│   ├── App.tsx               # Main app component
│   ├── App.css               # App styles
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── vite.config.ts            # Module Federation config
└── package.json
```

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite (Rolldown)** - Build tool with experimental Rust-based bundler
- **Bootstrap 5** - UI framework with floating labels
- **@originjs/vite-plugin-federation** - Module Federation for Vite

## Installation

```bash
npm install
```

## Development (Standalone)

```bash
npm run dev
```

Runs on: http://localhost:5177/

This mode allows you to develop and test the auth-mfe independently.

## Build for Module Federation

```bash
npm run build
```

Builds the application and generates the `remoteEntry.js` file required for Module Federation.

## Preview (Required for Module Federation)

```bash
npm run preview
```

Runs the built application on: http://localhost:5177/

**Important:** The shell container requires auth-mfe to be running in preview mode to load remote components.

## Module Federation Configuration

The auth-mfe exposes components for consumption by other applications:

```typescript
federation({
  name: 'auth_mfe',
  filename: 'remoteEntry.js',
  exposes: {
    './SignIn': './src/components/SignIn.tsx',
  },
  shared: ['react', 'react-dom']
})
```

### Exposed Components

- **./SignIn** - Sign-in component with email/password form

## Features

✅ Bootstrap 5 floating label form design  
✅ Email and password input fields with validation  
✅ "Remember me" checkbox  
✅ Responsive design  
✅ Beautiful gradient purple background  
✅ Form submission handling  
✅ Exposed via Module Federation for remote consumption  

## SignIn Component

The SignIn component includes:
- Email input (required)
- Password input (required)
- Remember me checkbox
- Sign in button
- Form validation
- Centered layout with shadow card

### Usage in Shell Container

```typescript
import { lazy, Suspense } from 'react';

const RemoteSignIn = lazy(() => import('authMfe/SignIn'));

function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteSignIn />
    </Suspense>
  );
}
```

## Running with Shell Container

1. Build and preview auth-mfe:
   ```bash
   npm run build
   npm run preview
   ```

2. In another terminal, start the shell-container:
   ```bash
   cd ../shell-container
   npm run dev
   ```

3. Navigate to http://localhost:5176/ and click "Authentication" in the navbar

## Scripts

- `npm run dev` - Start development server (standalone mode)
- `npm run build` - Build for production and Module Federation
- `npm run preview` - Preview production build (required for Module Federation)
- `npm run lint` - Run ESLint

## Environment

- Node.js 18+ recommended
- Port 5177 (configured in vite.config.ts)
- CORS enabled for cross-origin requests

## Development Workflow

### Standalone Development
When developing features independently:
```bash
npm run dev
```

### Integration with Shell
When testing integration with the shell container:
```bash
npm run build && npm run preview
```

## Future Enhancements

- [ ] Add registration/sign-up component
- [ ] Implement actual authentication logic
- [ ] Add password reset functionality
- [ ] Integrate with authentication API
- [ ] Add social login options
- [ ] Implement JWT token management
- [ ] Add form error handling and display
