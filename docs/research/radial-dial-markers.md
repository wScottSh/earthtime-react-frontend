# Radial dial markers — placing discrete labeled markers on a circular clock-style dial

> **Chosen location.** This file lives at
> `earthtime-react-frontend/docs/research/radial-dial-markers.md`.
> The frontend is its own git repo (has its own `.git`) and is the working directory
> where the clock-face code lives, and it had no `docs/` folder before this, matching
> the task's "repo has no existing research-notes folder." The sibling monorepo root
> (`earthtime/docs/`) already holds `docs/agents/` and is the documented home for
> `CONTEXT.md` + `docs/adr/`; if the team prefers cross-cutting research to live
> beside those, move this file to `earthtime/docs/research/`. I chose the frontend repo
> because the subject is a frontend rendering concern and this is the cwd repo.

> **Verification note (per "don't trust, verify").** Apple HIG pages are
> client-side rendered and did not return body text to the fetcher, so Apple-specific
> claims below are cited at the page level and flagged `[Apple page not directly
> verified this session]` where I could not confirm the exact wording. Everything else
> is quoted or paraphrased from content I actually retrieved. Where evidence is thin or
> sources disagree, it is called out inline.

---

## Decision-relevant summary (ranked recommendation for the clustering problem)

Our concrete problem: 4 event glyphs (`^` sunrise, `#` midday, `-` sunset, `*` midnight)
sit at input-dependent angles on a 24h ring; they bunch up at some lat/long/seasons and
splay apart at others. Inside-the-ring crowds the center text; outside-the-ring feels
disconnected. The literature points to a clear, principled resolution:

**Recommended pattern (ranked):**

1. **Fixed outer "chapter ring" for the invariant scale + inner event pins anchored by
   short radial ticks, with angular-separation dodging and leader lines only when
   crowded.** Keep the rotating tick/numeral scale on the *outer* track (the horology
   "chapter ring" convention — the outermost ring is where scales/tracks belong), and
   place the 4 event markers as small tick-anchored glyphs on a *dedicated inner
   concentric band* so they never collide with the scale. Anchor each glyph to its exact
   angle with a short radial tick (the point of truth) and let the *glyph* dodge along
   the ring when neighbors are within a minimum angular separation; escalate to a short
   leader line only when dodging is insufficient. This mirrors cartographic point-label
   practice (tick = feature, label = dodged text, leader line as a last resort) and d3
   pie-label practice (labels ride outside/inside a threshold, leader lines beyond it).
   Trade-off: two concentric bands cost radius; but it cleanly separates the two failure
   modes (scale-collision vs. glyph-collision).

2. **Threshold-switched placement: glyphs sit *on/at* their tick when spread, and
   auto-declutter (merge or fan out on a leader) only once neighbors fall under a minimum
   angular gap.** This is the d3 pie-chart convention: small slices below a threshold
   angle get pushed out with leader lines; large ones get labeled in place. Cheapest to
   build on top of pattern 1. Trade-off: needs a good threshold and a stable merge rule so
   markers don't jitter as inputs change.

3. **Detached legend / fixed key for the 4 events, with only the anchor ticks on the
   ring.** When clustering is severe, stop fighting it: put 4 always-legible tick marks on
   the ring and move the glyph identities to a compact fixed legend (or into the
   prev/next center readout you already have). Trade-off: loses at-a-glance
   angle→identity mapping; best as a fallback for the worst-case cluster, not the default.

**Do NOT** rotate glyphs to follow the ring tangent — keep them upright (both cartographic
"can I read it?" practice and clock-dial convention favor upright, horizontal glyphs).
**Do NOT** let the fixed origin (@0 / midnight) out-weight everything: rank now-indicator >
event glyphs > numerals > ticks by size/contrast, and give the origin no extra visual
weight beyond its tick, or it over-draws the eye (NN/g visual-hierarchy guidance).

