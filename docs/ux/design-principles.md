# Design Principles

## Visual Identity

### Dark-First

VideoViber uses a **dark-first** design system. Dark backgrounds reduce eye strain during extended creative sessions and let video content be the visual focal point.

- **Background**: Deep charcoal (`#0A0A0B`) — not pure black
- **Surface**: Elevated layers use subtle lightening (`#141416`, `#1C1C1F`)
- **Borders**: Ultra-subtle (`#2A2A2E`) — structure without distraction
- **Text**: High contrast whites and muted grays

### Premium & Minimal

Every element earns its space. No decorative clutter, no gratuitous gradients.

- **Whitespace is a feature**: Generous padding, clear visual hierarchy
- **Typography drives hierarchy**: Size, weight, and opacity — not color
- **Icons are functional**: Every icon communicates state or affords action
- **Motion is purposeful**: Animations convey state changes, not decoration

### Restrained Accent Color

A single accent color palette for primary actions:

- **Primary**: Electric violet (`#7C3AED`) — creative energy, premium feel
- **Primary hover**: Brighter violet (`#8B5CF6`)
- **Success**: Emerald (`#10B981`)
- **Warning**: Amber (`#F59E0B`)
- **Error**: Rose (`#EF4444`)
- **Info**: Sky (`#0EA5E9`)

Accent is used sparingly — only for primary CTAs, active states, and important status indicators.

---

## Layout Principles

### Editor-First Layout

The workspace is designed like a professional editor, not a consumer app.

- **Persistent sidebar**: Always visible navigation (collapsible)
- **Content area maximized**: Sidebar is narrow, content fills remaining space
- **Panel-based workspace**: Project workspace uses resizable panels
- **No modal chains**: Prefer inline editing over nested modals
- **Keyboard-friendly**: Power users should rarely need a mouse

### Strong Type Hierarchy

```
Display   — 36px / 700 weight — Page titles
Heading   — 24px / 600 weight — Section headers
Subhead   — 18px / 600 weight — Card titles
Body      — 14px / 400 weight — Default text
Caption   — 12px / 400 weight — Metadata, timestamps
Mono      — 13px / 400 weight — Code, IDs, technical values
```

---

## Interaction Principles

### One Clear Primary Action Per Screen

Every screen has a single, obvious primary action:

| Screen | Primary Action |
|--------|---------------|
| Dashboard | "New Project" |
| Create Project | "Generate Shot Plan" |
| Project Workspace | "Generate All" |
| Timeline Editor | "Export" |
| Generations | (Browse — no primary action) |
| Settings / Keys | "Add API Key" |

### Visible Status for Long-Running Jobs

Generation takes minutes. Status must be:

- **Always visible**: Badge/tag on every shot and generation
- **Color-coded**: Each state has a distinct color
- **Real-time**: Updated via WebSocket, no manual refresh
- **Informative**: Show elapsed time, estimated remaining time

Status colors:
| State | Color | Badge Style |
|-------|-------|-------------|
| draft | `#6B7280` (gray) | Outlined |
| planned | `#8B5CF6` (violet) | Outlined |
| queued | `#F59E0B` (amber) | Filled |
| submitted | `#F59E0B` (amber) | Pulsing |
| processing | `#3B82F6` (blue) | Animated |
| completed | `#10B981` (green) | Filled |
| failed | `#EF4444` (red) | Filled |
| canceled | `#6B7280` (gray) | Strikethrough |
| expired | `#6B7280` (gray) | Strikethrough |

### Visible Cost Estimates Before Render

Before any generation or export, show:

- Provider being used
- Estimated cost (if known)
- Estimated duration
- Credit/quota impact

### Outputs Easy to Compare

When multiple variants exist for a shot:

- Side-by-side comparison view
- Quick toggle between variants
- Clear "selected" indicator
- Preserve all variants (non-destructive)

---

## Non-Destructive Editing

**Every change is versioned. Every edit is reversible.**

- Timeline edits create new versions, not mutations
- Shot regeneration preserves all previous variants
- Export doesn't alter the timeline
- Version history is always accessible
- Undo is a first-class operation

---

## Design Tokens

```css
/* packages/ui/src/tokens.css */

:root {
  /* Background */
  --bg-base: #0A0A0B;
  --bg-surface: #141416;
  --bg-elevated: #1C1C1F;
  --bg-overlay: #242428;

  /* Border */
  --border-subtle: #2A2A2E;
  --border-default: #3A3A3F;
  --border-strong: #4A4A50;

  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;
  --text-disabled: #52525B;

  /* Accent */
  --accent-primary: #7C3AED;
  --accent-hover: #8B5CF6;
  --accent-muted: rgba(124, 58, 237, 0.15);

  /* Status */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
  --status-info: #0EA5E9;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```
