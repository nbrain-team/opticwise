### OpticWise — Visual Style Guide (Draft)

This guide captures the current look-and-feel of the OpticWise marketing site as observed across multiple pages (Home, About, Clients, Contact). Use these tokens for consistent design and implementation.


### Brand Typography

- **Display/Headlines (Primary)**: `Rajdhani, sans-serif`
  - Common weights: 300 (light), 400 (regular)
  - Typical sizes observed:
    - H1: 42px, line-height ~50.4px
    - H2: 28–36px, line-height ~42–43.2px (section titles vary by context)
    - H3: 32px, line-height ~46.4px (often on dark backgrounds, white text)
- **Body/Sections (Secondary)**: `"PT Sans", sans-serif`
  - Used for body copy and subsection headings (H4/H6)
  - Typical sizes observed:
    - Base body: effectively 14px root sizing in many sections
    - H4: 20–22px
    - H6: 18px
- **Buttons/CTAs (Condensed)**: `"PT Sans Narrow", sans-serif`
  - Typical: 18px, weight 300, uppercase, pill-shaped buttons
- **Legacy/Fallback (Avoid in builds)**: `Times` appeared for anchors and some defaults (likely fallback). Do not rely on this in product builds; ensure proper font loading for body/links.


### Color Palette (Observed)

Primary colors trend toward neutral grays with white/near-black contrast. Hex approximations from computed styles:

- **Slate 700**: `#50555C` (rgb(80,85,92)) — primary headline and paragraph color on light backgrounds
- **Near Black**: `#222222` (rgb(34,34,34)) — strong body text and deep accents
- **Charcoal**: `#2E2E2F` (rgb(46,46,47)) — dark UI elements/nav text on light surfaces
- **Gray 600**: `#636972` (rgb(99,105,114)) — secondary text
- **Gray 500**: `#666666` (rgb(102,102,102)) — muted text
- **Gray 400**: `#555555` (rgb(85,85,85)) — muted/dark secondary
- **Gray 300**: `#EEEEEE` (rgb(238,238,238)) — dividers, subtle surfaces
- **Gray 250**: `#D8D8D8` (rgb(216,216,216)) — button backgrounds and cards
- **White**: `#FFFFFF`
- **Black**: `#000000`
- **Link Blue (Default)**: `#0000EE` (browser default link in some areas)
- **Accent Blue (Occasional)**: `#006699` (rgb(0,102,153)) — limited appearances
- **Deep Teal (Rare)**: `#002233` (rgb(0,34,51)) — rare/decorative

Note: Many sections use white text on dark or image backgrounds. Ensure accessible contrast for any overlay text (WCAG AA/AAA as needed).


### Spacing, Sizing, and Baseline

- **Root size**: 14px observed (1rem = 14px). Maintain for parity with current site, or explicitly set your project baseline and scale all tokens accordingly.
- **Heading rhythm** (observed):
  - H1: 42/50.4
  - H2: 28–36/42–43.2
  - H3: 32/46.4
  - H4: 20–22/30–32
  - H6: 18/26.1


### Buttons

- **Primary Button** (observed on Contact page “Submit”):
  - Font: `"PT Sans Narrow", sans-serif`, 18px, weight 300, uppercase
  - Text color: `#FFFFFF`
  - Background: `#D8D8D8` (no gradient)
  - Border: none
  - Radius: `100px` (pill)
  - Padding: 20px 85px

- **Links as buttons**: Navigation and section links often appear as text links on transparent backgrounds, switching color based on section background (white on dark, charcoal on light).


### Border Radius and Shadows

- **Radii** (most frequent):
  - Pill: `100px` (primary buttons)
  - Small: `2px`
  - Medium: `3px`

- **Shadows** (common variants):
  - `rgba(0, 0, 0, 0.45) 0px 1px 10px 0px`
  - `rgba(0, 0, 0, 0.1) 0px 1px 1px 0px`
  - `rgba(0, 0, 0, 0.1) 0px 0px 4px 0px`


