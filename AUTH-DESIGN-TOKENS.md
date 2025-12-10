# Auth Page Design Tokens

All auth page styling is now managed through a centralized design token system for easy customization.

## How to Change Auth Page Design

Edit the design tokens in `src/styles/design-tokens.css` (lines 128-173) in the `:root` block.

### Available Tokens

#### Colors & Backgrounds
```css
--auth-bg-color: #0b1220;                    /* Page background */
--auth-card-bg: rgba(20, 25, 35, 0.75);     /* Card background with transparency */
--auth-card-border: 1px solid rgba(255, 255, 255, 0.08);  /* Card border */
```

#### Card Styling
```css
--auth-card-border-radius: 16px;            /* Corner roundness */
--auth-card-blur: 12px;                     /* Backdrop blur effect */
--auth-card-padding: 1.25rem 2rem;          /* Internal spacing */
--auth-card-max-width: 420px;               /* Maximum card width */
--auth-card-max-height: 85vh;               /* Maximum card height */
--auth-card-gap: 0.55rem;                   /* Space between elements */
```

#### Input Fields
```css
--auth-input-bg: rgba(79, 70, 229, 0.2);    /* Input background */
--auth-input-border: 1px solid rgba(79, 70, 229, 0.3);  /* Input border */
--auth-input-border-radius: 8px;            /* Input corner roundness */
--auth-input-text-color: #e0e7ff;           /* Text color in inputs */
--auth-input-caret-color: #e0e7ff;          /* Cursor color */
--auth-input-placeholder-color: rgba(255, 255, 255, 0.5);  /* Placeholder text */
--auth-input-focus-bg: rgba(79, 70, 229, 0.3);  /* Background when focused */
--auth-input-focus-border: rgba(79, 70, 229, 0.5);  /* Border when focused */
--auth-input-focus-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);  /* Focus glow */
```

#### Text & Labels
```css
--auth-text-color: #ffffff;                 /* Main text color */
--auth-label-color: #ffffff;                /* Label text color */
--auth-title-font-size: clamp(1.2rem, 2.5vw, 1.6rem);  /* Title size (responsive) */
--auth-title-font-weight: 800;              /* Title weight */
--auth-subtitle-font-size: 0.8rem;          /* Subtitle size */
--auth-subtitle-color: #ffffff;             /* Subtitle text color */
```

#### Buttons
```css
--auth-button-bg: rgba(80, 90, 110, 0.6);   /* Button background */
--auth-button-bg-hover: rgba(90, 100, 120, 0.8);  /* Button on hover */
--auth-button-border: 1px solid rgba(255, 255, 255, 0.1);  /* Button border */
--auth-button-text-color: #ffffff;          /* Button text color */
--auth-button-padding: 0.7rem 1.1rem;       /* Button padding */
--auth-button-radius: 8px;                  /* Button corner roundness */
```

#### Links
```css
--auth-link-color: #ffffff;                 /* Link text color */
--auth-link-hover-opacity: 0.8;             /* Opacity on hover */
--auth-footer-link-color: #4f46e5;          /* Footer link color */
--auth-footer-link-hover-color: #6366f1;    /* Footer link hover color */
```

#### Error Messages
```css
--auth-error-bg: rgba(239, 68, 68, 0.15);   /* Error background */
--auth-error-border: 1px solid rgba(239, 68, 68, 0.3);  /* Error border */
--auth-error-text: #fecaca;                 /* Error text color */
```

## Example: Changing the Primary Color

To change the input color scheme from purple to another color:

1. Edit `src/styles/design-tokens.css`
2. Find the `--auth-input-*` tokens (lines 141-149)
3. Change the color values:

```css
/* Before: Purple theme */
--auth-input-bg: rgba(79, 70, 229, 0.2);

/* After: Blue theme */
--auth-input-bg: rgba(59, 130, 246, 0.2);  /* Blue */
```

## File Structure

- **Design Tokens**: `src/styles/design-tokens.css` ← Edit here for styling
- **Auth Styles**: `src/components/AuthPage.css` ← References tokens (no direct edits needed)
- **React Components**: `src/components/SignInPage.tsx`, `CreateAccountPage.tsx`, `SessionResumePage.tsx` ← No styling inline

## Clean Architecture Benefits

✅ Single source of truth for all auth colors
✅ Change entire theme by editing one file
✅ No scattered !important flags
✅ No CSS cascade conflicts
✅ Easy to maintain and test
✅ No inline styles in React components
