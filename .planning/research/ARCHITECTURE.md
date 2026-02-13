# Architecture Research: React Frontend ↔ Hono API Integration

**Domain:** SaaS frontend-backend integration (React 18 + Hono/Cloudflare Workers)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

This architecture connects a React 18 SPA frontend to a Hono-based Cloudflare Workers API backend with JWT authentication, Stripe billing, and real-time tracking features. The architecture follows modern best practices: Context API for auth state, axios interceptors for token management, protected routes with React Router 7, and structured API service layer.

**Key Integration Points:**
1. JWT auth flow (login → localStorage → axios interceptors → refresh)
2. React Context for auth state across component tree
3. Protected routes with React Router 7 middleware pattern
4. Stripe Checkout Session flow (frontend initiates → backend creates → redirect → webhook confirms)
5. Multi-step wizard patterns for site setup
6. Code display with syntax highlighting and clipboard copy

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                       │
│                                                                  │
│  ┌────────────────┐     ┌──────────────────┐                   │
│  │  Auth Context  │────▶│  Protected Routes│                   │
│  │  - JWT Token   │     │  - Dashboard     │                   │
│  │  - User State  │     │  - Admin         │                   │
│  │  - Refresh     │     │  - GTM Compiler  │                   │
│  └────────────────┘     └──────────────────┘                   │
│          │                       │                              │
│          ▼                       ▼                              │
│  ┌───────────────────────────────────────────┐                 │
│  │         API Service Layer (Axios)         │                 │
│  │  - Interceptors (attach JWT)              │                 │
│  │  - Error handling (401 → logout)          │                 │
│  │  - Retry logic                            │                 │
│  └───────────────────────────────────────────┘                 │
│          │                                                      │
└──────────┼──────────────────────────────────────────────────────┘
           │
           │ HTTP (Authorization: Bearer <token>)
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                   BACKEND (Hono/Cloudflare Workers)             │
│                                                                  │
│  ┌────────────────┐     ┌──────────────────┐                   │
│  │  CORS Middleware│────▶│  Auth Middleware │                   │
│  │  (Allow origin) │     │  (JWT verify)    │                   │
│  └────────────────┘     └──────────────────┘                   │
│                                 │                               │
│                                 ▼                               │
│  ┌───────────────────────────────────────────┐                 │
│  │              Route Handlers                │                 │
│  │  /auth/login  → Generate JWT               │                 │
│  │  /auth/signup → Create user + JWT          │                 │
│  │  /api/v1/*    → Protected endpoints        │                 │
│  │  /billing/*   → Stripe integration         │                 │
│  └───────────────────────────────────────────┘                 │
│                                 │                               │
│                                 ▼                               │
│  ┌───────────────────────────────────────────┐                 │
│  │          Services Layer                    │                 │
│  │  - Database queries (D1)                   │                 │
│  │  - Google Ads API                          │                 │
│  │  - Stripe SDK                              │                 │
│  └───────────────────────────────────────────┘                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────┐
         │      External Services               │
         │  - Stripe (Checkout Session)         │
         │  - Google Ads (Conversions)          │
         │  - Cloudflare D1 (Database)          │
         └──────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Key Files |
|-----------|----------------|-----------|
| **Auth Context Provider** | Manage authentication state, token storage, user info | `src/contexts/AuthContext.tsx` |
| **API Service Layer** | Centralized HTTP client with interceptors | `src/services/api.ts` |
| **Protected Route Wrapper** | Block unauthenticated access to routes | `src/components/ProtectedRoute.tsx` |
| **Login/Signup Pages** | Auth forms, call backend, store JWT | `src/pages/Login.tsx`, `src/pages/Signup.tsx` |
| **Dashboard** | Display user data, call protected endpoints | `src/pages/Dashboard.tsx` |
| **Onboarding Wizard** | Multi-step form for site setup | `src/components/OnboardingWizard.tsx` |
| **Tracking Snippet Display** | Show code with syntax highlighting + copy | `src/components/SnippetDisplay.tsx` |
| **Stripe Checkout Button** | Initiate checkout session | `src/components/BillingButton.tsx` |
| **Backend Auth Middleware** | Verify JWT on every protected request | `serverless/src/middleware/auth.ts` |
| **Backend Auth Routes** | Login/signup logic, generate JWT | `serverless/src/routes/auth.ts` |
| **Backend Billing Routes** | Create Checkout Session, handle webhooks | `serverless/src/routes/billing.ts` |

## Recommended Project Structure

```
frontend/src/
├── contexts/
│   └── AuthContext.tsx              # Auth state provider (token, user, login, logout)
├── services/
│   ├── api.ts                       # Axios instance + interceptors
│   ├── auth.service.ts              # login(), signup(), logout()
│   ├── billing.service.ts           # createCheckoutSession()
│   ├── sites.service.ts             # getSites(), createSite()
│   └── events.service.ts            # getEvents(), createEvent()
├── components/
│   ├── ProtectedRoute.tsx           # Auth guard for routes
│   ├── Layout.tsx                   # Shared layout with nav
│   ├── OnboardingWizard/
│   │   ├── index.tsx                # Wizard orchestrator
│   │   ├── StepIndicator.tsx        # Progress bar
│   │   ├── Step1SiteDetails.tsx     # Form step 1
│   │   └── Step2Integration.tsx     # Form step 2
│   └── SnippetDisplay/
│       ├── index.tsx                # Code block component
│       ├── SyntaxHighlighter.tsx    # Prism.js wrapper
│       └── CopyButton.tsx           # Copy to clipboard
├── pages/
│   ├── Login.tsx                    # Login form
│   ├── Signup.tsx                   # Signup form
│   ├── Dashboard.tsx                # Main dashboard
│   ├── Admin.tsx                    # Admin panel
│   └── GTMCompiler.tsx              # GTM snippet tool
├── hooks/
│   ├── useAuth.ts                   # Access auth context
│   └── useApi.ts                    # Type-safe API calls
└── types/
    ├── auth.types.ts                # User, AuthState
    └── api.types.ts                 # API response shapes

serverless/src/
├── routes/
│   ├── auth.ts                      # POST /auth/login, /auth/signup
│   ├── billing.ts                   # POST /billing/create-session, POST /billing/webhook
│   ├── sites.ts                     # GET/POST /api/v1/sites
│   └── events.ts                    # GET/POST /api/v1/custom-events
└── middleware/
    └── auth.ts                      # JWT verification middleware
```

## Architectural Patterns

### Pattern 1: JWT Auth Flow

**Purpose:** Secure authentication with token-based access control

**Implementation:**

```typescript
// BACKEND: Generate JWT on login (serverless/src/routes/auth.ts)
import { sign } from 'hono/jwt';

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  
  // Validate credentials (check DB)
  const user = await validateUser(c.env.DB, email, password);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Generate JWT
  const token = await sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    org_id: user.org_id,
    iss: 'adsengineer',
    aud: 'adsengineer-api',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  }, c.env.JWT_SECRET, 'HS256');

  return c.json({ 
    success: true, 
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

// BACKEND: Verify JWT on protected routes (serverless/src/middleware/auth.ts)
import { jwt } from 'hono/jwt';

// Already implemented - see existing auth.ts middleware
export const authMiddleware = (options = { requireAuth: true }) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyAndDecodeJWT(token, c.env.JWT_SECRET);
    
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('auth', {
      user_id: payload.sub,
      org_id: payload.org_id,
      role: payload.role,
    });

    return next();
  };
};
```

```typescript
// FRONTEND: Auth Context Provider (frontend/src/contexts/AuthContext.tsx)
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  org_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    isLoading,
  }), [user, token, login, logout, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Token Storage:**
- Use `localStorage` for persistence across sessions
- Alternative: `sessionStorage` for session-only (more secure, lost on tab close)
- Never store in cookies on SPA (CSRF risk)

**Token Expiration Handling:**
- Backend returns `exp` claim in JWT (24 hours recommended)
- Frontend checks expiration before requests (optional optimization)
- On 401 response, clear token and redirect to login

### Pattern 2: Protected Routes with React Router 7

**Purpose:** Block unauthenticated users from accessing protected pages

**Implementation:**

```typescript
// FRONTEND: ProtectedRoute wrapper (frontend/src/components/ProtectedRoute.tsx)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

```typescript
// FRONTEND: App.tsx with protected routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="gtm-compiler" element={<GTMCompilerPage />} />
            <Route path="admin/agencies" element={<AgenciesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**Post-Login Redirect:**
```typescript
// In Login component
const location = useLocation();
const from = location.state?.from?.pathname || '/';

// After successful login
navigate(from, { replace: true });
```

### Pattern 3: API Service Layer with Axios Interceptors

**Purpose:** Centralize HTTP logic, attach JWT automatically, handle errors globally

**Implementation:**

```typescript
// FRONTEND: API service layer (frontend/src/services/api.ts)
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Forbidden - show error
      console.error('Access denied');
    }

    if (error.response?.status >= 500) {
      // Server error - show generic message
      console.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
```

```typescript
// FRONTEND: Auth service (frontend/src/services/auth.service.ts)
import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/signup', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Optional: call backend logout endpoint to invalidate token
    await api.post('/auth/logout');
  },
};
```

```typescript
// FRONTEND: Sites service (frontend/src/services/sites.service.ts)
import api from './api';

export interface Site {
  id: string;
  name: string;
  url: string;
  tracking_id: string;
}

export const sitesService = {
  getSites: async (): Promise<Site[]> => {
    const response = await api.get<{ data: Site[] }>('/v1/sites');
    return response.data.data;
  },

  createSite: async (site: Omit<Site, 'id'>): Promise<Site> => {
    const response = await api.post<{ data: Site }>('/v1/sites', site);
    return response.data.data;
  },
};
```

**Retry Logic (Optional):**
```typescript
import axiosRetry from 'axios-retry';

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
      || (error.response?.status ?? 0) >= 500;
  },
});
```

### Pattern 4: Stripe Checkout Integration Flow

**Purpose:** Secure payment processing with Stripe Checkout Sessions

**Flow Diagram:**
```
User clicks "Subscribe"
         │
         ▼
Frontend: POST /billing/create-checkout-session
         │
         ▼
Backend: Create Stripe Checkout Session
         │ (Returns session.client_secret)
         ▼
Frontend: Redirect to session.url
         │
         ▼
User completes payment on Stripe
         │
         ▼
Stripe: Sends webhook to /billing/webhook
         │
         ▼
Backend: Verify webhook signature → Update DB
         │
         ▼
Stripe: Redirects user to return_url
         │
         ▼
Frontend: Show success page
```

**Implementation:**

```typescript
// BACKEND: Create Checkout Session (serverless/src/routes/billing.ts)
import Stripe from 'stripe';

app.post('/billing/create-checkout-session', authMiddleware(), async (c) => {
  const auth = c.get('auth');
  const { priceId, planName } = await c.req.json();

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId, // e.g., 'price_1234567890'
        quantity: 1,
      },
    ],
    customer_email: auth.user_id, // Or lookup email from DB
    metadata: {
      user_id: auth.user_id,
      org_id: auth.org_id,
      plan_name: planName,
    },
    success_url: `${c.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.FRONTEND_URL}/billing/cancel`,
  });

  return c.json({ 
    success: true,
    sessionId: session.id,
    url: session.url,
  });
});
```

```typescript
// BACKEND: Webhook handler (serverless/src/routes/billing.ts)
import type { Stripe } from 'stripe';

app.post('/billing/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.json({ error: 'Invalid signature' }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update user subscription in database
      await c.env.DB.prepare(`
        UPDATE users 
        SET subscription_status = 'active',
            stripe_customer_id = ?,
            stripe_subscription_id = ?
        WHERE id = ?
      `).bind(
        session.customer,
        session.subscription,
        session.metadata.user_id
      ).run();
      
      console.log('Subscription activated:', session.id);
      break;

    case 'customer.subscription.updated':
      // Handle subscription changes
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  return c.json({ received: true });
});
```

```typescript
// FRONTEND: Billing service (frontend/src/services/billing.service.ts)
import api from './api';

export interface CreateCheckoutSessionRequest {
  priceId: string;
  planName: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export const billingService = {
  createCheckoutSession: async (data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>(
      '/billing/create-checkout-session',
      data
    );
    return response.data;
  },

  redirectToCheckout: async (priceId: string, planName: string): Promise<void> => {
    const { url } = await billingService.createCheckoutSession({ priceId, planName });
    window.location.href = url; // Redirect to Stripe Checkout
  },
};
```

```typescript
// FRONTEND: Billing button component (frontend/src/components/BillingButton.tsx)
import { useState } from 'react';
import { billingService } from '../services/billing.service';

export function BillingButton({ priceId, planName }: { priceId: string; planName: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await billingService.redirectToCheckout(priceId, planName);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="btn-primary disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Subscribe Now'}
    </button>
  );
}
```

**Success Page:**
```typescript
// FRONTEND: Success page (frontend/src/pages/BillingSuccess.tsx)
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Optional: Verify session status with backend
    api.get(`/billing/session-status?session_id=${sessionId}`)
      .then((response) => {
        if (response.data.payment_status === 'paid') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return <div>Verifying payment...</div>;
  }

  if (status === 'error') {
    return <div>Payment verification failed. Please contact support.</div>;
  }

  return (
    <div className="text-center">
      <h1>Subscription Activated!</h1>
      <p>Welcome to AdsEngineer. Your account is now active.</p>
      <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
    </div>
  );
}
```

### Pattern 5: Multi-Step Onboarding Wizard

**Purpose:** Guide users through site setup with progress tracking

**Implementation:**

```typescript
// FRONTEND: Wizard orchestrator (frontend/src/components/OnboardingWizard/index.tsx)
import { useState } from 'react';
import { StepIndicator } from './StepIndicator';
import { Step1SiteDetails } from './Step1SiteDetails';
import { Step2Integration } from './Step2Integration';
import { Step3Verification } from './Step3Verification';

interface WizardData {
  siteName: string;
  siteUrl: string;
  platform: 'shopify' | 'woocommerce' | 'custom';
  trackingId?: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    siteName: '',
    siteUrl: '',
    platform: 'custom',
  });

  const totalSteps = 3;

  const handleNext = (stepData: Partial<WizardData>) => {
    setData({ ...data, ...stepData });
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    // Submit all data to backend
    try {
      const response = await sitesService.createSite({
        name: data.siteName,
        url: data.siteUrl,
        platform: data.platform,
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Site creation failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <StepIndicator currentStep={step} totalSteps={totalSteps} />

      {step === 1 && (
        <Step1SiteDetails 
          initialData={data}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <Step2Integration
          initialData={data}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <Step3Verification
          data={data}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
```

```typescript
// FRONTEND: Step indicator (frontend/src/components/OnboardingWizard/StepIndicator.tsx)
export function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2
            ${step <= currentStep 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-white border-gray-300 text-gray-400'
            }
          `}>
            {step}
          </div>
          
          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-1 mx-2
              ${step < currentStep ? 'bg-blue-600' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}
```

```typescript
// FRONTEND: Step 1 - Site Details (frontend/src/components/OnboardingWizard/Step1SiteDetails.tsx)
import { useState } from 'react';

export function Step1SiteDetails({ initialData, onNext }) {
  const [siteName, setSiteName] = useState(initialData.siteName || '');
  const [siteUrl, setSiteUrl] = useState(initialData.siteUrl || '');
  const [platform, setPlatform] = useState(initialData.platform || 'custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ siteName, siteUrl, platform });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Site Details</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Site Name</label>
        <input
          type="text"
          required
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="input-field"
          placeholder="My Online Store"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Site URL</label>
        <input
          type="url"
          required
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          className="input-field"
          placeholder="https://mystore.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as any)}
          className="input-field"
        >
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="custom">Custom / Other</option>
        </select>
      </div>

      <button type="submit" className="btn-primary w-full">
        Next
      </button>
    </form>
  );
}
```

### Pattern 6: Tracking Snippet Display with Copy-to-Clipboard

**Purpose:** Show installation code with syntax highlighting and easy copying

**Implementation:**

```typescript
// FRONTEND: Snippet display component (frontend/src/components/SnippetDisplay/index.tsx)
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SnippetDisplayProps {
  code: string;
  language?: string;
  title?: string;
}

export function SnippetDisplay({ code, language = 'javascript', title }: SnippetDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      fallbackCopy(code);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <button
            onClick={handleCopy}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
          }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>

        {!title && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
```

```typescript
// FRONTEND: Usage in dashboard (frontend/src/pages/Dashboard.tsx)
import { SnippetDisplay } from '../components/SnippetDisplay';
import { useSites } from '../hooks/useSites';

export function Dashboard() {
  const { sites } = useSites();
  const selectedSite = sites[0]; // Or from state

  const trackingCode = `
<!-- AdsEngineer Tracking -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js';
    script.async = true;
    script.dataset.trackingId = '${selectedSite?.tracking_id}';
    document.head.appendChild(script);
  })();
</script>
  `.trim();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Installation</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Step 1: Add tracking code to your website
        </h2>
        
        <p className="text-gray-600 mb-4">
          Copy the code below and paste it in the <code>&lt;head&gt;</code> section 
          of your website, right before the closing <code>&lt;/head&gt;</code> tag.
        </p>

        <SnippetDisplay
          code={trackingCode}
          language="html"
          title="Tracking Code"
        />
      </div>
    </div>
  );
}
```

**Dependencies:**
```bash
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

## Data Flow

### Auth Flow

```
┌─────────────┐
│ User enters │
│ credentials │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────┐
│ Frontend: POST /auth/login     │
│ { email, password }            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: Validate credentials  │
│ - Query DB for user            │
│ - Compare password hash        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: Generate JWT          │
│ - Payload: { sub, email, role }│
│ - Sign with JWT_SECRET         │
│ - exp: 24 hours                │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend: Store token          │
│ - localStorage.setItem('token')│
│ - Set AuthContext state        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend: Redirect to /        │
│ - ProtectedRoute allows access │
└────────────────────────────────┘

SUBSEQUENT REQUESTS:
┌────────────────────────────────┐
│ User navigates to /dashboard   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ API interceptor adds header    │
│ Authorization: Bearer <token>  │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: authMiddleware()      │
│ - Extract token                │
│ - Verify signature             │
│ - Check expiration             │
│ - Set c.set('auth', payload)   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: Route handler         │
│ - Access auth via c.get('auth')│
│ - Query DB with user_id        │
│ - Return data                  │
└────────────────────────────────┘
```

### Onboarding Flow (Multi-Step Wizard)

```
Step 1: Site Details
├─ User fills form (name, URL, platform)
├─ Frontend validates inputs
├─ State stored in wizard component
└─ Click "Next" → Step 2

Step 2: Integration Setup
├─ Display platform-specific instructions
├─ Generate tracking snippet (call backend or local)
├─ Show SnippetDisplay component
└─ Click "Next" → Step 3

Step 3: Verification
├─ Frontend: POST /api/v1/sites (create site)
├─ Backend: Insert into DB, return tracking_id
├─ Frontend: Poll /api/v1/sites/:id/verify (check if snippet detected)
├─ Backend: Query recent events for tracking_id
└─ Success → Redirect to /dashboard
```

### Dashboard Data Flow

```
Component Mount
      │
      ▼
useEffect → Load initial data
      │
      ├─ GET /api/v1/sites → Display site list
      ├─ GET /api/v1/events?last=24h → Show recent events
      └─ GET /api/v1/stats → Render charts
      │
      ▼
User Interaction
      │
      ├─ Click "Add Site" → Open OnboardingWizard
      ├─ Click site → Update selectedSite state
      └─ Change date range → Re-fetch events
      │
      ▼
Real-time Updates (Optional)
      │
      └─ WebSocket or polling → Refresh event count
```

## Anti-Patterns

### ❌ Anti-Pattern 1: Token in URL/Query Params

**Problem:** Tokens in URLs are logged in browser history, server logs, and analytics.

```typescript
// BAD
window.location.href = `/dashboard?token=${token}`;
```

**Solution:** Use localStorage or sessionStorage.

```typescript
// GOOD
localStorage.setItem('auth_token', token);
window.location.href = '/dashboard';
```

### ❌ Anti-Pattern 2: Direct API Calls in Components

**Problem:** No centralized error handling, token attachment, or retry logic.

```typescript
// BAD - In component
const fetchData = async () => {
  const response = await fetch('/api/v1/sites', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const data = await response.json();
  setSites(data);
};
```

**Solution:** Use API service layer.

```typescript
// GOOD - Use service
import { sitesService } from '../services/sites.service';

const fetchData = async () => {
  const sites = await sitesService.getSites();
  setSites(sites);
};
```

### ❌ Anti-Pattern 3: Storing Secrets in Frontend

**Problem:** API keys, secrets visible in bundled JavaScript.

```typescript
// BAD
const STRIPE_SECRET_KEY = 'sk_live_...';
```

**Solution:** Backend creates Checkout Session, frontend only redirects.

```typescript
// GOOD - Backend only
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
```

### ❌ Anti-Pattern 4: No Token Expiration Handling

**Problem:** Expired tokens cause silent failures or infinite loops.

**Solution:** Intercept 401 responses and redirect to login.

```typescript
// GOOD
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### ❌ Anti-Pattern 5: Blocking UI on Wizard Navigation

**Problem:** Losing form data when user clicks "Back".

**Solution:** Store wizard state in component state or context.

```typescript
// GOOD
const [data, setData] = useState<WizardData>({});

const handleNext = (stepData) => {
  setData({ ...data, ...stepData }); // Merge step data
  setStep(step + 1);
};

const handleBack = () => {
  setStep(step - 1); // Data persists
};
```

### ❌ Anti-Pattern 6: Unprotected Stripe Webhook Endpoint

**Problem:** Anyone can send fake webhooks.

**Solution:** Always verify webhook signature.

```typescript
// GOOD
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  c.env.STRIPE_WEBHOOK_SECRET // Verify
);
```

## Integration Points

### Frontend → Backend (API Calls)

| Frontend Action | Backend Endpoint | Method | Auth Required |
|----------------|------------------|--------|---------------|
| Login form submit | `/auth/login` | POST | No |
| Signup form submit | `/auth/signup` | POST | No |
| Load dashboard data | `/api/v1/sites` | GET | Yes (JWT) |
| Create new site | `/api/v1/sites` | POST | Yes (JWT) |
| Subscribe to plan | `/billing/create-checkout-session` | POST | Yes (JWT) |
| Load custom events | `/api/v1/custom-events` | GET | Yes (JWT) |
| Create event definition | `/api/v1/custom-event-definitions` | POST | Yes (JWT) |

### Backend → External Services

| Backend Action | External Service | Notes |
|----------------|------------------|-------|
| Create Checkout Session | Stripe API | Uses `STRIPE_SECRET_KEY` |
| Verify webhook | Stripe | Uses `STRIPE_WEBHOOK_SECRET` |
| Upload conversion | Google Ads API | Uses OAuth refresh token per agency |
| Store data | Cloudflare D1 | Bound in `wrangler.jsonc` |

### CORS Configuration

**Backend (Hono):**
```typescript
import { cors } from 'hono/cors';

app.use('/*', cors({
  origin: [
    'http://localhost:3000', // Local dev
    'https://app.adsengineer.com', // Production
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

**Frontend (Vite proxy):**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});
```

## Build Order Implications

### Phase 1: Auth Foundation
**Build First:**
1. Backend: JWT middleware (`serverless/src/middleware/auth.ts`) ✅ Already exists
2. Backend: Auth routes (`serverless/src/routes/auth.ts`) - Login/signup endpoints
3. Frontend: Auth Context (`frontend/src/contexts/AuthContext.tsx`)
4. Frontend: API service layer (`frontend/src/services/api.ts`)
5. Frontend: Login/Signup pages

**Why This Order:**
- Auth is a dependency for all protected routes
- API service layer enables all subsequent features
- Testing auth early prevents rework

### Phase 2: Protected Routes
**Build Next:**
1. Frontend: ProtectedRoute component
2. Frontend: Layout component (shared nav/sidebar)
3. Frontend: Dashboard scaffold (empty page)

**Why This Order:**
- Protected routes depend on Auth Context
- Layout is shared across all protected pages
- Dashboard is the landing page after login

### Phase 3: Core Features
**Build Next:**
1. Backend: Sites routes (`/api/v1/sites`)
2. Frontend: Sites service + Dashboard UI
3. Frontend: SnippetDisplay component
4. Frontend: OnboardingWizard

**Why This Order:**
- Sites are core data model (tracks which websites are monitored)
- SnippetDisplay needed for onboarding
- Wizard ties together site creation flow

### Phase 4: Billing
**Build Last:**
1. Backend: Billing routes (`/billing/*`)
2. Backend: Stripe webhook handler
3. Frontend: Billing service + BillingButton
4. Frontend: Success/cancel pages

**Why This Order:**
- Billing is separate concern from core functionality
- Can develop/test core features without Stripe
- Webhook endpoint can be tested independently

## Sources

**HIGH Confidence Sources:**

1. **React Context API:** https://react.dev/reference/react/useContext
   - Official React documentation for Context API
   - Authentication state management patterns
   - Performance optimization with useMemo/useCallback

2. **React Router 7 Protected Routes:** https://github.com/remix-run/react-router/blob/main/docs/how-to/middleware.md
   - Official React Router middleware patterns
   - Authentication guards and redirects
   - Loader-based auth with context

3. **Hono JWT Middleware:** https://context7.com/honojs/website/llms.txt
   - Official Hono JWT middleware documentation
   - Token verification with environment variables
   - CORS configuration for Cloudflare Workers

4. **Stripe Checkout Session Flow:** https://docs.stripe.com/payments/checkout/custom-success-page
   - Official Stripe documentation
   - Creating embedded/hosted Checkout Sessions
   - Webhook verification and event handling

5. **Existing Codebase:**
   - `serverless/src/middleware/auth.ts` - JWT verification implementation (HMAC-based, custom)
   - `frontend/src/App.tsx` - Current routing structure
   - `frontend/vite.config.ts` - Proxy configuration to port 8090

**MEDIUM Confidence Sources:**

6. **GitHub Code Examples (Multi-step forms):**
   - Repository: langgenius/dify, Significant-Gravitas/AutoGPT
   - Pattern: `const [step, setStep] = useState(1)` for wizard state
   - Shows real-world wizard implementations in TypeScript

7. **GitHub Code Examples (Clipboard copy):**
   - Repository: Significant-Gravitas/AutoGPT, supabase/supabase
   - Pattern: `navigator.clipboard.writeText()` with fallback
   - Production-tested clipboard handling

**Notes:**
- All architectural patterns verified against official documentation
- Code examples adapted to project's specific stack (React 18 + Hono + Cloudflare Workers)
- Existing auth middleware already implements custom JWT verification (not using Hono's jwt() helper)
- Vite proxy already configured to forward `/api` to port 8090
