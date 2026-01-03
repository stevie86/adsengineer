# Agent Context: Marketing Launch Pack

## Technology Stack
- **Framework**: Astro 4.0 (Static Site Generator)
- **Styling**: Tailwind CSS
- **Hosting**: Cloudflare Pages
- **Forms**: Cloudflare Pages Functions

## Directory Structure
```
landing-page/
├── src/
│   ├── components/  # Reusable UI parts (Hero, Pricing, etc.)
│   ├── layouts/     # Base HTML structure
│   └── pages/       # Route definitions (index.astro)
├── public/          # Static assets (images, favicon)
└── functions/       # Serverless functions for form handling
```

## Key Constraints
- **Performance**: Maintain <1.5s load time (optimize images, minimize JS).
- **Design**: "Enterprise-Lite" dark mode aesthetic.
- **Content**: Edit text directly in `.astro` files or a `src/content/` config.
