# Building a Micro-Frontend Architecture Toolkit

A comprehensive guide to creating your own micro-frontend (MFE) architecture system.

---

## Table of Contents

1. [Core Architecture Concepts](#core-architecture-concepts)
2. [Module Federation Setup](#module-federation-setup)
3. [Shell Container Implementation](#shell-container-implementation)
4. [Micro-Frontend Application Structure](#micro-frontend-application-structure)
5. [Shared Components Library](#shared-components-library)
6. [Dynamic Configuration & Registration](#dynamic-configuration--registration)
7. [Routing Strategy](#routing-strategy)
8. [State Management & Data Sharing](#state-management--data-sharing)
9. [Component Federation](#component-federation)
10. [Build & Deployment Strategy](#build--deployment-strategy)
11. [CLI Tool Development](#cli-tool-development)

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

## Module Federation Setup

### Webpack Configuration for Shell Container

```javascript
// webpack.config.js (Shell Container)
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    publicPath: 'auto',
    clean: true,
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
          },
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell_container',
      filename: 'remoteEntry.js',
      remotes: {
        // Dynamically loaded via config
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
          eager: true,
        },
        'react-router-dom': {
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

### Webpack Configuration for Micro-Frontend

```javascript
// webpack.config.js (MFE - e.g., payments-mfe)
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    publicPath: 'auto',
    clean: true,
  },
  devServer: {
    port: 3001,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
          },
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'payments_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './PaymentsApp': './src/App.jsx',
        './PaymentWidget': './src/components/PaymentWidget.jsx',
        './routes': './src/routes.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-router-dom': {
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

---

## Shell Container Implementation

### Dynamic Remote Loader

```javascript
// src/utils/dynamicRemoteLoader.js

/**
 * Dynamically loads a remote module at runtime
 * @param {string} remoteName - The name of the remote (e.g., 'payments_mfe')
 * @param {string} remoteUrl - The URL where the remote is hosted
 * @returns {Promise} - Resolves when the remote is loaded
 */
export const loadRemoteModule = (remoteName, remoteUrl) => {
  return new Promise((resolve, reject) => {
    const remoteKey = `${remoteName}@${remoteUrl}/remoteEntry.js`;
    
    // Check if already loaded
    if (window[remoteName]) {
      resolve(window[remoteName]);
      return;
    }

    const script = document.createElement('script');
    script.src = remoteUrl.endsWith('/remoteEntry.js') 
      ? remoteUrl 
      : `${remoteUrl}/remoteEntry.js`;
    
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      // Initialize the container
      const container = window[remoteName];
      
      if (!container) {
        reject(new Error(`Remote ${remoteName} not found`));
        return;
      }

      // Get shared dependencies
      const sharedScope = {
        react: {
          '18.0.0': {
            get: () => Promise.resolve(() => require('react')),
            loaded: true,
          },
        },
        'react-dom': {
          '18.0.0': {
            get: () => Promise.resolve(() => require('react-dom')),
            loaded: true,
          },
        },
      };

      // Initialize shared scope
      container.init(sharedScope);
      resolve(container);
    };

    script.onerror = () => {
      reject(new Error(`Failed to load remote: ${remoteName} from ${remoteUrl}`));
    };

    document.head.appendChild(script);
  });
};

/**
 * Gets a specific module from a loaded remote
 * @param {string} remoteName - The remote name
 * @param {string} modulePath - The module path (e.g., './App')
 * @returns {Promise<any>} - The loaded module
 */
export const getRemoteModule = async (remoteName, modulePath) => {
  const container = window[remoteName];
  
  if (!container) {
    throw new Error(`Remote ${remoteName} not initialized`);
  }

  const factory = await container.get(modulePath);
  const module = factory();
  
  return module;
};
```

### Configuration Service

```javascript
// src/services/configService.js

/**
 * Fetches MFE configuration from the backend/config file
 * @returns {Promise<Array>} - Array of MFE configurations
 */
export const fetchMFEConfig = async () => {
  try {
    const response = await fetch('/config.json'); // or your API endpoint
    const config = await response.json();
    return config.microFrontends || [];
  } catch (error) {
    console.error('Failed to fetch MFE configuration:', error);
    return [];
  }
};

/**
 * Validates MFE configuration
 * @param {Object} mfeConfig - MFE configuration object
 * @returns {boolean} - True if valid
 */
export const validateMFEConfig = (mfeConfig) => {
  const requiredFields = ['name', 'remoteName', 'url', 'routes'];
  
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
      "name": "Payments",
      "remoteName": "payments_mfe",
      "url": "http://localhost:3001",
      "routes": [
        {
          "path": "/payments",
          "modulePath": "./PaymentsApp"
        }
      ],
      "exposedComponents": [
        {
          "name": "PaymentWidget",
          "modulePath": "./PaymentWidget"
        }
      ],
      "enabled": true
    },
    {
      "name": "Orders",
      "remoteName": "orders_mfe",
      "url": "http://localhost:3002",
      "routes": [
        {
          "path": "/orders",
          "modulePath": "./OrdersApp"
        }
      ],
      "enabled": true
    }
  ]
}
```

### MFE Registry

```javascript
// src/core/MFERegistry.js

class MFERegistry {
  constructor() {
    this.registeredMFEs = new Map();
    this.loadedRemotes = new Set();
  }

  /**
   * Registers a micro-frontend
   * @param {Object} mfeConfig - MFE configuration
   */
  register(mfeConfig) {
    const { remoteName, url, routes, exposedComponents } = mfeConfig;
    
    this.registeredMFEs.set(remoteName, {
      url,
      routes: routes || [],
      exposedComponents: exposedComponents || [],
      loaded: false,
    });
  }

  /**
   * Gets all registered MFEs
   * @returns {Array} - Array of MFE configurations
   */
  getAll() {
    return Array.from(this.registeredMFEs.entries()).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  /**
   * Gets a specific MFE by name
   * @param {string} remoteName - The remote name
   * @returns {Object|null} - MFE configuration or null
   */
  get(remoteName) {
    return this.registeredMFEs.get(remoteName) || null;
  }

  /**
   * Marks an MFE as loaded
   * @param {string} remoteName - The remote name
   */
  markAsLoaded(remoteName) {
    const mfe = this.registeredMFEs.get(remoteName);
    if (mfe) {
      mfe.loaded = true;
      this.loadedRemotes.add(remoteName);
    }
  }

  /**
   * Checks if an MFE is loaded
   * @param {string} remoteName - The remote name
   * @returns {boolean}
   */
  isLoaded(remoteName) {
    return this.loadedRemotes.has(remoteName);
  }

  /**
   * Gets all routes from all registered MFEs
   * @returns {Array} - Array of route configurations
   */
  getAllRoutes() {
    const routes = [];
    
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

### Shell App Setup

```javascript
// src/core/setupApp.js

import { fetchMFEConfig, validateMFEConfig } from '../services/configService';
import { loadRemoteModule } from '../utils/dynamicRemoteLoader';
import MFERegistry from './MFERegistry';

/**
 * Initializes the shell application
 * Loads MFE configuration and registers all micro-frontends
 */
export const setupApp = async () => {
  try {
    // 1. Fetch MFE configuration
    const mfeConfigs = await fetchMFEConfig();
    
    // 2. Validate and register MFEs
    const validConfigs = mfeConfigs.filter(config => {
      if (!validateMFEConfig(config)) {
        console.warn(`Skipping invalid MFE config:`, config);
        return false;
      }
      return config.enabled !== false; // Only load enabled MFEs
    });

    // 3. Register all valid MFEs
    validConfigs.forEach(config => {
      MFERegistry.register(config);
    });

    // 4. Pre-load critical MFEs (optional)
    const criticalMFEs = validConfigs.filter(c => c.preload === true);
    
    await Promise.all(
      criticalMFEs.map(async (config) => {
        try {
          await loadRemoteModule(config.remoteName, config.url);
          MFERegistry.markAsLoaded(config.remoteName);
          console.log(`Pre-loaded MFE: ${config.remoteName}`);
        } catch (error) {
          console.error(`Failed to pre-load MFE ${config.remoteName}:`, error);
        }
      })
    );

    return {
      success: true,
      registeredMFEs: MFERegistry.getAll(),
    };
  } catch (error) {
    console.error('Failed to setup app:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

### Main App Component

```javascript
// src/core/App.jsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { setupApp } from './setupApp';
import AppRoutes from './AppRoutes';
import LoadingScreen from '../components/LoadingScreen';
import ErrorBoundary from '../components/ErrorBoundary';

const App = () => {
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const result = await setupApp();
      
      if (result.success) {
        setAppReady(true);
      } else {
        setError(result.error);
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h1>Failed to initialize application</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!appReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
```

---

## Routing Strategy

### Dynamic Route Registration

```javascript
// src/core/AppRoutes.jsx

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MFERegistry from './MFERegistry';
import { loadRemoteModule, getRemoteModule } from '../utils/dynamicRemoteLoader';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import NotFound from '../pages/NotFound';

/**
 * Lazy loads a remote component
 */
const lazyLoadRemote = (remoteName, modulePath, url) => {
  return lazy(async () => {
    try {
      // Load the remote if not already loaded
      if (!MFERegistry.isLoaded(remoteName)) {
        await loadRemoteModule(remoteName, url);
        MFERegistry.markAsLoaded(remoteName);
      }

      // Get the specific module
      const module = await getRemoteModule(remoteName, modulePath);
      
      return {
        default: module.default || module,
      };
    } catch (error) {
      console.error(`Failed to load ${modulePath} from ${remoteName}:`, error);
      
      // Return error component
      return {
        default: () => (
          <div className="mfe-error">
            <h2>Failed to load micro-frontend</h2>
            <p>Remote: {remoteName}</p>
            <p>Module: {modulePath}</p>
            <p>Error: {error.message}</p>
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
        {/* Home route */}
        <Route index element={<div>Welcome to MFE Platform</div>} />
        
        {/* Dynamically registered MFE routes */}
        {allRoutes.map(({ path, modulePath, remoteName, url }) => {
          const Component = lazyLoadRemote(remoteName, modulePath, url);
          
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
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
```

### Layout Component

```javascript
// src/components/Layout.jsx

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import MFERegistry from '../core/MFERegistry';
import './Layout.scss';

const Layout = () => {
  const allRoutes = MFERegistry.getAllRoutes();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1>MFE Platform</h1>
          <nav className="main-nav">
            <Link to="/">Home</Link>
            {allRoutes.map(({ path, remoteName }) => (
              <Link key={`${remoteName}-${path}`} to={path}>
                {path.split('/')[1] || 'Home'}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        <Outlet />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2026 MFE Platform</p>
      </footer>
    </div>
  );
};

export default Layout;
```

---

## Micro-Frontend Application Structure

### MFE Application Entry Point

```javascript
// src/index.js (in MFE)

import('./bootstrap')
  .then(() => {
    console.log('MFE application loaded');
  })
  .catch(err => {
    console.error('Failed to load MFE:', err);
  });
```

### Bootstrap File

```javascript
// src/bootstrap.jsx (in MFE)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';

// Mount function for standalone mode
const mount = (el) => {
  const root = ReactDOM.createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  return root;
};

// If running in standalone mode
if (process.env.NODE_ENV === 'development' && !window.__POWERED_BY_SHELL__) {
  const devRoot = document.getElementById('root');
  
  if (devRoot) {
    mount(devRoot);
  }
}

export { mount };
```

### MFE App Component

```javascript
// src/App.jsx (in MFE)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import routes from './routes';
import './App.scss';

const App = () => {
  return (
    <div className="mfe-app">
      <BrowserRouter>
        <Routes>
          {routes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
```

### Routes Configuration

```javascript
// src/routes.js (in MFE)

import HomePage from './pages/HomePage';
import DetailsPage from './pages/DetailsPage';
import SettingsPage from './pages/SettingsPage';

const routes = [
  {
    path: '/payments',
    component: HomePage,
    exact: true,
  },
  {
    path: '/payments/details',
    component: DetailsPage,
  },
  {
    path: '/payments/settings',
    component: SettingsPage,
  },
];

export default routes;
```

---

## State Management & Data Sharing

### Global Context Provider (in Shared Components)

```javascript
// shared-components/src/context/GlobalContext.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalContext = createContext(null);

export const GlobalContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  const [sharedData, setSharedData] = useState({});

  // User management
  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  // Theme management
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Notifications
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Generic data sharing between MFEs
  const setData = useCallback((key, value) => {
    setSharedData(prev => ({ ...prev, [key]: value }));
  }, []);

  const getData = useCallback((key) => {
    return sharedData[key];
  }, [sharedData]);

  const value = {
    user,
    login,
    logout,
    theme,
    toggleTheme,
    notifications,
    addNotification,
    removeNotification,
    setData,
    getData,
    sharedData,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  
  if (!context) {
    throw new Error('useGlobalContext must be used within GlobalContextProvider');
  }
  
  return context;
};
```

### Event Bus for Cross-MFE Communication

```javascript
// shared-components/src/utils/eventBus.js

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    this.events.get(eventName).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   */
  emit(eventName, data) {
    if (!this.events.has(eventName)) {
      return;
    }
    
    this.events.get(eventName).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Event name
   */
  off(eventName) {
    this.events.delete(eventName);
  }

  /**
   * Clear all events
   */
  clear() {
    this.events.clear();
  }
}

export default new EventBus();
```

### Usage in MFEs

```javascript
// In any MFE
import { useGlobalContext } from 'shared/GlobalContext';
import eventBus from 'shared/eventBus';

const PaymentComponent = () => {
  const { user, setData, getData } = useGlobalContext();

  useEffect(() => {
    // Subscribe to events
    const unsubscribe = eventBus.on('payment:completed', (data) => {
      console.log('Payment completed:', data);
      setData('lastPayment', data);
    });

    return () => unsubscribe();
  }, []);

  const handlePayment = async () => {
    // Process payment
    const result = await processPayment();
    
    // Emit event for other MFEs
    eventBus.emit('payment:completed', result);
  };

  return <div>Payment Component</div>;
};
```

---

## Component Federation

### Federated Component Loader

```javascript
// shared-components/src/components/MFEComponentLoader.jsx

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { loadRemoteModule, getRemoteModule } from '../utils/remoteLoader';
import MFERegistry from '../core/MFERegistry';

/**
 * Dynamically loads and renders a federated component
 * @param {string} componentName - The exposed component path (e.g., './Header')
 * @param {string} moduleName - Optional: specific remote name
 * @param {Object} props - Props to pass to the component
 */
const MFEComponentLoader = ({ 
  componentName, 
  moduleName = null, 
  fallback = <div>Loading component...</div>,
  errorFallback = null,
  ...props 
}) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        let targetRemote = moduleName;

        // If no module name specified, search for component
        if (!targetRemote) {
          const allMFEs = MFERegistry.getAll();
          
          for (const mfe of allMFEs) {
            const exposedComponent = mfe.exposedComponents?.find(
              c => c.modulePath === componentName
            );
            
            if (exposedComponent) {
              targetRemote = mfe.name;
              break;
            }
          }
        }

        if (!targetRemote) {
          throw new Error(`Component ${componentName} not found in any MFE`);
        }

        const mfeConfig = MFERegistry.get(targetRemote);
        
        if (!mfeConfig) {
          throw new Error(`MFE ${targetRemote} not registered`);
        }

        // Load remote if not loaded
        if (!MFERegistry.isLoaded(targetRemote)) {
          await loadRemoteModule(targetRemote, mfeConfig.url);
          MFERegistry.markAsLoaded(targetRemote);
        }

        // Get the component
        const module = await getRemoteModule(targetRemote, componentName);
        setComponent(() => module.default || module);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load component:', err);
        setError(err);
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentName, moduleName]);

  if (loading) {
    return fallback;
  }

  if (error) {
    if (errorFallback) {
      return typeof errorFallback === 'function' 
        ? errorFallback(error) 
        : errorFallback;
    }
    
    return (
      <div className="mfe-component-error">
        <p>Failed to load component: {componentName}</p>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!Component) {
    return null;
  }

  return <Component {...props} />;
};

export default MFEComponentLoader;
```

### Usage Example

```javascript
// In any MFE or Shell
import MFEComponentLoader from 'shared/MFEComponentLoader';

const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      
      {/* Load header from payments MFE */}
      <MFEComponentLoader 
        componentName="./Header"
        moduleName="payments_mfe"
        fallback={<div>Loading header...</div>}
      />
      
      {/* Load payment widget (auto-discover which MFE) */}
      <MFEComponentLoader 
        componentName="./PaymentWidget"
        amount={100}
        currency="USD"
      />
    </div>
  );
};
```

---

## Build & Deployment Strategy

### Environment-Specific Configurations

```javascript
// webpack.config.js (with environment support)

const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const mfeName = process.env.MFE_NAME || 'payments_mfe';
  const publicPath = process.env.PUBLIC_PATH || 'auto';

  return {
    mode: argv.mode || 'development',
    entry: './src/index.js',
    output: {
      publicPath,
      clean: true,
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.MFE_NAME': JSON.stringify(mfeName),
      }),
      // ... other plugins
    ],
    optimization: isProduction ? {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
          },
        },
      },
      runtimeChunk: 'single',
    } : {},
  };
};
```

### Deployment Scripts

```json
// package.json
{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development",
    "build:staging": "cross-env PUBLIC_PATH=https://staging.example.com npm run build",
    "build:prod": "cross-env PUBLIC_PATH=https://prod.example.com npm run build",
    "deploy:dev": "npm run build:dev && aws s3 sync dist/ s3://dev-mfe-bucket",
    "deploy:prod": "npm run build:prod && aws s3 sync dist/ s3://prod-mfe-bucket"
  }
}
```

### Version Management

```javascript
// src/version.js

export const MFE_VERSION = process.env.MFE_VERSION || '1.0.0';
export const BUILD_TIME = new Date().toISOString();

// Expose version info
if (typeof window !== 'undefined') {
  window.__MFE_VERSION__ = {
    version: MFE_VERSION,
    buildTime: BUILD_TIME,
  };
}
```

---

## CLI Tool Development

### CLI Structure

```
create-mfe-cli/
├── bin/
│   └── cli.js              # Entry point
├── src/
│   ├── commands/
│   │   ├── init.js         # Bootstrap new MFE platform
│   │   ├── add.js          # Add new MFE
│   │   └── generate.js     # Generate components
│   ├── templates/
│   │   ├── shell/          # Shell container template
│   │   ├── mfe/            # MFE template
│   │   └── shared/         # Shared components template
│   ├── utils/
│   │   ├── fileSystem.js   # File operations
│   │   ├── prompts.js      # User prompts
│   │   └── validation.js   # Input validation
│   └── index.js
├── package.json
└── README.md
```

### CLI Implementation

```javascript
// bin/cli.js

#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { initPlatform } = require('../src/commands/init');
const { addMFE } = require('../src/commands/add');

program
  .name('create-mfe-app')
  .description('CLI to bootstrap micro-frontend applications')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new MFE platform')
  .option('-d, --dir <directory>', 'Target directory', './mfe-workspace')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Initializing MFE Platform...'));
    await initPlatform(options);
  });

program
  .command('add')
  .description('Add a new micro-frontend to existing platform')
  .option('-n, --name <name>', 'MFE name')
  .option('-p, --port <port>', 'Development port')
  .action(async (options) => {
    console.log(chalk.blue('➕ Adding new MFE...'));
    await addMFE(options);
  });

program.parse(process.argv);
```

### Init Command

```javascript
// src/commands/init.js

const inquirer = require('inquirer');
const chalk = require('chalk');
const { copyTemplate, updateConfig } = require('../utils/fileSystem');
const { validateProjectName, validatePort } = require('../utils/validation');

async function initPlatform(options) {
  try {
    // Prompt for configuration
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'mfe-platform',
        validate: validateProjectName,
      },
      {
        type: 'input',
        name: 'shellPort',
        message: 'Shell container port:',
        default: '3000',
        validate: validatePort,
      },
      {
        type: 'input',
        name: 'sharedPort',
        message: 'Shared components port:',
        default: '3001',
        validate: validatePort,
      },
      {
        type: 'input',
        name: 'mfeName',
        message: 'First MFE name:',
        default: 'payments',
        validate: validateProjectName,
      },
      {
        type: 'input',
        name: 'mfePort',
        message: 'First MFE port:',
        default: '3002',
        validate: validatePort,
      },
    ]);

    const targetDir = options.dir;

    // Create shell container
    console.log(chalk.yellow('Creating shell container...'));
    await copyTemplate('shell', `${targetDir}/shell-container`, {
      projectName: answers.projectName,
      port: answers.shellPort,
    });

    // Create shared components
    console.log(chalk.yellow('Creating shared components...'));
    await copyTemplate('shared', `${targetDir}/shared-components`, {
      port: answers.sharedPort,
    });

    // Create first MFE
    console.log(chalk.yellow(`Creating ${answers.mfeName} MFE...`));
    await copyTemplate('mfe', `${targetDir}/${answers.mfeName}-mfe`, {
      name: answers.mfeName,
      port: answers.mfePort,
    });

    console.log(chalk.green('✅ MFE platform initialized successfully!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(`  cd ${targetDir}/shell-container && npm install`);
    console.log(`  cd ${targetDir}/shared-components && npm install`);
    console.log(`  cd ${targetDir}/${answers.mfeName}-mfe && npm install`);
    console.log('\nThen run:');
    console.log('  npm start (in each directory)');
  } catch (error) {
    console.error(chalk.red('Error initializing platform:'), error);
    process.exit(1);
  }
}

module.exports = { initPlatform };
```

---

## Best Practices & Considerations

### 1. Performance Optimization

- **Lazy Loading**: Load MFEs only when needed
- **Code Splitting**: Split vendor and application code
- **Caching**: Use proper cache headers for remoteEntry.js
- **Preloading**: Preload critical MFEs during idle time

### 2. Error Handling

- **Graceful Degradation**: Show fallback UI when MFE fails to load
- **Error Boundaries**: Wrap each MFE in error boundary
- **Retry Logic**: Implement retry mechanisms for failed loads
- **Monitoring**: Track MFE load failures and performance

### 3. Security

- **CORS Configuration**: Properly configure CORS for cross-origin loading
- **CSP Headers**: Set appropriate Content Security Policy
- **Authentication**: Share auth tokens securely via context
- **Input Validation**: Validate all data shared between MFEs

### 4. Testing Strategy

- **Unit Tests**: Test individual components within each MFE
- **Integration Tests**: Test MFE integration with shell
- **E2E Tests**: Test complete user flows across MFEs
- **Contract Tests**: Test exposed component interfaces

### 5. Versioning & Compatibility

- **Semantic Versioning**: Use semver for MFE releases
- **Breaking Changes**: Document and communicate breaking changes
- **Backward Compatibility**: Maintain compatibility when possible
- **Version Pinning**: Pin shared dependency versions

---

## Summary

Building a micro-frontend toolkit involves:

1. **Module Federation** for runtime integration
2. **Dynamic Configuration** for flexible MFE registration
3. **Shared State Management** via Context API and Event Bus
4. **Component Federation** for cross-MFE component sharing
5. **Robust Error Handling** for resilience
6. **CLI Tooling** for developer experience
7. **Deployment Strategy** for independent releases

This architecture enables teams to work independently while maintaining a cohesive user experience.
