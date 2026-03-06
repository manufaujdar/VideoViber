# Pro Editor Feature Matrix

This matrix maps common features from Apple Final Cut Pro, Adobe Premiere Pro, DaVinci Resolve, and Avid Media Composer against VideoViber's timeline requirements and implementation status.

Reference product documentation used for this feature set:
- Apple: [Final Cut Pro User Guide](https://support.apple.com/guide/final-cut-pro/welcome/mac)
- Adobe: [Premiere Pro User Guide](https://helpx.adobe.com/premiere-pro/user-guide.html)
- Blackmagic: [DaVinci Resolve Edit Page](https://www.blackmagicdesign.com/products/davinciresolve/edit)
- Avid: [Media Composer Feature Overview](https://www.avid.com/media-composer)

## Current Scope Alignment

| Category | Pro Editor Capability | VideoViber Status | Priority |
| --- | --- | --- | --- |
| Editing Core | Ripple trim, split, reorder, duplicate, delete | Implemented | Now |
| Editing Core | Clip enable/disable toggle | Implemented (clip-level enable flag + visual state + export flag) | Now |
| Editing Core | In/Out playback range | Implemented (Set In, Set Out, Clear Range, range loop) | Now |
| Editing Core | Magnetic/snap timeline behavior | Implemented (snap toggle + snap targets) | Now |
| Editing Core | Track lock, mute, solo | Implemented | Now |
| Navigation | Zoom, fit timeline, playhead centering | Implemented | Now |
| Navigation | Marker creation, filtering, and jump | Implemented | Now |
| Navigation | Search/filter timeline objects | Implemented (clips/titles/music filter in canvas) | Now |
| Playback | Loop playback | Implemented (timeline or active range) | Now |
| Playback | Waveform-aware dialogue lane | Implemented | Now |
| Inspector | Clip trim, speed, transition, volume, color | Implemented | Now |
| Inspector | Music/title item property editing | Implemented | Now |
| Inspector | Range tools from inspector | Implemented (Range=Selected Clip, Clear Range) | Now |
| Agent Workflow | Bottom command bar + sidebar history | Implemented | Now |
| Agent Workflow | Safe-mode confirmations for destructive edits | Implemented | Now |
| Agent Workflow | Theme switching by command | Implemented | Now |
| Agent Workflow | Timeline edit commands (split, seek, range, enable/disable, etc.) | Implemented | Now |
| Theming/Layout | Minimal, advanced, storyboard, audio, review layouts | Implemented | Now |
| Theming/Layout | Additional modular themes | Implemented (`Assistant Cut Lab`, `Finishing Suite`) | Now |
| Export | Structured EDL/manifest with clip settings | Implemented (now includes clip `enabled`) | Now |

## High-Value Backlog (Next)

| Category | Pro Editor Capability | Proposed Requirement |
| --- | --- | --- |
| Timeline | Compound/nested clips | Group selected clips into reusable sub-sequences |
| Timeline | Linked/unlinked A/V editing | Link-state control for video/audio clip movement |
| Timeline | Adjustment layers | Add global effect layers spanning a time range |
| Review | Version compare and diff | Compare timeline versions side-by-side with change list |
| Multicam | Angle sync and live switching | Multi-angle source sync and cut switching lane |
| Captions | Auto transcription + caption tracks | Generate/edit caption clips with style presets |
| Audio | Roles/buses/submix | Dialogue/music/effects buses with per-bus processing |
| Color | Clip-level color correction stack | Basic wheels/curves + LUT application metadata |
| Collaboration | Review comments anchored to timecode | Threaded notes per marker/clip |
| Automation | Scriptable timeline macros | Save/replay repeatable agent editing workflows |

## Long-Term Pro Features (Later)

| Category | Pro Editor Capability | Future Direction |
| --- | --- | --- |
| Finishing | Scene detection and auto-reframing | AI-assisted reframing + shot boundary suggestions |
| VFX | Planar/object tracking and masks | Metadata-only support for tracked effect instructions |
| Delivery | Preset-driven mastering/export queue | Multi-format batch export profiles |
| Media Management | Proxy workflows and relink | Source/proxy swap with integrity checks |
| Team Workflows | Shared bins and conflict resolution | Multi-user timeline sessions with locks and merges |
