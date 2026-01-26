# Landing Page - Styles

**Source:** `landing-page/src/styles/global.css`

---

## Design System

### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Primary Colors */
  --primary: #BC13FE;           /* Purple */
  --primary-glow: rgba(188, 19, 254, 0.4);
  --accent: #00F0FF;            /* Cyan */
  --accent-glow: rgba(0, 240, 255, 0.4);
  
  /* Background Colors */
  --bg-dark: #0B0B15;           /* Main background */
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  
  /* Text Colors */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  
  /* Border Colors */
  --border: rgba(255, 255, 255, 0.1);
  --border-light: rgba(255, 255, 255, 0.15);

  /* Gradients */
  --gradient-main: linear-gradient(135deg, #BC13FE 0%, #00F0FF 100%);
  --gradient-overlay: linear-gradient(180deg, rgba(11, 11, 21, 0) 0%, #0B0B15 100%);

  /* Shadows */
  --shadow-glow: 0 0 30px var(--primary-glow);
  --shadow-accent: 0 0 30px var(--accent-glow);

  /* Spacing & Radius */
  --radius: 12px;
  --radius-lg: 24px;
  
  /* Transitions */
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Full CSS File

```css
:root {
  --primary: #BC13FE;
  --primary-glow: rgba(188, 19, 254, 0.4);
  --accent: #00F0FF;
  --accent-glow: rgba(0, 240, 255, 0.4);
  --bg-dark: #0B0B15;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --border: rgba(255, 255, 255, 0.1);
  --border-light: rgba(255, 255, 255, 0.15);

  /* Gradients */
  --gradient-main: linear-gradient(135deg, #BC13FE 0%, #00F0FF 100%);
  --gradient-overlay: linear-gradient(180deg, rgba(11, 11, 21, 0) 0%, #0B0B15 100%);

  /* Shadows */
  --shadow-glow: 0 0 30px var(--primary-glow);
  --shadow-accent: 0 0 30px var(--accent-glow);

  --radius: 12px;
  --radius-lg: 24px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg-dark);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
  }
}

/* ===== Animated Background ===== */
#particles-js {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: var(--bg-dark);
}

.bg-gradient-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60%;
  background: linear-gradient(0deg, rgba(11, 11, 21, 1) 0%, rgba(11, 11, 21, 0) 100%);
  z-index: -1;
  pointer-events: none;
}

/* ===== Utilities ===== */
.gradient-text {
  background: var(--gradient-main);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-animate {
  background-size: 200%;
  animation: gradient-flow 5s ease infinite;
}

@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: var(--transition);
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-5px);
}

.btn-glow {
  box-shadow: 0 0 20px var(--primary-glow);
}

.btn-glow:hover {
  box-shadow: 0 0 30px var(--primary-glow);
  transform: translateY(-2px);
}
```

---

## Utility Classes

### Gradient Text
```html
<span class="gradient-text">Highlighted Text</span>
<span class="gradient-text gradient-animate">Animated Gradient</span>
```

### Glass Card
```html
<div class="glass-card p-8">
  <!-- Frosted glass effect with blur backdrop -->
</div>
```

### Glow Button
```html
<button class="btn-glow">Glowing Button</button>
```

---

## Color Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | `#BC13FE` | rgb(188, 19, 254) | CTAs, highlights |
| Accent | `#00F0FF` | rgb(0, 240, 255) | Secondary highlights |
| Background | `#0B0B15` | rgb(11, 11, 21) | Page background |
| Card BG | `rgba(255,255,255,0.03)` | - | Card backgrounds |
| Text Primary | `#FFFFFF` | rgb(255, 255, 255) | Headings |
| Text Secondary | `rgba(255,255,255,0.7)` | - | Body text |
| Text Muted | `rgba(255,255,255,0.5)` | - | Captions |

---

## Animations

### Gradient Flow
Smooth gradient position animation for text highlights.

### Pulse Green (WhatsApp)
```css
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
}
```

### Glass Card Hover
- Background opacity increases
- Border becomes more visible
- Lifts up 5px (`translateY(-5px)`)
