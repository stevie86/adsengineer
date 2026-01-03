# AdsEngineer Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_API_BASE_URL=http://localhost:8090
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

## Features

- **Agency Signup**: Multi-step form with Stripe payment integration
- **Dashboard**: Real-time analytics and subscription management
- **Admin Panel**: Agency management and system monitoring
- **Responsive Design**: Works on desktop and mobile

## Architecture

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Stripe Elements** for payment processing
- **Axios** for API communication
- **React Router** for navigation

## Deployment

The frontend can be deployed to:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

Make sure to set environment variables in your deployment platform.