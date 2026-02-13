# Building a Micro-Frontend Architecture with Vite Federation

A comprehensive guide to creating a micro-frontend (MFE) architecture using Vite and Module Federation.

---

## Table of Contents

1. [Core Architecture Concepts](#core-architecture-concepts)
2. [Vite Module Federation Setup](#vite-module-federation-setup)
3. [Shell Container Implementation](#shell-container-implementation)
4. [Micro-Frontend Application Structure](#micro-frontend-application-structure)
5. [Dynamic Configuration & Registration](#dynamic-configuration--registration)
6. [Routing Strategy](#routing-strategy)
7. [State Management & Data Sharing](#state-management--data-sharing)
8. [Component Federation](#component-federation)
9. [Build & Deployment Strategy](#build--deployment-strategy)
10. [Best Practices & Considerations](#best-practices--considerations)

---

## Core Architecture Concepts

### 1. Architectural Layers

```
┌─────────────────────────────────────────────────┐
│           Shell Container (Host)                 │
│  - Navigation                                    │
│  - Layout                                        │
│  - Route orchestration                           │
│  - MFE loader                                    │
└─────────────────────────────────────────────────┘
                    ▲
                    │ (Module Federation)
        ┌───────────┼───────────┬──────────┐
        │           │           │          │
   ┌────▼───┐  ┌───▼────┐  ┌──▼─────┐  ┌─▼────────┐
   │ MFE 1  │  │ MFE 2  │  │ MFE 3  │  │  Shared  │
   │(Auth)  │  │(Orders)│  │(Profile)│ │Components│
   └────────┘  └────────┘  └────────┘  └──────────┘
```

### 2. Key Principles

- **Independent Development**: Each MFE is developed, tested, and deployed independently
- **Runtime Integration**: MFEs are loaded at runtime, not build time
- **Technology Agnostic**: Each MFE can use different tech stacks
- **Shared Nothing Architecture**: MFEs don't directly depend on each other
- **Configuration-Driven**: Dynamic registration without code changes

---

## Vite Module Federation Setup

### Installing Dependencies

```bash
npm install @originjs/vite-plugin-federation --save-dev
```

### Vite Configuration for Shell Container

```typescript
// vite.config.ts (Shell Container)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell_container',
      remotes: {
        authMfe: 'http://localhost:5177/assets/remoteEntry.js',
        paymentsMfe: 'http://localhost:5178/assets/remoteEntry.js',
        ordersMfe: 'http://localhost:5179/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom']
    })
  ],
  server: {
    port: 5176,
    strictPort: true
  },
  preview: {
    port: 5176,
    strictPort: true
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

### Vite Configuration for Micro-Frontend

```typescript
// vite.config.ts (MFE - e.g., auth-mfe)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'auth_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './SignIn': './src/components/SignIn.tsx',
        './SignUp': './src/components/SignUp.tsx',
        './AuthApp': './src/App.tsx',
      },
      shared: ['react', 'react-dom', 'react-router-dom']
    })
  ],
  server: {
    port: 5177,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 5177,
    strictPort: true,
    cors: true
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

### Key Differences from Webpack Module Federation

| Feature | Webpack | Vite |
|---------|---------|------|
| **Plugin** | `webpack.container.ModuleFederationPlugin` | `@originjs/vite-plugin-federation` |
| **Dev Mode** | Works in dev mode | Requires build + preview mode |
| **Speed** | Slower builds | Faster builds (Rolldown/Rollup) |
| **Config** | webpack.config.js | vite.config.ts |
| **Remote Path** | `/remoteEntry.js` | `/assets/remoteEntry.js` |
| **HMR** | Full HMR support | Limited HMR for remotes |

---

## Shell Container Implementation

### TypeScript Declarations for Remotes

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module 'authMfe/SignIn' {
  const SignIn: React.ComponentType;
  export default SignIn;
}

declare module 'authMfe/SignUp' {
  const SignUp: React.ComponentType;
  export default SignUp;
}

declare module 'paymentsMfe/PaymentForm' {
  const PaymentForm: React.ComponentType;
  export default PaymentForm;
}
```

### Dynamic Remote Loader Component

```typescript
// src/components/RemoteComponent.tsx
import { lazy, Suspense, ComponentType } from 'react';

interface RemoteComponentProps {
  remoteName: string;
  modulePath: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  [key: string]: any;
}

const RemoteComponent = ({
  remoteName,
  modulePath,
  fallback = <div>Loading...</div>,
  errorFallback = <div>Failed to load component</div>,
  ...props
}: RemoteComponentProps) => {
  const RemoteModule = lazy(() => {
    return import(`${remoteName}/${modulePath}`)
      .catch((error) => {
        console.error(`Failed to load ${remoteName}/${modulePath}:`, error);
        return {
          default: () => errorFallback
        };
      });
  });

  return (
    <Suspense fallback={fallback}>
      <RemoteModule {...props} />
    </Suspense>
  );
};

export default RemoteComponent;
```

### Configuration Service

```typescript
// src/services/configService.ts

export interface MFERoute {
  path: string;
  modulePath: string;
}

export interface MFEConfig {
  name: string;
  remoteName: string;
  url: string;
  port: number;
  routes: MFERoute[];
  exposedComponents: {
    name: string;
    modulePath: string;
  }[];
  enabled: boolean;
  preload?: boolean;
}

export const fetchMFEConfig = async (): Promise<MFEConfig[]> => {
  try {
    const response = await fetch('/config.json');
    const config = await response.json();
    return config.microFrontends || [];
  } catch (error) {
    console.error('Failed to fetch MFE configuration:', error);
    return [];
  }
};

export const validateMFEConfig = (mfeConfig: MFEConfig): boolean => {
  const requiredFields: (keyof MFEConfig)[] = ['name', 'remoteName', 'url', 'routes'];
  
  return requiredFields.every(field => {
    if (!mfeConfig[field]) {
      console.error(`Missing required field: ${field} in MFE config`);
      return false;
    }
    return true;
  });
};
```

### Configuration File Example

```json
// public/config.json
{
  "microFrontends": [
    {
      "name": "Authentication",
      "remoteName": "authMfe",
      "url": "http://localhost:5177",
      "port": 5177,
      "routes": [
        {
          "path": "/auth",
          "modulePath": "SignIn"
        },
        {
          "path": "/signup",
          "modulePath": "SignUp"
        }
      ],
      "exposedComponents": [
        {
          "name": "SignIn",
          "modulePath": "SignIn"
        },
        {
          "name": "SignUp",
          "modulePath": "SignUp"
        }
      ],
      "enabled": true,
      "preload": false
    },
    {
      "name": "Payments",
      "remoteName": "paymentsMfe",
      "url": "http://localhost:5178",
      "port": 5178,
      "routes": [
        {
          "path": "/payments",
          "modulePath": "PaymentApp"
        }
      ],
      "enabled": true
    }
  ]
}
```

### MFE Registry

```typescript
// src/core/MFERegistry.ts
import { MFEConfig, MFERoute } from '../services/configService';

interface RegisteredMFE {
  url: string;
  routes: MFERoute[];
  exposedComponents: { name: string; modulePath: string }[];
  loaded: boolean;
}

class MFERegistry {
  private registeredMFEs: Map<string, RegisteredMFE> = new Map();
  private loadedRemotes: Set<string> = new Set();

  register(mfeConfig: MFEConfig): void {
    const { remoteName, url, routes, exposedComponents } = mfeConfig;
    
    this.registeredMFEs.set(remoteName, {
      url,
      routes: routes || [],
      exposedComponents: exposedComponents || [],
      loaded: false,
    });
  }

  getAll(): Array<{ name: string } & RegisteredMFE> {
    return Array.from(this.registeredMFEs.entries()).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  get(remoteName: string): RegisteredMFE | null {
    return this.registeredMFEs.get(remoteName) || null;
  }

  markAsLoaded(remoteName: string): void {
    const mfe = this.registeredMFEs.get(remoteName);
    if (mfe) {
      mfe.loaded = true;
      this.loadedRemotes.add(remoteName);
    }
  }

  isLoaded(remoteName: string): boolean {
    return this.loadedRemotes.has(remoteName);
  }

  getAllRoutes(): Array<MFERoute & { remoteName: string; url: string }> {
    const routes: Array<MFERoute & { remoteName: string; url: string }> = [];
    
    this.registeredMFEs.forEach((config, remoteName) => {
      config.routes.forEach(route => {
        routes.push({
          ...route,
          remoteName,
          url: config.url,
        });
      });
    });
    
    return routes;
  }
}

export default new MFERegistry();
```

---

## Routing Strategy

### Dynamic Route Registration with React Router

```typescript
// src/core/AppRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MFERegistry from './MFERegistry';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import NotFound from '../pages/NotFound';
import Home from '../pages/Home';

const lazyLoadRemote = (remoteName: string, modulePath: string) => {
  return lazy(async () => {
    try {
      // @ts-ignore - dynamic import
      const module = await import(`${remoteName}/${modulePath}`);
      
      MFERegistry.markAsLoaded(remoteName);
      
      return {
        default: module.default || module,
      };
    } catch (error) {
      console.error(`Failed to load ${modulePath} from ${remoteName}:`, error);
      
      return {
        default: () => (
          <div className="alert alert-danger">
            <h2>Failed to load micro-frontend</h2>
            <p>Remote: {remoteName}</p>
            <p>Module: {modulePath}</p>
            <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ),
      };
    }
  });
};

const AppRoutes = () => {
  const allRoutes = MFERegistry.getAllRoutes();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        
        {allRoutes.map(({ path, modulePath, remoteName }) => {
          const Component = lazyLoadRemote(remoteName, modulePath);
          
          return (
            <Route
              key={`${remoteName}-${path}`}
              path={path}
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Component />
                </Suspense>
              }
            />
          );
        })}
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
```

---

## Micro-Frontend Application Structure

### MFE Entry Point (Bootstrap Pattern)

```typescript
// src/index.ts (in MFE)
import('./bootstrap')
  .then(() => {
    console.log('MFE application loaded');
  })
  .catch(err => {
    console.error('Failed to load MFE:', err);
  });
```

### Bootstrap File

```typescript
// src/bootstrap.tsx (in MFE)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const mount = (el: HTMLElement) => {
  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  return root;
};

// Standalone mode
if (process.env.NODE_ENV === 'development') {
  const devRoot = document.getElementById('root');
  
  if (devRoot) {
    mount(devRoot);
  }
}

export { mount };
```

### MFE App Component

```typescript
// src/App.tsx (in MFE)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import './App.css';

const App = () => {
  return (
    <div className="auth-mfe">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
```

---

## Build & Deployment Strategy

### Development Workflow

**For Shell Container (Host):**
```bash
npm run dev  # Runs on port 5176 with HMR
```

**For MFEs (Remotes):**
```bash
# Standalone development
npm run dev

# Integration testing with shell
npm run build && npm run preview
```

### Production Build

```bash
# Build all MFEs first
cd auth-mfe && npm run build
cd ../payments-mfe && npm run build
cd ../orders-mfe && npm run build

# Then build shell
cd ../shell-container && npm run build
```

### Environment-Specific Configuration

```typescript
// vite.config.ts with environment support
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      federation({
        name: 'auth_mfe',
        filename: 'remoteEntry.js',
        exposes: {
          './SignIn': './src/components/SignIn.tsx',
        },
        shared: ['react', 'react-dom']
      })
    ],
    server: {
      port: parseInt(env.VITE_PORT || '5177'),
    },
    build: {
      modulePreload: false,
      target: 'esnext',
    }
  };
});
```

### Deployment Scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "deploy:dev": "npm run build:dev && aws s3 sync dist/ s3://dev-mfe-bucket",
    "deploy:prod": "npm run build:prod && aws s3 sync dist/ s3://prod-mfe-bucket"
  }
}
```

---

## Best Practices & Considerations

### 1. Performance Optimization

- **Build Mode Required**: Vite Federation requires MFEs to be built for production/preview
- **Lazy Loading**: Always use React.lazy() for remote components
- **Code Splitting**: Vite automatically handles code splitting
- **Caching**: Configure proper cache headers for remoteEntry.js
- **Preloading**: Preload critical MFEs during idle time

### 2. Error Handling

```typescript
// Error Boundary for Remote Components
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RemoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Remote component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="alert alert-danger">
          <h3>Failed to load remote component</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RemoteErrorBoundary;
```

### 3. Security

- **CORS Configuration**: Enable CORS in MFE vite.config.ts
- **CSP Headers**: Set appropriate Content Security Policy
- **Authentication**: Share auth tokens securely via context
- **Input Validation**: Validate all data shared between MFEs

### 4. Testing Strategy

```typescript
// Mock remote modules for testing
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      'authMfe/SignIn': './src/__mocks__/authMfe/SignIn.tsx',
    },
  },
});
```

### 5. Versioning & Compatibility

- **Semantic Versioning**: Use semver for MFE releases
- **Version Manifest**: Track deployed MFE versions
- **Backward Compatibility**: Maintain compatibility when possible
- **Shared Dependencies**: Keep React versions in sync

### 6. Development Tips

**Hot Reload Limitations:**
- Shell container has full HMR in dev mode
- Remote MFEs require rebuild + preview restart for changes
- Use standalone dev mode for rapid MFE development

**TypeScript Support:**
- Always declare remote module types in vite-env.d.ts
- Use `// @ts-ignore` for dynamic imports if needed
- Consider generating types from exposed components

**Debugging:**
```typescript
// Enable verbose logging
if (import.meta.env.DEV) {
  console.log('MFE Registry:', MFERegistry.getAll());
  console.log('Loaded Remotes:', MFERegistry.getAllRoutes());
}
```

---

## Summary

Building a micro-frontend toolkit with Vite involves:

1. **Vite Plugin Federation** for runtime integration
2. **Build + Preview Mode** for MFEs (not dev mode)
3. **Dynamic Configuration** for flexible MFE registration
4. **Shared State Management** via Context API and Event Bus
5. **Component Federation** for cross-MFE component sharing
6. **Robust Error Handling** for resilience
7. **TypeScript Declarations** for type safety
8. **Independent Deployment** for each MFE

This architecture enables teams to work independently while maintaining a cohesive user experience with the performance benefits of Vite's fast build times.

## Key Takeaways

✅ Vite Federation is faster than Webpack but requires build mode  
✅ Remote path is `/assets/remoteEntry.js` (not `/remoteEntry.js`)  
✅ CORS must be enabled in MFE configurations  
✅ TypeScript declarations are essential for remote modules  
✅ Error boundaries protect against remote loading failures  
✅ Shared dependencies must be synchronized across MFEs  