### Link Treatment

- On dark sections (hero/feature blocks): links and nav are typically `#FFFFFF`.
- In body/content areas: some links fall back to browser default `#0000EE`. For product builds, define explicit link colors and states to avoid browser defaults.


### Example CSS Tokens

Use global CSS variables to centralize theme control. Adjust the values if you choose a different baseline.

```css
:root {
  /* Typography */
  --font-display: 'Rajdhani', sans-serif;
  --font-body: 'PT Sans', sans-serif;
  --font-condensed: 'PT Sans Narrow', sans-serif;

  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-bold: 700;

  --text-base-size: 14px;       /* 1rem = 14px */
  --h1-size: 42px;
  --h1-line: 50.4px;
  --h2-size: 36px;              /* alt: 28px */
  --h2-line: 43.2px;            /* alt: 42px */
  --h3-size: 32px;
  --h3-line: 46.4px;
  --h4-size: 22px;              /* alt: 20px */
  --h4-line: 31.9px;            /* alt ~30px */
  --h6-size: 18px;
  --h6-line: 26.1px;

  /* Palette */
  --color-slate-700: #50555C;
  --color-charcoal-900: #222222;
  --color-charcoal-800: #2E2E2F;
  --color-gray-600: #636972;
  --color-gray-500: #666666;
  --color-gray-400: #555555;
  --color-gray-300: #EEEEEE;
  --color-gray-250: #D8D8D8;
  --color-white: #FFFFFF;
  --color-black: #000000;
  --color-link-default: #0000EE;
  --color-accent-blue: #006699;

  /* Radii & Shadows */
  --radius-pill: 100px;
  --radius-sm: 2px;
  --radius-md: 3px;

  --shadow-deep: 0 1px 10px rgba(0,0,0,0.45);
  --shadow-subtle: 0 1px 1px rgba(0,0,0,0.1);
  --shadow-soft: 0 0 4px rgba(0,0,0,0.1);
}

/* Example element usage */
h1, .display-1 {
  font-family: var(--font-display);
  font-weight: var(--font-weight-light);
  font-size: var(--h1-size);
  line-height: var(--h1-line);
  color: var(--color-slate-700);
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base-size);
  color: var(--color-charcoal-900);
}

.btn-primary {
  font-family: var(--font-condensed);
  font-weight: var(--font-weight-light);
  font-size: 18px;
  text-transform: uppercase;
  color: var(--color-white);
  background: var(--color-gray-250);
  border: 0;
  border-radius: var(--radius-pill);
  padding: 20px 85px;
  box-shadow: var(--shadow-subtle);
}

a {
  color: var(--color-link-default);
}

.on-dark {
  color: var(--color-white);
}
```


### Component Notes

- **Hero/Feature Sections**: Large display typography (Rajdhani 42–48px) with strong contrast; frequent white-on-dark usage. Ensure minimum contrast ratios for overlay text.
- **Cards/Logos**: Light-gray surfaces (`#D8D8D8`/`#EEEEEE`) with minimal borders and subtle shadows.
- **Navigation**: White text on dark imagery/backgrounds. Maintain adequate hover/active states (e.g., opacity or underline) for clarity.


### Accessibility Considerations

- Verify button contrast: white text on `#D8D8D8` may not meet WCAG AA. Consider darker background for primary actions or darker text on light buttons if brand allows.
- Avoid relying on browser default link blue; define explicit link color and visited/hover states that meet contrast guidelines on both light and dark sections.


### Summary of Observed Consistency

- Fonts: Rajdhani for bold statements; PT Sans for body; PT Sans Narrow for CTAs.
- Palette: Neutral, slate-to-charcoal grays with white/near-black contrast; occasional blue accents.
- Shapes: Pill buttons, small rounded corners elsewhere; light, subtle shadows.

This document reflects the current site. If the product requires a broader design system (tokens/components/themes), extend these variables and codify component states (hover, focus, active, disabled) and responsive typography rules.


