# Orbit experience

Design brief and handoff for the First Star web experience.
Updated September 15, 2026.

## Agreed design direction

The visitor inhabits space, as though wearing a space suit. While visiting
First Star, they slowly orbit that star automatically. No flight controls are
needed. The experience should feel immersive, calm, and spatial.

- **The visor is always on.** It is the persistent interface through which the
  visitor sees space and accesses the work. It should feel sleek and futuristic,
  with a digital layer distinct from real space, rather than a spacesuit helmet.
- **All words and navigation belong to the visor.** They should feel like
  digital projections attached to the visitor's view. Keep space itself open.
- **Explore is a menu within the visor.** Bringing up or dismissing the menu
  does not remove the visor or leave the orbit.
- **First Star is a simple bright orb.** A solid luminous body with a glow is
  the preferred direction; detailed solar surface textures are unnecessary.
- **Continuity matters.** Browsing, reading, and listening should feel like
  activities undertaken while remaining in the same environment.

The user approved the current prototype as essentially the intended experience.
It establishes the concept; its visual treatment and interactions still need
refinement. Keep these decisions as the foundation for subsequent passes.

## Current prototype

Run `npm --prefix stars/first-star run dev` from the repository root and open
`http://localhost:4321/orbit/`.

The separate, unlinked `/orbit/` route currently provides:

- A Three.js scene with an automatic orbit, spatial star field, and glowing orb.
- A permanent helmet rim, subtle glass reflections, and digital overlays.
- An Explore menu containing the existing catalog, search, record pages, and
  audio players.
- Menu dismissal through the Dismiss button or Escape. Bringing it back
  preserves the current page, filters, and any playing audio.
- A pause control, reduced-motion support, responsive layouts, and a still-star
  fallback when WebGL is unavailable.

The existing Astro content system and publication rules remain the foundation.
Local previews include drafts; production builds use the existing publication
opt-in rules.

### Implementation entry points

- [Page and interface structure](../src/pages/orbit.astro)
- [Visor appearance and responsive styles](../src/styles/orbit.css)
- [Space scene and menu behavior](../src/lib/orbit.ts)
- [Existing Explore layout](../src/layouts/Explore.astro)

### Known limitations

- Explore currently runs in an iframe. This reuses the working catalog but is
  a prototype integration that should be reassessed as the experience develops.
- Audio can continue when the menu is dismissed, but navigating to another
  catalog page can interrupt playback.
- The sense of depth, orbital movement, glass, and projected controls needs
  further visual refinement and performance evaluation on real devices.
- Browser checks covered desktop/mobile layouts, search, record navigation,
  menu dismissal, retained state, and the pause control. The production build
  and existing eight tests passed during prototyping. Real-device comfort and
  performance still need evaluation.

## Spatial depth pass — accepted

Implemented and visually accepted September 15, 2026.

- Split the field into distant stars, middle-distance stars, and sparse warm
  particles inside the orbit. Fixed world positions provide relative motion
  between layers; a shared soft point texture replaces square points.
- Keep the simple orb and its scale, glow, and visor placement.
- Use a level circular orbit with no vertical bob or camera roll. A revolution
  takes approximately 12 minutes on desktop and 15 minutes below 700px wide.
  Resizing preserves orbital phase.
- Skip scene draws while paused unless the viewport changes. Reduced-motion
  still starts paused, and the existing WebGL fallback remains in place.

Validation: all eight existing tests and the production build passed (the build
reports a bundle-size warning). Browser review covered desktop at 1280×720,
phone layout at 390×844, pause, Explore loading, Escape dismissal, and search
retention on reopening. Reduced-motion preference changes and WebGL loss were
not re-simulated in this pass. Real-device performance and motion comfort remain
open; the user approved the preview’s visual direction.

## Visor refinement — ready for review

Implemented September 15, 2026 in response to the requested sleeker, futuristic
interface. Preserve the sensation of viewing space through a visor while making
all overlays feel digital.

