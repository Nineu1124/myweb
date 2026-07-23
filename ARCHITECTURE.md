# MONUMENTS OF ECHOES — MVP Architecture

## Product shape

The MVP is a single-page, progressively enhanced narrative portfolio.

- The semantic document layer owns navigation, copy, links, focus order, and fallbacks.
- A fixed cinematic layer owns atmosphere, generated scene art, echo graphics, and lightweight particles.
- The public experience has two equal entry paths:
  - **Begin recovery**: a user-controlled cinematic route.
  - **Open archive index**: immediate access to all public destinations.
- The canonical route takes roughly 42 seconds when continuously advanced. It never auto-plays or locks the user into a timed film.

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
    NEXUS
       ↓
    FORGE
       ↓
    IDENTITY
       ↓
    RESOLVED
```

Every chapter can move forward or backward. `INDEX` is reachable from every state. `NEXUS` exposes optional previews for Idea and Memory without forcing either branch into the main route.

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
- Original raster artwork provides the wasteland, archive nexus, and observatory plates.
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

No account, database, or cross-domain authentication is part of this MVP. The Love archive appears only as a sealed narrative trace.

## Responsive behavior

- Desktop: fixed cinematic viewport, chapter controls, subtle pointer parallax.
- Mobile: vertical chapter cards over portrait-friendly crops; no required horizontal gesture.
- Keyboard: Tab for controls, Enter/Space for actions, Arrow keys/Page Up/Page Down for chapter navigation, Escape for the archive index.
- Screen readers: chapter status is announced through a polite live region; decorative visuals are hidden.

## Component boundaries

```text
app/page.tsx
  └─ ArchiveExperience
       ├─ EntryGate
       ├─ SceneStage
       ├─ SystemRail
       ├─ ChapterCopy
       ├─ ArchiveIndex
       ├─ PreferenceControls
       └─ ProgressRail
```

Configuration and copy live in `app/archive-data.ts`; interactive behavior lives in `app/ArchiveExperience.tsx`; visual behavior lives in `app/globals.css`.

## MVP acceptance criteria

- Works, About, and all public archive entries are reachable within two actions from entry.
- The cinematic route completes without mouse-only or gesture-only interaction.
- The page remains readable with images disabled, JavaScript delayed, reduced motion enabled, or audio unavailable.
- Functional controls never use glitch distortion or low-contrast decorative styling.
- Build succeeds and the final source is self-contained under `D:\myweb`.
