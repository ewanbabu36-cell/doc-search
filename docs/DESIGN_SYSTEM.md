# Doc Search — Design System Foundation

## Themes

Doc Search provides two native themes utilizing a shared CSS variable architecture:

1. **Healthcare Light Theme (`theme-healthcare-light`):**
   - Palette: Clinical slate, clean cyan/teal accents, soft neutral surfaces.
   - Purpose: Day-to-day healthcare workflows, medical clarity, low eye strain.
   - Contrast: Conforms to WCAG 2.1 AA / AAA standards.

2. **Black & White Theme (`theme-black-white`):**
   - Palette: High-contrast pure black, crisp white, and balanced grayscales.
   - Purpose: Medical monitor environments, accessibility, distraction-free clinical views.

## Viewport Adaptability
* **Mobile (< 768px):** Single-column stacked layouts, bottom sheets, minimum 44x44px touch targets.
* **Tablet (768px - 1024px):** Dual-pane collapsible navigation, adaptive grid cards.
* **Desktop (> 1024px):** Multi-column full workspace with collapsible sidebars.

## Scrolling Rules
* Root document level has page-level vertical scroll only. Root horizontal overflow is strictly forbidden (`overflow-x: hidden`).
* Large tables are enclosed in bounded containers with independent horizontal scrolling (`overflow-x: auto; overflow-y: hidden`).
* Micro-interactions adhere to a 150ms ease-in-out transition curve and respect `prefers-reduced-motion`.
