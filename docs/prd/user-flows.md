# User Flows

## Flow 1: Vibe to First Cut (Primary)

The core flow that defines the product. Target: **< 10 minutes end to end.**

```
1. User lands on Dashboard
2. Clicks "New Project"
3. Enters a vibe brief (text prompt)
   - Optional: uploads reference images
4. System generates:
   a. Creative Brief (structured summary)
   b. Narrative Arc (beginning → middle → end)
   c. Scene Breakdown (2–4 scenes)
   d. Shot List (4–8 shots with full specs)
   e. Continuity Pack (style, subjects, world rules)
   f. Draft Timeline (ordered shots with target durations)
5. User reviews the shot list
   - Can edit individual shot specs
   - Can reorder shots
   - Can delete/add shots
6. User clicks "Generate All" or selects individual shots
7. System queues generation jobs with selected provider
8. User sees real-time status updates (queued → processing → done)
9. Completed shots appear in timeline
10. User can:
    - Regenerate a shot (new variant)
    - Extend a shot (add duration)
    - Swap a shot (with a variant)
    - Trim a shot
    - Reorder timeline
11. User clicks "Export Rough Cut"
12. System stitches timeline → downloadable video
```

## Flow 2: BYOK Setup

```
1. User navigates to Settings → API Keys
2. Sees list of supported providers (Runway, Veo, Luma)
3. Clicks "Add Key" for a provider
4. Enters API key (validated on input)
5. Key is encrypted and stored in DB
6. Provider becomes available for generation
7. User can test connection
8. User can update or delete key
```

## Flow 3: Shot Regeneration

```
1. User is in Project Workspace
2. Selects a completed shot in timeline/shot list
3. Clicks "Regenerate"
4. Options:
   a. Same prompt, same provider (retry)
   b. Same prompt, different provider
   c. Modified prompt
5. New generation job is queued
6. On completion, new variant appears
7. User compares variants side by side
8. User selects preferred variant for timeline
9. Previous variant is preserved (non-destructive)
```

## Flow 4: Shot Extension

```
1. User selects a completed shot
2. Clicks "Extend"
3. Specifies desired additional duration
4. Optional: provides motion/direction guidance
5. Extension job is queued
6. On completion, extended clip replaces original in timeline
7. Original is preserved as version history
```

## Flow 5: Export

```
1. User has a complete timeline (all shots generated)
2. Clicks "Export"
3. Sees export settings:
   - Resolution
   - Format (MP4)
   - Quality
4. Sees estimated cost (if applicable)
5. Confirms export
6. System stitches clips via FFmpeg
7. User downloads rough cut
```

## Flow 6: Browse Generations

```
1. User navigates to Generations page
2. Sees all generations across projects
3. Can filter by:
   - Status (completed, failed, processing)
   - Provider
   - Project
4. Can click into any generation to see details
5. Can compare variants
6. Can reuse a generation in a different project
```
