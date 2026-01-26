# Landing Page - Pages

**Source:** `landing-page/src/pages/`

---

## index.astro (Home Page)

**Path:** `/`
**Purpose:** Main landing page with hero, features, pricing CTA

```astro
---
// Component Imports
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import WhatsAppButton from '../components/WhatsAppButton.astro';
// import HowItWorks from '../components/HowItWorks.astro';
// import Audience from '../components/Audience.astro';
// import Pricing from '../components/Pricing.astro';
// import Trust from '../components/Trust.astro';
---

<Layout>
  <Header />
  <main class="min-h-screen">
    <!-- Hero Section -->
    <section class="py-20 relative overflow-hidden">
      <div class="container mx-auto px-6 text-center relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-8 shadow-[0_0_15px_rgba(188,19,254,0.2)]">
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#00F0FF]"></span>
          <span data-i18n="hero.badge">Launching Q1 2026 - Building in Public</span>
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white">
          <span data-i18n="hero.titlePrefix">When Cookies Vanish,</span><br />
          <span class="gradient-text gradient-animate" data-i18n="hero.titleHighlight">Your Data Survives</span>
        </h1>
        <p class="text-xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed" data-i18n="hero.subtitle">
          The Cookie Apocalypse is coming in Q1 2026. Chrome and Safari are blocking 90% of tracking. 
          <span class="text-white font-semibold">AdsEngineer</span> preserves your attribution data across 
          <span class="text-white font-semibold">any platform</span>—from GoHighLevel to Shopify and beyond.
        </p>
        <div class="flex flex-col sm:flex-row gap-6 justify-center">
          <button data-cal-link="stefan-pirker-nmurov/30min" data-cal-config='{"layout":"month_view"}' class="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 px-10 py-5 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] transform hover:-translate-y-1">
            <span data-i18n="hero.ctaPrimary">Book a Call →</span>
          </button>
          <a href="https://advocate-cloud.adsengineer.workers.dev/api/v1/ghl/webhook" class="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 px-10 py-5 rounded-xl text-lg font-bold text-white transition-all duration-300">
            <span data-i18n="hero.ctaSecondary">View Webhook API</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="how-it-works" class="py-20">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-cyan-400 font-bold tracking-widest uppercase text-sm" data-i18n="features.badge">Capabilities</span>
          <h2 class="text-4xl font-bold mt-4 text-white" data-i18n="features.title">Server-Side <span class="gradient-text">Power</span></h2>
          <p class="text-gray-400 mt-4 max-w-2xl mx-auto italic" data-i18n="features.subtitle">"Built on Cloudflare's edge network for unblockable tracking."</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="glass-card p-8 group hover:border-purple-500/50 transition-all">
            <div class="text-4xl mb-6">🛡️</div>
            <h3 class="text-xl font-bold mb-4 text-white" data-i18n="features.list.0.title">GCLID Preservation</h3>
            <p class="text-gray-300 group-hover:text-white transition-colors" data-i18n="features.list.0.desc">Attribution survives cookie restrictions, ad blockers, and cross-domain tracking failures. Your ROI reports stay accurate.</p>
          </div>
          <div class="glass-card p-8 group hover:border-purple-500/50 transition-all">
            <div class="text-4xl mb-6">🔌</div>
            <h3 class="text-xl font-bold mb-4 text-white" data-i18n="features.list.1.title">Universal Integration</h3>
            <p class="text-gray-300 group-hover:text-white transition-colors" data-i18n="features.list.1.desc">Whether you use GHL webhooks, Shopify, or a custom CMS, we receive lead data the moment it's submitted and bridge it back to your ad platforms.</p>
          </div>
          <div class="glass-card p-8 group hover:border-purple-500/50 transition-all">
            <div class="text-4xl mb-6">⚡</div>
            <h3 class="text-xl font-bold mb-4 text-white" data-i18n="features.list.2.title">Cloudflare Edge</h3>
            <p class="text-gray-300 group-hover:text-white transition-colors" data-i18n="features.list.2.desc">Deployed globally on Cloudflare Workers for &lt;50ms latency. Fast, reliable, and unblockable by browsers.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20 bg-black/20">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <span class="text-cyan-400 font-bold tracking-widest uppercase text-sm" data-i18n="pricing.badge">Pricing Reality Check</span>
          <h2 class="text-4xl font-bold mt-4 text-white" data-i18n="pricing.title">Pricing for <span class="gradient-text">SMB Agencies</span></h2>
          <p class="text-gray-400 mt-4" data-i18n="pricing.subtitle">Realistic SaaS pricing. Not €2,000 - that's for Fortune 500s.</p>
        </div>
        <div class="max-w-4xl mx-auto text-center">
          <div class="glass-card p-12 border-purple-500/30 shadow-[0_0_30px_rgba(188,19,254,0.2)]">
            <h3 class="text-3xl font-bold mb-6 text-white" data-i18n="quote.title">Get Your Custom Quote</h3>
            <p class="text-xl mb-8 text-gray-300" data-i18n="quote.subtitle">Every business is unique. Let's discuss your specific needs and create a tailored solution that maximizes your ROI.</p>
            <button data-cal-link="stefan-pirker-nmurov/30min" data-cal-config='{"layout":"month_view"}' class="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 px-12 py-5 rounded-xl text-xl font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] inline-block transform hover:-translate-y-1">
              <span data-i18n="quote.btn">Get Quote Now →</span>
            </button>
          </div>
         </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gray-900/50 text-white py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 pointer-events-none"></div>
      <div class="container mx-auto px-6 text-center relative z-10">
        <h2 class="text-4xl font-bold mb-6 text-white" data-i18n="cta.title">Ready to Fix Your Attribution?</h2>
        <p class="text-xl mb-12 text-gray-300 max-w-2xl mx-auto" data-i18n="cta.subtitle">Join the agencies transforming their performance. Because your conversions deserve to be counted.</p>
        <button data-cal-link="stefan-pirker-nmurov/30min" data-cal-config='{"layout":"month_view"}' class="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 px-12 py-5 rounded-xl text-xl font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] inline-block transform hover:-translate-y-1">
          <span data-i18n="cta.btn">Book a Free Call</span>
        </button>
      </div>
    </section>
  </main>
  <Footer />
  <WhatsAppButton />
</Layout>
```

