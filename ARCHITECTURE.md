# MONUMENTS OF ECHOES — MVP Architecture

## Product shape

The MVP is a single-page, progressively enhanced narrative portfolio.

- The semantic document layer owns navigation, copy, links, focus order, and fallbacks.
- A fixed cinematic layer owns atmosphere, generated scene art, echo graphics, and lightweight particles.
- The public experience has two equal entry paths:
  - **Begin recovery**: a user-controlled cinematic route.
  - **Open archive index**: immediate access to all public destinations.
- The canonical route takes roughly 90 seconds when continuously advanced. It never auto-plays or locks the user into a timed film.

## Narrative state machine

```text
ENTRY
  ├─ INDEX
  └─ BOOT
       ↓
    WASTELAND
       ↓
    RELAY
       ↓
MEMORY ← NEXUS → IDEA
          ↓
    FORGE
       ↓
    IDENTITY
       ↓
    RESOLVED
```

Every chapter can move forward or backward. `INDEX` is reachable from every state. `NEXUS` is the mixed-axis junction: Memory opens to the left, Idea opens to the right, and Forge continues downward. Both branches are full-viewport environments and return to the same hub without changing the mainline position.

## Visual system

### One axis

A persistent vertical monument axis connects the opening light slit, distant monument, archive nexus, observatory, and final cursor.

### Three echoes

Important restoration events render as a primary form plus two delayed, decaying silhouettes. The offsets narrow as identity recovery progresses and align completely in the final chapter.

### Six broken rings

Each archive module derives from one incomplete-ring family:

- Communication: expanding ring
- Thought: dispersing ring
- Memory: refracted ring
- Creation: interlocking ring
- Identity: aligned ring
- Emotion: two occluded interlocking rings

## Rendering strategy

- React renders the semantic page and interaction state.
- CSS renders the fixed scene compositor, vignettes, fog, rings, scan lines, and transitions.
- Original raster artwork provides the wasteland, archive nexus, observatory, memory reservoir, and migrating-thoughts plates.
- No runtime 3D engine is required for the MVP.
- Scene images are loaded progressively; only the first scene is eager.
- `prefers-reduced-motion` removes camera pushes, parallax, pulsing, scanning, and smooth scrolling while preserving all narrative content.

## State and persistence

Device-local state uses `localStorage`:

```ts
type ArchivePreferences = {
  soundEnabled: boolean;
  reducedMotion: boolean;
  hasVisited: boolean;
  lastChapter: ChapterId;
};
```

The active Nexus branch is also mirrored into `?branch=memory|idea#chapter-nexus`, so a branch can be restored or deep-linked without duplicating pages. No account, database, or cross-domain authentication is part of this MVP. The Love archive is excluded from the public index and appears only as a sealed narrative trace.

## Responsive behavior

- Desktop: fixed cinematic viewport, vertical mainline chapters, a three-direction Nexus, full-viewport branches, and subtle pointer parallax.
- Mobile: vertical mainline chapters over portrait-friendly crops; the Nexus direction row uses local horizontal scroll-snap and equivalent explicit buttons.
- Keyboard: Tab for controls, Enter/Space for actions, Up/Down for mainline navigation, Left/Right for Nexus branches, and Escape to return from overlays.
- Screen readers: chapter status is announced through a polite live region; decorative visuals are hidden.

## Component boundaries

```text
app/page.tsx
  └─ ArchiveExperience
       ├─ EntryGate
       ├─ SceneStage
       ├─ SystemRail
       ├─ ChapterCopy
       ├─ DirectionalNexus
       ├─ BranchEnvironment
       ├─ OracleCompass
       ├─ ArchiveIndex
       ├─ PreferenceControls
       └─ ProgressRail
```

Configuration and copy live in `app/archive-data.ts`; interactive behavior lives in `app/ArchiveExperience.tsx`; visual behavior lives in `app/globals.css`.

## MVP acceptance criteria

- Works, About, and all public archive entries are reachable within two actions from entry.
- The cinematic route completes without mouse-only or gesture-only interaction.
- Memory, Forge, and Idea remain visually explicit at the Nexus and are operable by buttons, keyboard, wheel/trackpad, drag, and touch.
- The page remains readable with images disabled, JavaScript delayed, reduced motion enabled, or audio unavailable.
- Functional controls never use glitch distortion or low-contrast decorative styling.
- Build succeeds and the final source is self-contained under `D:\myweb`.
