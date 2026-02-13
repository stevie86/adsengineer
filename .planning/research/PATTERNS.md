# Quick Reference: Integration Patterns

**Purpose:** Fast lookup for common implementation patterns during development
**Last Updated:** 2026-02-13

## 🔐 Auth Pattern: Login Flow

**Frontend (Login.tsx):**
```typescript
import { useAuth } from '../contexts/AuthContext';

const { login } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(email, password);
    navigate('/dashboard');
  } catch (error) {
    setError('Invalid credentials');
  }
};
```

**Backend (auth.ts):**
```typescript
import { sign } from 'hono/jwt';

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await validateUser(c.env.DB, email, password);
  
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await sign({
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  }, c.env.JWT_SECRET);

  return c.json({ token, user });
});
```

## 🛡️ Protected Route Pattern

**Component:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

**Usage:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🌐 API Service Pattern

**Setup (api.ts):**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
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

export default api;
```

**Service (sites.service.ts):**
```typescript
import api from './api';

export const sitesService = {
  getSites: async () => {
    const { data } = await api.get('/v1/sites');
    return data.data;
  },

  createSite: async (site) => {
    const { data } = await api.post('/v1/sites', site);
    return data.data;
  },
};
```

## 💳 Stripe Checkout Pattern

**Frontend (BillingButton.tsx):**
```typescript
const handleCheckout = async () => {
  const { url } = await api.post('/billing/create-checkout-session', {
    priceId: 'price_123',
    planName: 'Pro',
  });
  window.location.href = url; // Redirect to Stripe
};
```

**Backend (billing.ts):**
```typescript
import Stripe from 'stripe';

app.post('/billing/create-checkout-session', authMiddleware(), async (c) => {
  const auth = c.get('auth');
  const { priceId, planName } = await c.req.json();

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: auth.user_id, plan_name: planName },
    success_url: `${c.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.FRONTEND_URL}/billing/cancel`,
  });

  return c.json({ url: session.url });
});
```

**Webhook Handler:**
```typescript
app.post('/billing/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const event = stripe.webhooks.constructEvent(
    body, 
    signature, 
    c.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await c.env.DB.prepare(`
      UPDATE users SET subscription_status = 'active' WHERE id = ?
    `).bind(session.metadata.user_id).run();
  }

  return c.json({ received: true });
});
```

## 🧙 Multi-Step Wizard Pattern

**Parent Component:**
```typescript
const [step, setStep] = useState(1);
const [data, setData] = useState({});

const handleNext = (stepData) => {
  setData({ ...data, ...stepData });
  setStep(step + 1);
};

return (
  <>
    <StepIndicator current={step} total={3} />
    {step === 1 && <Step1 onNext={handleNext} initialData={data} />}
    {step === 2 && <Step2 onNext={handleNext} onBack={() => setStep(1)} initialData={data} />}
    {step === 3 && <Step3 data={data} onComplete={handleComplete} />}
  </>
);
```

**Step Component:**
```typescript
export function Step1({ onNext, initialData }) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData); // Pass data up
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name} 
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit">Next</button>
    </form>
  );
}
```

## 📋 Copy-to-Clipboard Pattern

**Component:**
```typescript
import { useState } from 'react';

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}
```

## 🎨 Code Display with Syntax Highlighting

**Component:**
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeBlock({ code, language = 'javascript' }) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      showLineNumbers
      customStyle={{ padding: '1rem', borderRadius: '0.5rem' }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
```

**Usage:**
```typescript
const trackingCode = `<script src="https://cdn.example.com/snippet.js"></script>`;

<CodeBlock code={trackingCode} language="html" />
```

## 🔄 Loading States Pattern

**Component:**
```typescript
export function Dashboard() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    sitesService.getSites()
      .then(setSites)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {sites.map(site => <SiteCard key={site.id} site={site} />)}
    </div>
  );
}
```

## 🚨 Error Handling Pattern

**API Service:**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    
    switch (error.response?.status) {
      case 401:
        // Unauthorized - logout
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        break;
      case 403:
        // Forbidden
        alert('You do not have permission to access this resource');
        break;
      case 404:
        // Not found
        console.warn('Resource not found');
        break;
      case 500:
        // Server error
        alert('Server error. Please try again later.');
        break;
    }
    
    return Promise.reject(new Error(message));
  }
);
```

## 🧪 Testing Patterns

**Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Login } from './Login';

test('login form submits credentials', async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/loading/i)).toBeInTheDocument();
});
```

**API Mock:**
```typescript
import { vi } from 'vitest';
import api from '../services/api';

vi.mock('../services/api');

test('fetches sites on mount', async () => {
  const mockSites = [{ id: '1', name: 'Test Site' }];
  api.get.mockResolvedValue({ data: { data: mockSites } });

  render(<Dashboard />);

  expect(await screen.findByText('Test Site')).toBeInTheDocument();
});
```

## 📦 Environment Variables Pattern

**Frontend (.env.local):**
```env
VITE_API_BASE_URL=http://localhost:8090
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Usage:**
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
```

**Backend (Cloudflare Secrets):**
```bash
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

**Usage:**
```typescript
const jwtSecret = c.env.JWT_SECRET;
const stripeKey = c.env.STRIPE_SECRET_KEY;
```

---

## Common Mistakes to Avoid

❌ **Storing token in state without localStorage**
```typescript
// BAD - Lost on refresh
const [token, setToken] = useState(null);

// GOOD - Persists
localStorage.setItem('auth_token', token);
```

❌ **Not handling 401 globally**
```typescript
// BAD - Handle in every component
try {
  await api.get('/data');
} catch (error) {
  if (error.response?.status === 401) {
    navigate('/login');
  }
}

// GOOD - Handle in interceptor once
api.interceptors.response.use(...);
```

❌ **Creating new context value on every render**
```typescript
// BAD - Causes re-renders
<AuthContext.Provider value={{ user, login, logout }}>

// GOOD - Memoized
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>
```

❌ **Not verifying webhook signatures**
```typescript
// BAD - Anyone can send fake webhooks
app.post('/webhook', async (c) => {
  const body = await c.req.json();
  // Process without verification
});

// GOOD - Verify signature
const event = stripe.webhooks.constructEvent(body, signature, secret);
```

❌ **Storing secrets in frontend**
```typescript
// BAD - Exposed in bundle
const STRIPE_SECRET_KEY = 'sk_live_...';

// GOOD - Only in backend
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
```