The single highest-leverage move: **separate the two rings** (invariant scale outside,
event glyphs on an inner band) so the clustering problem is reduced to a one-dimensional
angular-dodging problem on a single band, which is a solved problem (min-separation dodge →
leader line).

---

## Q1. Anchoring a discrete marker precisely to a point on a ring

- **The "chapter ring" is the established home for scales and tick tracks.** In horology
  the chapter ring (a.k.a. minute track / rehaut / minute chapter) is "the outermost ring
  of the dial that carries scales, markings, or minute divisions," a track "printed or
  applied to the dial that carries the minute markings, and sometimes the hour markers as
  well." It "performs crucial roles in both legibility and aesthetics" and "sits between
  the main dial surface and the outer edge, creating a visual frame for the dial."
  Outer tachymeter/pulsometer scales live on this ring on sports watches. Takeaway: put
  your *rotating tick+numeral scale* on the outer chapter ring; that is exactly what the
  ring is for. (https://monochrome-watches.com/glossary/chapter-ring/;
  https://barringtonwatchwinders.com/en-us/pages/chapter-ring;
  https://timeandtidewatches.com/all-the-parts-of-a-watch-explained/)

- **Tick = the point of truth; label = an associated, movable element.** Cartographic
  point-feature practice treats the marker (tick/point) as the anchored truth and the text
  as a positionable label: "labels should be shifted up or down from their associated
  point feature" rather than sit on top of it, and one should "design for association, but
  not at the expense of legibility." (https://courses.ems.psu.edu/geog486/node/557) For a
  ring, the analogue is: draw a short radial tick at the exact angle (immovable), then
  place the glyph adjacent to it (movable) — never encode the exact angle with the glyph
  body alone.

- **Inside vs. outside the track.** In d3 pie/donut practice the decision is
  threshold-driven: labels go *inside/on* the slice when there is room, and are pushed
  *outside* and connected with leader lines for slices below a threshold angle (commonly
  10–15°) "to prevent congestion at the chart's center."
  (https://moldstud.com/articles/p-customizing-legends-and-labels-in-d3js-pie-charts-a-comprehensive-guide)
  Applied to us: outside placement buys circumference (more room, less center-crowding)
  but reads as "detached"; inside placement reads as "attached" but crowds the center
  text. The chapter-ring convention resolves the tension by giving each concern its own
  concentric band rather than forcing one radius to do both jobs.

- **Apple gauges** are Apple's first-party radial-value component (circular and arc
  styles) and exist as an official HIG component, confirming that "value within a range on
  a radial track, conveyed with color and labels" is a sanctioned pattern.
  (https://developer.apple.com/design/human-interface-guidelines/components/status/gauges/)
  `[Apple page not directly verified this session — JS-rendered; cited at page level.]`

## Q2. Label collision / declustering techniques

- **Minimum-separation dodging + push-outward + leader lines (the d3 pie pipeline).**
  Standard practice: "pre-calculate if bounding boxes overlap, and if they do, push labels
  further outward using leader lines (polylines)"; and "apply vertical spacing by
  calculating potential y-positions in advance; if two texts would overlap, adjust one up
  or down by a fixed pixel buffer (e.g., 14px for a 12px font)." Small slices below a
  threshold angle get leader lines.
  (https://moldstud.com/articles/p-customizing-legends-and-labels-in-d3js-pie-charts-a-comprehensive-guide)
  For a ring this becomes *angular* dodging: enforce a minimum angular gap between glyph
  centers; if violated, fan the glyphs apart along the ring and draw a short radial/elbow
  leader back to each true tick.

- **Force-based repositioning (d3-force).** d3's `forceSimulation` with a custom collision
  or position force "can solve the overlapping of labels issue by applying a force between
  the nodes to make sure node positions have moved enough distance to avoid overlapping,"
  and can "systematically reposition annotations along the radial axis while preserving
  their association with underlying data."
  (https://walkingtree.tech/d3-quadrant-chart-collision-in-angular2-application/;
  https://moldstud.com/articles/p-customizing-legends-and-labels-in-d3js-pie-charts-a-comprehensive-guide)
  Constrain the force to the ring's angular dimension so glyphs slide *along* the ring, not
  off it.

- **Simulated-annealing label placement (D3-Labeler).** A named, reusable technique: "a
  D3 plug-in for automatic label placement using simulated annealing." Its energy function
  penalizes **label-label overlaps, label-anchor overlaps, labels far from the
  corresponding anchor, leader-line intersections, and poorly oriented labels**; "a
  *leader line* may be used to help with the correspondence between the *label* and *anchor
  point*." Effort is tuned by Monte Carlo sweeps ("each label is translated or rotated once"
  per sweep). This is the most complete off-the-shelf formulation of exactly our
  trade-offs. (https://github.com/tinker10/D3-Labeler)

- **Cartographic point-label rules (the theory the above implements).** Preferred-position
  models rank candidate positions per point; the classic Imhof (1962) 5-position model
  recommended **top-right** as most favorable; the 8-position model is now most prevalent.
  (https://arxiv.org/html/2407.11996v1) Recent empirical work (PerceptPPO, 800+
  participants, 48 countries) *overturns* the top-right convention: the user-preferred
  order is **Top > Bottom > Right > Top-Right > Bottom-Right > Left > Top-Left >
  Bottom-Left** — "labels placed at the top of point features [are] significantly preferred
  by users, contrary to the conventional top-right position."
  (https://arxiv.org/html/2407.11996v1) *Sources disagree here* (tradition vs. evidence);
  prefer the empirical ordering. Leader lines are the sanctioned overflow valve: "leader
  lines can be used to connect features with labels that do not fit on or directly adjacent
  to their respective feature," but "you should not overuse leader lines...this leads to a
  visually confusing map." (https://courses.ems.psu.edu/geog486/node/557)

- **Grouping/merging.** NN/g: proximity and common regions signal "what things belong
  together." (https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) When two
  events fall within the minimum gap, a defensible fallback is to *merge* them into one
  cluster marker (e.g., a combined glyph or a count) and reveal detail on interaction —
  the "progressive disclosure" NN/g repeatedly recommends for dense displays.
  (https://www.nngroup.com/videos/managing-visual-complexity/)

## Q3. Glyph legibility in small radial markers

- **Target size — 24×24 CSS px (WCAG 2.2 SC 2.5.8, Level AA).** "The size of the target
  for pointer inputs is at least 24 by 24 CSS pixels"; a "solid 24 by 24 CSS pixel square,
  aligned to the horizontal and vertical axis" must fit within the target. If glyphs must
  be smaller, use the **spacing exception**: "if a 24 CSS pixel diameter circle is centered
  on the bounding box of each, the circles do not intersect another target or the circle
  for another undersized target."
  (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) This exception is
  itself a decluttering constraint: enforce ≥24px center-to-center spacing between tappable
  glyphs — which *is* our minimum-angular-separation rule at a given radius.

- **Text contrast — 4.5:1 (normal), 3:1 (large ≥18pt or 14pt bold) (WCAG SC 1.4.3, AA).**
  Normal text needs ≥4.5:1, large text ≥3:1; thresholds are exact and not to be rounded
  (4.499:1 fails). (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html;
  https://www.getstark.co/wcag-explained/perceivable/distinguishable/contrast-minimum/)

- **Non-text contrast — 3:1 (SC 1.4.11, AA).** Graphical objects and UI components (your
  ticks, the now-dot, glyph strokes if treated as icons) need ≥3:1 against adjacent colors.
  (https://www.w3.org/WAI/WCAG22/) Note: at small glyph sizes our `^ # - *` read as *text*
  (4.5:1) rather than icons (3:1); apply the stricter 4.5:1.

- **Minimum text size.** Material 3 sets body-small at 12px and treats ~14sp as a practical
  floor for body text. (https://m3.material.io/styles/typography/type-scale-tokens;
  https://www.learnui.design/blog/android-material-design-font-size-guidelines.html) Apple
  HIG typography is commonly cited as recommending no smaller than ~11pt for legible text.
  `[Apple typography page not directly verified this session — JS-rendered.]`
  (https://developer.apple.com/design/human-interface-guidelines/typography) *Evidence
  note:* the exact "11pt" wording could not be confirmed from the live page this session;
  treat as widely-cited Apple guidance, not a verified quote.

- **Keep glyphs upright, not rotated to the tangent.** Cartographic practice: "labels
  should maintain horizontal orientation for standard readability," curving only gently for
  line features, and the overriding test is "Can I read it?"
  (https://courses.ems.psu.edu/geog486/node/557) D3-Labeler explicitly *penalizes* "poorly
  oriented labels." (https://github.com/tinker10/D3-Labeler) For a clock dial this matches
  the horology norm of upright numerals/indices. Conclusion: render `^ # - *` upright at
  all angles; do not rotate them to follow the ring.

## Q4. Hierarchy on a dense radial display

- **Rank by size and contrast, group by proximity.** NN/g: visual hierarchy is "the
  organization of the design elements on the page so that the eye is guided to consume each
  design element in the order of intended importance"; it is driven by "contrast in value
  and saturation between the element and the context" and by scale, with a recommended cap
  of "no more than 3 sizes — small, medium, and large." Proximity/whitespace signal
  grouping: "an element that has more space around it will be perceived as one group and
  thus will receive more attention."
  (https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) Applied ranking for
  us: **(1) now-indicator** (highest contrast/size — it's the live "you are here"),
  **(2) the 4 event glyphs**, **(3) numerals**, **(4) scale ticks** (lowest weight,
  hairline). Center text is a separate focal block, protected by whitespace.

- **Do not let the fixed origin over-draw the eye.** There is no source that says a fixed
  reference angle should be emphasized; emphasis is earned by *importance*, and contrast is
  relative to context. (https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
  So @0/midnight should get the same tick weight as any other scale tick (plus, at most, a
  small static label), never extra size or saturation — otherwise it competes with the
  now-indicator, which is the actual most-important reference.

- **Manage density with predictable placement + progressive disclosure.** NN/g's
  prescriptions for complex/dense UIs: "put things in predictable places, use a clear
  visual hierarchy, and take advantage of progressive disclosure."
  (https://www.nngroup.com/videos/managing-visual-complexity/) Concretely: keep each ring's
  role fixed (scale = outer, events = inner), and reveal merged-cluster detail only on
  interaction rather than cramming every glyph in at all inputs.

## Q5. Concrete recommendation for the clustering problem (with trade-offs)

Ranked shortlist, grounded in the above:

1. **Two concentric bands + tick-anchored inner glyphs + min-angular-separation dodge +
   leader-line overflow.** (Preferred.)
   - *Why:* Separating the invariant scale (outer chapter ring) from the variable events
     (inner band) removes scale↔event collisions entirely and reduces the residual problem
     to 1-D angular dodging on one band — the case d3/cartographic tooling already solves.
     (chapter ring: https://monochrome-watches.com/glossary/chapter-ring/; pie
     threshold+leader: https://moldstud.com/...; annealing energy terms:
     https://github.com/tinker10/D3-Labeler)
   - *Rule:* enforce ≥24px center-to-center between glyphs (doubles as WCAG 2.5.8 spacing
     compliance: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html);
     when violated, fan glyphs along the ring and draw a short radial/elbow leader back to
     the true tick.
   - *Trade-off:* costs radial space for a second band; needs a tidy leader-line renderer.

2. **Single band, threshold-switched placement (in-place when spread, push-out+leader when
   clustered).** Cheapest; the literal d3 pie convention.
   (https://moldstud.com/...) *Trade-off:* one band still mixes scale and events unless the
   scale is elsewhere; risk of jitter as inputs move markers across the threshold — needs
   hysteresis / a stable merge rule.

3. **Merge nearby events into a cluster marker + progressive disclosure.** When two events
   fall under the min gap, show a single combined marker (glyph pair or count) and reveal
   specifics on tap/hover. (https://www.nngroup.com/videos/managing-visual-complexity/)
   *Trade-off:* loses simultaneous visibility of both events; good as the *worst-case*
   fallback layered on pattern 1/2, not the default.

4. **Detached fixed legend for event identities; ring keeps only anchor ticks.** Most
   robust against extreme clustering; ticks never collide because they carry no text.
   *Trade-off:* breaks the at-a-glance angle→identity mapping the glyphs provide; reserve
   for the densest inputs or as an accessibility fallback.

5. **Curved labels along the ring tangent.** *Not recommended.* Rotating glyphs to the
   tangent hurts legibility (cartographic "keep it horizontal / can I read it?":
   https://courses.ems.psu.edu/geog486/node/557; D3-Labeler penalizes poor orientation:
   https://github.com/tinker10/D3-Labeler) and conflicts with clock-dial upright
   convention.

**Cross-cutting constraints for whichever pattern:** glyphs upright always; scale ticks
hairline/low-contrast; now-indicator highest contrast; @0 no extra emphasis; text ≥ ~12px
and ≥4.5:1 contrast; tappable glyphs ≥24px or ≥24px-spaced.

---

## Where evidence is thin or sources disagree

- **Preferred label position:** classic cartography says top-right (Imhof); recent
  empirical work says **top** is preferred and top-right is *not* best. Use "top" (i.e.,
  place a glyph radially outward/above its tick where possible).
  (https://arxiv.org/html/2407.11996v1)
- **Apple specifics** (gauge wording, 11pt minimum) could not be verified from the live
  JS-rendered HIG pages this session — cited at page level and flagged; do not quote as
  exact wording without re-checking in a browser.
- **Minimum text size** is a range across systems (Material ~12–14px floor; Apple ~11pt as
  commonly cited), not a single authoritative number; pick the larger for a dense dial.
- Much online d3 pie-label guidance is community/blog material (moldstud, walkingtree). The
  *techniques* (bounding-box overlap → push out → leader; d3-force collision; annealing) are
  corroborated by the first-party D3-Labeler source and by cartographic theory, so they are
  reported as technique-level facts rather than on any single blog's authority.

## Sources

- Chapter ring (horology): https://monochrome-watches.com/glossary/chapter-ring/ ,
  https://barringtonwatchwinders.com/en-us/pages/chapter-ring ,
  https://timeandtidewatches.com/all-the-parts-of-a-watch-explained/
- WCAG 2.2 SC 2.5.8 Target Size (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 SC 1.4.3 Contrast (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ;
  WCAG 2.2 spec (incl. 1.4.11 Non-text Contrast): https://www.w3.org/TR/WCAG22/
- D3-Labeler (simulated-annealing label placement): https://github.com/tinker10/D3-Labeler
- d3 pie label + leader-line practice:
  https://moldstud.com/articles/p-customizing-legends-and-labels-in-d3js-pie-charts-a-comprehensive-guide ;
  d3-force collision for labels:
  https://walkingtree.tech/d3-quadrant-chart-collision-in-angular2-application/
- Cartographic label placement (Penn State GEOG 486):
  https://courses.ems.psu.edu/geog486/node/557
- Point-feature label position preferences (PerceptPPO, incl. Imhof history):
  https://arxiv.org/html/2407.11996v1
- NN/g visual hierarchy: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ ;
  managing visual complexity / progressive disclosure:
  https://www.nngroup.com/videos/managing-visual-complexity/
- Material 3 type scale: https://m3.material.io/styles/typography/type-scale-tokens ;
  Android/Material font-size guidance:
  https://www.learnui.design/blog/android-material-design-font-size-guidelines.html
- Apple HIG (page-level, not directly verified this session):
  https://developer.apple.com/design/human-interface-guidelines/components/status/gauges/ ,
  https://developer.apple.com/design/human-interface-guidelines/typography
