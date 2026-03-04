# VideoViber Brand Guidelines

Last updated: March 3, 2026

This guide is for engineers and AI agents adding UI, pages, or copy to VideoViber.
Use these rules to keep visuals, motion, and tone consistent with the cinematic design system.

## 1. Brand Direction

VideoViber should feel like a cinematic command deck, not a generic SaaS dashboard.

- Mood: atmospheric, high-contrast, futuristic, precise.
- Visual character: deep space-dark surfaces with cyan + amber light accents.
- Interaction character: smooth, purposeful motion with depth and progression cues.
- Product voice: direct and technical, no hype spam, no fake metrics.

## 2. Canonical Colors

Use these colors in new content unless there is a strong reason to deviate.

- `vv-base`: `#03060d`
- `vv-surface`: deep blue-black surfaces (existing token system)
- `vv-primary`: high-contrast text (`#edf4ff` visual target)
- `vv-secondary`: muted body text
- `vv-muted`: low-emphasis text
- `brand-cyan`: `#52deff`
- `brand-cyan-soft`: `#7ae8ff`
- `brand-amber`: `#ffbb72`
- `brand-amber-deep`: `#ff8c52`

Gradient standard:

- `linear-gradient(120deg, #52deff, #c4f6ff 45%, #ffb36b 100%)`

Do not reintroduce old purple-centric branding (`#7c3aed`, violet/fuchsia-heavy palettes) in core shells.

## 3. Core CSS Utilities to Reuse

Use existing classes from `apps/web/src/app/globals.css` instead of ad-hoc styling.

- Surfaces: `vv-card`, `vv-card-hover`, `vv-card-glow`
- Buttons: `vv-btn-primary`, `vv-btn-secondary`, `vv-btn-ghost`
- Form controls: `vv-input`, `vv-label`, `vv-badge`
- Typography effects: `gradient-text`, `gradient-text-warm`
- Shells: `vv-page-shell`, `vv-page-content`, `vv-page-hero`, `vv-page-title`, `vv-page-subtitle`
- Navigation shells: `vv-header-shell`, `vv-topbar-shell`, `vv-sidebar-shell`
- Logo system: `vv-brand-logo`, `vv-brand-mark`, `vv-brand-glyph`, `vv-brand-word`

## 4. Logo and Header Rules

Always use the shared logo component:

- Component: `apps/web/src/components/brand-logo.tsx`
- Import: `import { BrandLogo } from '@/components/brand-logo';`

Rules:

- Use `<BrandLogo href="/" />` for full wordmark in desktop header/sidebar/logo areas.
- Use `<BrandLogo href="/" compact />` for compact mobile contexts.
- Do not recreate custom one-off logo glyphs in layouts.
- Header and sidebar shells must use shared shell classes.

## 5. Motion and Image Rules

All cinematic imagery should use motion-enabled image rendering.

- Component: `apps/web/src/components/motion-image.tsx`
- Import: `import { MotionImage } from '@/components/motion-image';`

Use presets:

- `motionPreset="pan"` for hero/large cinematic views.
- `motionPreset="drift"` for cards and gallery stills.
- `motionPreset="float"` for compact thumbnails.
- `motionPreset="pulse"` for highlight states.

Use speeds:

- `slow` for hero scenes.
- `medium` for content cards.
- `fast` for tiny thumbnails only.

Accessibility:

- Motion already respects `prefers-reduced-motion`; do not bypass this.
- Keep animations subtle and continuous; avoid jitter or aggressive loops.

## 6. Copy and Content Guidelines

Write like a technical creative platform, not a hype landing page.

- Prefer concrete terms: workflow, provider diagnostics, timeline, generation state.
- Avoid fake social proof and placeholder claims.
- Avoid “coming soon” filler if a page is intended for production use.
- Use exact dates when relevant for policy or rollout status.

Tone:

- Clear, direct, competent.
- Confident but not exaggerated.
- Explain capability boundaries and real constraints.

## 7. New Page Checklist for Agents

When creating or refactoring a page:

1. Use `vv-page-shell` + `vv-page-content` + `vv-page-hero` structure.
2. Reuse button/card/input utilities instead of custom variants.
3. Use `BrandLogo` for any logo instance.
4. Use `MotionImage` for cinematic images.
5. Keep palette anchored to cyan/amber accents on deep dark surfaces.
6. Ensure no mock/fake behavior in production-facing UX.
7. Run:
   - `pnpm --filter @videoviber/web lint`
   - `pnpm --filter @videoviber/web typecheck`
   - `pnpm --filter @videoviber/web build`

## 8. Minimal Example

```tsx
import { BrandLogo } from '@/components/brand-logo';
import { MotionImage } from '@/components/motion-image';

export default function ExampleSection() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <BrandLogo href="/" />
          <h1 className="vv-page-title">
            Cinematic tools for <span className="gradient-text">real production flow</span>
          </h1>
        </header>

        <article className="vv-card-glow rounded-3xl overflow-hidden p-0">
          <div className="relative aspect-[16/9]">
            <MotionImage
              src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=80"
              alt="Cinematic skyline"
              fill
              sizes="100vw"
              className="object-cover"
              motionPreset="pan"
              motionSpeed="slow"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
```
