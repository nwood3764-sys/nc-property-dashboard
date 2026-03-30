# NC Property Outreach Priority Dashboard — Design Brainstorm

## Context
A data-driven dashboard for prioritizing outreach to 1,353 NC properties for weatherization/electrification upgrades and hurricane/flood damage recovery. Users are housing program administrators and outreach coordinators who need to quickly identify, sort, and filter high-priority properties.

---

<response>
## Idea 1: "Cartographic Intelligence" — Data Cartography Aesthetic

<text>
**Design Movement**: Inspired by topographic maps, USGS survey aesthetics, and military-grade intelligence dashboards. Think contour lines, elevation markers, and terrain-mapping visual language applied to data.

**Core Principles**:
1. Information density without clutter — every pixel earns its place
2. Terrain-inspired visual hierarchy — elevation = priority
3. Muted earth tones with signal-red accents for critical items
4. Paper-map texture meets digital precision

**Color Philosophy**: A palette drawn from topographic maps — warm sand (#F5F0E8), contour brown (#8B7355), deep terrain (#3D3225), with signal red (#C73E1D) for critical alerts and teal (#2B7A78) for water/flood indicators. The warmth conveys authority and seriousness without corporate coldness.

**Layout Paradigm**: Left-anchored command panel (filters, controls) with a wide main stage. The main area uses a "terrain view" — a scrollable property table that feels like scanning a detailed map. Summary cards along the top act as "elevation markers" showing key metrics.

**Signature Elements**:
- Contour-line decorative borders on cards and section dividers
- Topographic grid pattern as subtle background texture
- "Elevation badges" — priority scores displayed as altitude markers

**Interaction Philosophy**: Precise, deliberate interactions. Hover reveals detailed property cards like map tooltips. Filters snap into place with satisfying micro-animations. Sorting feels like adjusting map layers.

**Animation**: Subtle fade-ins on data load. Cards slide up from below like terrain rising. Filter transitions use a smooth 200ms ease-out. No bouncy or playful motion — everything is measured and purposeful.

**Typography System**: DM Sans for headings (geometric, authoritative), Source Sans 3 for body text (highly readable at small sizes for data tables). Monospace numerals for scores and counts.
</text>
<probability>0.06</probability>
</response>

---

<response>
## Idea 2: "Emergency Operations" — Crisis Command Center

<text>
**Design Movement**: Inspired by emergency management operations centers, FEMA situation rooms, and air traffic control interfaces. Dark mode with high-contrast data visualization.

**Core Principles**:
1. Dark environment for extended screen time and data focus
2. Color-coded severity system (red/amber/yellow/green) as primary visual language
3. Real-time operations feel — even for static data
4. Maximum information accessibility with zero decorative waste

**Color Philosophy**: Deep charcoal background (#1A1D23) with slate panels (#252830). Critical = vivid red (#EF4444), High = amber (#F59E0B), Medium = sky blue (#38BDF8), Low = muted green (#4ADE80). White text on dark for maximum contrast. The dark theme reduces eye strain during long analysis sessions and makes color-coded data pop.

**Layout Paradigm**: Full-bleed dashboard with a persistent top command bar (filters, search). Left sidebar for navigation between views. Main area splits into a metrics ribbon at top, followed by the primary data table. No wasted margins — the data IS the interface.

**Signature Elements**:
- Glowing status indicators that pulse subtly for critical items
- Thin colored left-borders on table rows indicating priority tier
- Compact metric cards with spark-line trends

**Interaction Philosophy**: Keyboard-first navigation. Quick filters toggle instantly. Table rows expand inline to show property details. Everything is one click or keystroke away.

**Animation**: Minimal but purposeful. Status indicators have a subtle glow pulse. Data transitions use 150ms linear easing. Row expansions slide open cleanly. Loading states use a scanning line effect.

**Typography System**: JetBrains Mono for data/numbers (designed for screens, distinct characters), Inter for UI labels and descriptions. Tight line-heights for information density.
</text>
<probability>0.08</probability>
</response>

---

<response>
## Idea 3: "Civic Blueprint" — Government Modernist

<text>
**Design Movement**: Inspired by modernist government design systems (USWDS, GOV.UK), Bauhaus functional aesthetics, and Swiss International Style. Clean, trustworthy, accessible.

**Core Principles**:
1. Clarity over decoration — every element serves a function
2. Strong typographic hierarchy creates natural reading flow
3. Accessible by default — WCAG AAA contrast ratios
4. Institutional trust through visual restraint and precision

**Color Philosophy**: Clean white (#FFFFFF) canvas with navy (#1B3A5C) as primary authority color. Warm gray (#6B7280) for secondary text. Alert tiers use government-standard colors: brick red (#B91C1C) for critical, dark amber (#B45309) for high, steel blue (#1E6091) for medium, forest green (#166534) for low. The palette communicates reliability and public-sector professionalism.

**Layout Paradigm**: Wide single-column layout with a sticky header containing the title and primary filters. Content flows top-to-bottom: summary statistics → filter controls → sortable data table. Generous horizontal rules and section labels create clear information zones. No sidebar — everything is in the main flow for simplicity.

**Signature Elements**:
- Bold section dividers with thick left-border accents
- Large, confident metric numbers paired with small descriptive labels
- Pill-shaped tier badges with solid background colors

**Interaction Philosophy**: Straightforward and predictable. Click column headers to sort. Use dropdowns and checkboxes to filter. Hover highlights entire rows. No hidden interactions — everything is visible and labeled.

**Animation**: Almost none. Instant filter responses. Smooth 100ms transitions on hover states. Focus rings for keyboard navigation. The interface feels solid and immediate, not animated.

**Typography System**: Space Grotesk for headings (modern geometric, authoritative), Work Sans for body and table text (excellent readability, neutral personality). Large heading sizes create strong hierarchy.
</text>
<probability>0.07</probability>
</response>