### Key Content (i18n keys)

| Key | English Text |
|-----|--------------|
| `hero.badge` | Launching Q1 2026 - Building in Public |
| `hero.titlePrefix` | When Cookies Vanish, |
| `hero.titleHighlight` | Your Data Survives |
| `hero.subtitle` | The Cookie Apocalypse is coming... |
| `hero.ctaPrimary` | Book a Call → |
| `features.list.0.title` | GCLID Preservation |
| `features.list.1.title` | Universal Integration |
| `features.list.2.title` | Cloudflare Edge |
| `pricing.title` | Pricing for SMB Agencies |
| `cta.title` | Ready to Fix Your Attribution? |

---

## about.astro (About Page)

**Path:** `/about`
**Purpose:** Company information, founder story, product roadmap

```astro
---
// Component Imports
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

---

<Layout>
  <Header />
  <main class="min-h-screen bg-[#0B0B15] text-white">
    <!-- Stats/Counter Section -->
    <section class="py-20 bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
      <div class="container mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-8 text-center">
          <!-- Happy Clients Counter -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div class="text-4xl font-bold text-cyan-400 mb-2" id="clients-count">0</div>
            <p class="text-gray-300" data-i18n="about.stats.clients">Happy Clients</p>
            <p class="text-sm text-gray-400 mt-2" data-i18n="about.stats.clientsDesc">Growing every day</p>
          </div>

          <!-- Attribution Accuracy -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div class="text-4xl font-bold text-green-400 mb-2">95%</div>
            <p class="text-gray-300" data-i18n="about.stats.accuracy">Attribution Accuracy</p>
            <p class="text-sm text-gray-400 mt-2" data-i18n="about.stats.accuracyDesc">Server-side precision</p>
          </div>

          <!-- Data Processed -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div class="text-4xl font-bold text-purple-400 mb-2" id="conversions-count">0</div>
            <p class="text-gray-300" data-i18n="about.stats.conversions">Conversions Tracked</p>
            <p class="text-sm text-gray-400 mt-2" data-i18n="about.stats.conversionsDesc">And counting...</p>
          </div>

          <!-- Uptime -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div class="text-4xl font-bold text-yellow-400 mb-2">99.9%</div>
            <p class="text-gray-300" data-i18n="about.stats.uptime">Uptime</p>
            <p class="text-sm text-gray-400 mt-2" data-i18n="about.stats.uptimeDesc">Cloudflare powered</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Content -->
    <section class="py-20">
      <div class="container mx-auto px-6 max-w-4xl">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold mb-6" data-i18n="about.title">About AdsEngineer</h1>
          <p class="text-xl text-gray-300" data-i18n="about.subtitle">
            Building the future of attribution tracking in the cookie apocalypse era.
          </p>
        </div>

        <div class="prose prose-lg prose-invert mx-auto">
          <h2 data-i18n="about.founder">The Founder</h2>
          <p>
            I am a passionate software engineer and entrepreneur specializing in solving complex problems in digital advertising. With years of experience developing SaaS solutions and deep understanding of digital marketing challenges, I founded AdsEngineer – a revolutionary platform that transforms how businesses measure and optimize their advertising performance.
          </p>

          <h2 data-i18n="about.mission">Our Mission</h2>
          <p>
            In a world where traditional tracking methods are increasingly failing – Chrome introduces user control, Safari and Firefox block cookies, and privacy laws become stricter – our mission is clear: <strong>Give businesses the ability to measure their ad ROI precisely, independent of browser restrictions.</strong>
          </p>

          <h2 data-i18n="about.offer">What We Build</h2>
          <p>
            <strong>AdsEngineer</strong> is an enterprise-grade SaaS platform that seamlessly integrates Google Ads with GoHighLevel and other marketing automation tools. Unlike traditional pixel-based solutions, we work server-side – our technology is invisible to browsers and unaffected by ad blockers.
          </p>

          <h3>Key Features:</h3>
          <ul>
            <li><strong>Server-Side GCLID Capture:</strong> Securely capture and store Google Click IDs on your server</li>
            <li><strong>Automated Offline Conversions:</strong> Send conversion data back to Google Ads for precise attribution</li>
            <li><strong>GoHighLevel Integration:</strong> Seamless connection with your CRM and marketing automation platform</li>
            <li><strong>Real-Time Dashboards:</strong> Track your advertising performance with unparalleled accuracy</li>
            <li><strong>Enterprise Security:</strong> AES-256 encryption, SOC 2 compliance, GDPR-compliant</li>
          </ul>

          <h2 data-i18n="about.audience">Who We Serve</h2>
          <ul>
            <li><strong>Marketing Agencies:</strong> Scale client performance without manual reporting</li>
            <li><strong>Local Businesses:</strong> Dental practices, law firms, service businesses – anyone using Google Ads</li>
            <li><strong>E-Commerce Companies:</strong> Shopify and WooCommerce stores with complex conversion funnels</li>
            <li><strong>Enterprise Customers:</strong> Large organizations with high privacy and compliance requirements</li>
          </ul>

          <h2 data-i18n="about.philosophy">Our Philosophy</h2>
          <p>
            We believe technology should not only solve problems, but transform industries. Every AdsEngineer feature is derived from real customer problems. We listen, we learn, we iterate – always with the goal of improving user experience and delivering real business results.
          </p>

          <h2 data-i18n="about.roadmap">Product Roadmap</h2>
          <!-- Roadmap phases with colored cards -->
          
          <h2 data-i18n="about.contact">Contact Us</h2>
          <p data-i18n="about.cta">
            Ready to revolutionize your attribution tracking? Let's talk.
          </p>
          <div class="text-center mt-8">
            <a href="https://cal.com/stefan-pirker-nmurov/30min" class="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 px-8 py-4 rounded-lg text-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl" data-i18n="about.demoBtn">
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Footer />

  <script>
    // Animated Counters
    function animateCounter(elementId, target, duration = 2000) {
      const element = document.getElementById(elementId);
      if (!element) return;

      const start = 0;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOutCubic);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    }

    // Start counters when page loads
    document.addEventListener('DOMContentLoaded', () => {
      // Trigger counters with a delay
      setTimeout(() => {
        animateCounter('clients-count', 0); // Currently 0, will update as we get clients
        animateCounter('conversions-count', 0); // Currently 0, will update with real data
      }, 500);
    });
  </script>
</Layout>
```