- Replace the thick helmet rim with thin curved optical edges, grazing highlights,
  and subtle glass reflections that keep the center clear.
- Use cool blue-white projections against the warm star, cleaner sans-serif
  headings, sparse edge ticks, and a transparent Explore control with lit corners.
- Carry the projection palette into the catalog panel and use a short, subtle
  scale-and-fade entrance. Keyboard focus remains clearly visible; reduced-motion
  CSS continues to disable transitions and animations.

Browser review covered desktop and 390×844 phone composition, menu appearance,
Escape dismissal, and focus returning to Explore. Production build passed with
its bundle-size warning. This visual pass awaits user acceptance.

## Suggested next pass

These are proposed priorities, not a finalized specification:

1. **Refine spatial depth and orbit.** Tune star-field depth, camera movement,
   scale, and lighting so orbiting feels perceptible and comfortable while
   keeping the star simple.
2. **Refine the permanent visor.** Improve the helmet edges, reflections,
   typography, and overlay placement so the interface feels projected onto
   glass and leaves plenty of unobstructed space.
3. **Refine the Explore menu.** Make its appearance and transitions feel native
   to the visor. Preserve reading comfort, keyboard access, search, and record
   navigation.
4. **Evaluate the result on phones and desktops.** Check motion comfort,
   readability, rendering performance, reduced-motion behavior, and fallback
   behavior before expanding scope.

Keep each pass focused and review the experience in the browser. Record new
accepted decisions here; use GitHub issues for individual implementation tasks.
Persistent audio across record navigation is a follow-up architecture decision.

## Astrogenesis entrance — prototype ready for review

Implemented September 15, 2026 following the user's request to try the entrance.
The clean, luxurious Astrogenesis surface is an illusion. Scrolling toward First
Star exposes a colder, more industrial atmosphere, with amber haze and visible
structural lines. The visitor is already in space; the surface falls away.

- Preserve the existing opening composition and editorial copy, adding soft
  atmospheric light above and a gridded, weathered-feeling threshold below.
- Proposed threshold copy: **“There is more here than the surface.”**
- Proposed action: **“Let the facade fall.”** Both lines await user review.
- Preload the actual `/orbit/` experience as the threshold approaches. Wait for
  its readiness signal before dissolving the facade in place over 2.4 seconds.
  There is no camera flight, zoom, or route change to another website.
- Hold orbital movement while concealed, then resume it after the reveal.
  Reduced-motion visitors receive an immediate reveal and a paused orbit.
- Keep the permanent visor and existing Explore catalog. Return to the surface
  through the small top control or browser Back; retain the mounted orbit.
- Keep a normal orbit link for JavaScript-free visits, plus a direct-link recovery
  when loading times out. Validate message origin and source between the sites.

### Local preview

Run `npm --prefix stars/first-star run dev` and, in another terminal,
`python3 -m http.server 8080 --directory site --bind 127.0.0.1`.
Open `http://127.0.0.1:8080/` and scroll down. Localhost connects to First Star on
port 4321; the production entrance connects to `https://first.astrogenesis.co/orbit/`.
Release the First Star readiness support before the Astrogenesis entrance, since
the two sites deploy independently.

Validation: production build and all eight existing tests passed. Browser review
covered the opening, threshold at 390px wide, rendered reveal, and browser Back
with focus restored to the entrance link. The in-app browser automation could not
target controls within the nested orbit frame, so Explore interactions through
this entrance remain to be checked manually. Reduced-motion and load-failure
branches were reviewed in code but not browser-simulated. The visual direction
and wording await user acceptance. Nothing has been published.

## Starting a new task

Suggested prompt:

> Read `stars/first-star/docs/orbit-experience.md` and inspect the current
> `/orbit/` prototype. Work on the next pass, focusing on spatial depth and
> orbital movement. Preserve the permanent visor, digital overlays, simple
> bright star, and existing catalog behavior. Preview and verify the result.

Check the current Git state before starting. Pushing changes to remote `main`
triggers deployment; saving a checkpoint and publishing are separate steps.
