# LANDING PAGE KNOWLEDGE BASE

**Generated:** 2026-01-12
**Domain:** Marketing Website (Nuxt/Vue)

## OVERVIEW
Marketing website for AdsEngineer SaaS - lead generation, product showcase, and customer acquisition.

## STRUCTURE
```
landing-page/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-based pages
│   ├── layouts/       # Page layout templates
│   └── content/      # Markdown content (blog, case studies)
├── public/           # Static assets
├── nuxt.config.ts    # Nuxt configuration
└── dist/            # Build output
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Page Components | src/pages/ | Homepage, pricing, about |
| UI Components | src/components/ | Reusable elements |
| Content | src/content/ | Blog posts, case studies |
| Layouts | src/layouts/ | Page structure templates |
| Configuration | nuxt.config.ts | Nuxt setup, modules |
| SEO Meta | Each page | Head tags, meta optimization |
| Build Output | dist/ | Production build |

## CONVENTIONS
- **Framework:** Nuxt 3 with Vue 3 and TypeScript
- **Styling:** Tailwind CSS for utility-first styling
- **Content:** Markdown files for blog/case studies
- **SEO:** Automatic sitemap, meta tags optimization
- **Performance:** Cloudflare Pages deployment
- **Analytics:** Google Analytics 4 integration

## ANTI-PATTERNS (LANDING PAGE)
- Inline styles (Use Tailwind utilities)
- Client-side routing for static content
- Heavy images without optimization
- Missing SEO meta tags
- Broken responsive design