### Roadmap Phases (from About page)

| Phase | Name | Timeline | Status |
|-------|------|----------|--------|
| 1 | Google Ads Attribution | Now | Live |
| 2 | GA4 Enhancement | Q1 2026 | Coming Soon |
| 3 | Meta Ads Integration | Q2 2026 | Planned |
| 4 | Social Media Suite | Q3 2026 | Planned |
| 5 | CRM Ecosystem | Q4 2026 | Planned |

---

## privacy-policy.astro

**Path:** `/privacy-policy`
**Purpose:** Legal/compliance page for GDPR

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Privacy Policy - AdsEngineer">
  <main class="container mx-auto px-4 py-16 max-w-4xl">
    <h1 class="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
    
    <div class="prose prose-invert prose-purple max-w-none">
      <p class="text-gray-300 mb-8">Last updated: January 2026</p>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p class="text-gray-300">
          AdsEngineer ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">2. Cookie Usage</h2>
        <p class="text-gray-300 mb-4">
          We use cookies to enhance your browsing experience. You have full control over cookie preferences through our consent banner.
        </p>
        
        <h3 class="text-xl font-semibold text-white mb-3">Cookie Categories</h3>
        <ul class="list-disc list-inside text-gray-300 space-y-2">
          <li><strong class="text-white">Necessary Cookies:</strong> Required for the website to function (e.g., session management). These cannot be disabled.</li>
          <li><strong class="text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
          <li><strong class="text-white">Marketing Cookies:</strong> Used to deliver personalized advertisements.</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">3. Managing Your Preferences</h2>
        <p class="text-gray-300">
          You can update your cookie preferences at any time by clicking "Cookie Settings" in our footer, or by clearing your browser cookies for our domain.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">4. Your Rights (GDPR)</h2>
        <p class="text-gray-300 mb-4">Under GDPR, you have the following rights:</p>
        <ul class="list-disc list-inside text-gray-300 space-y-2">
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to withdraw consent at any time</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">5. Contact Us</h2>
        <p class="text-gray-300">
          For privacy-related inquiries, contact us at: <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a>
        </p>
      </section>
    </div>
  </main>
</Layout>
```
