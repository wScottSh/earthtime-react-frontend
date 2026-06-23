# Earth Time Frontend

> 🌍 **A React-based clock visualization for the Earth Time global time system**
>
> **Live Demo:** [earthtime-react.surge.sh](https://earthtime-react.surge.sh)

For the backend API that powers this application, see [earthtime-react-backend](../earthtime-react-backend/README.md).

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Quick Start](#quick-start)
- [Clock Face Reference](#clock-face-reference)
- [Notation Cheatsheet](#notation-cheatsheet)
- [Project Structure](#project-structure)
- [Development](#development)
- [Related](#related)

---

## Introduction

Earth Time is a revolutionary approach to time notation that combines **global synchronization** with **local solar awareness**. Unlike traditional timezones that prioritize local time with awkward conversions, Earth Time provides:

1. **A single global reference** (`@beats`) — Everyone on Earth sees the same `@beat` at the same moment
2. **Solar-aware local context** — Your local sunrise, sunset, and noon are always visible
3. **Ecological awareness** — Connects you to Earth's natural rhythms while enabling global coordination

### Why Earth Time?

Traditional time systems force a choice:
- **Local time (timezones)**: Easy daily use, but terrible for global coordination
- **Universal time (UTC)**: Great for coordination, but disconnects you from local day/night cycles

**Earth Time solves both problems.** It uses Point Nemo (the most remote ocean location) as a neutral global reference while preserving the visual representation of your local solar cycle.

In our internet-connected world, coordinating across timezones should be effortless. With Earth Time, when someone says "Let's meet at `@450`", everyone worldwide knows exactly when that is—no timezone math required.

---

## Features

- 🕐 **Interactive Clock Face** — Visualizes global `@beats` and local solar positions
- 🌅 **Solar Markers** — See your local sunrise, sunset, midnight, and noon
- 📅 **Earth Date Display** — Year and day based on the Southern Solstice
- 🌐 **Global Solar Events** — Track solstices, equinoxes, and mid-season points
- 📍 **Location-Aware** — Updates based on your coordinates
- 💡 **Tooltips** — Hover over elements to see Earth Time and Gregorian equivalents
- 📱 **Responsive Design** — Works on desktop and mobile

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Running [backend server](../earthtime-react-backend/README.md) (for full functionality)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd earthtime-react-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`.

### Full Stack Development

To run both frontend and backend together:

```bash
# Terminal 1: Start backend (from earthtime-react-backend/)
cd ../earthtime-react-backend
npm run dev

# Terminal 2: Start frontend (from this directory)
npm run dev
```

---

## Clock Face Reference

![Earth Time Clockface](docs/mockup.png)

The Earth Time clock face displays:

| Element | Position | Description |
|---------|----------|-------------|
| **Current @beat** | Center | Global synchronized time (0-1000) |
| **Midnight (`*`)** | Varies | Your local solar midnight position |
| **Sunrise (`^`)** | Varies | When the sun rises at your location |
| **Midday (`#`)** | Top | Your local solar noon (clock anchor) |
| **Sunset (`-`)** | Varies | When the sun sets at your location |
| **Global Midnight Indicator** | Red line | Shows `@0` position on your local clock |

---

## Notation Cheatsheet

<details>
<summary><strong>Click to expand full notation reference</strong></summary>

### Time Units

| Name | Symbol | Example | Meaning |
|------|--------|---------|---------|
| Global Time | `@` | `@045` or `@45` | Beats since midnight at Point Nemo |
| Day | `:` | `:005` or `:5` | Days since Southern Solstice |
| Year | `!` | `!2025` | Solar years since Christ's birth |
| Decimal Beats | `.` | `@45.27` | Fractional beats |

### Local Solar Markers

| Name | Symbol | Example | Meaning |
|------|--------|---------|---------|
| Midnight | `*` | `*837` | Your local midnight in @beats |
| Sunrise | `^` | `^109` | Your local sunrise in @beats |
| Midday | `#` | `#337` | Your local solar noon in @beats |
| Sunset | `-` | `-560` | Your local sunset in @beats |

### Personal Markers

| Name | Symbol | Example | Meaning |
|------|--------|---------|---------|
| Wake Time | `{` | `{123` | When you wake up |
| Bed Time | `}` | `}159` | When you go to sleep |

### Global Solar Events (GSE)

| Name | Abbr | Description |
|------|------|-------------|
| Southern Solstice | `ss` | Day :0 — Year begins (Dec ~21) |
| Mid-Southern Solstice | `mss` | Halfway to Northward Equinox |
| Northward Equinox | `ne` | Spring in Northern Hemisphere |
| Mid-Northward Equinox | `mne` | Halfway to Northern Solstice |
| Northern Solstice | `ns` | Summer in Northern Hemisphere |
| Mid-Northern Solstice | `mns` | Halfway to Southward Equinox |
| Southward Equinox | `se` | Autumn in Northern Hemisphere |
| Mid-Southward Equinox | `mse` | Halfway to Southern Solstice |

### Relative Time

| Pattern | Example | Meaning |
|---------|---------|---------|
| `^\|@52\|` | | 52 beats after sunrise |
| `\|@20\|@` | | 20 beats before now |
| `:\|:30\|` | | 30 days from today |
| `\|:19\|mss` | | 19 days before mid-southern solstice |

### Absolute Time

Full timestamp format: `!2025:019@456`
- Year: 2025
- Day: 19 (since Southern Solstice)
- Beat: 456

### Duration

| Symbol | Example | Meaning |
|--------|---------|---------|
| `%` | `@53%` | 53 beats long |
| | `:16%` | 16 days long |
| | `!1:157%` | 1 year and 157 days long |

</details>

---

## Project Structure

```
earthtime-react-frontend/
├── src/
│   ├── components/
│   │   ├── Clock/           # Main clock container
│   │   ├── ClockFace/       # Clock visualization components
│   │   └── UI/              # Reusable UI components (tooltips, etc.)
│   ├── models/              # Data models
│   ├── utils/               # Utility functions
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json
```

### Key Components

| Component | Description |
|-----------|-------------|
| `Clock` | Main container that polls the backend API |
| `ClockFace` | SVG-based clock visualization |
| `TooltipWrapper` | Hover tooltips showing dual time formats |

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

### Tech Stack

- **React 19** — UI framework
- **Vite 5** — Build tool and dev server
- **Axios** — HTTP client for backend API
- **react-tooltip** — Tooltip component

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment.

---

## Related

- 🔧 **[Backend API](../earthtime-react-backend/README.md)** — Express.js server providing Earth Time calculations
- 🌐 **[Live Demo](https://earthtime-react.surge.sh)** — Try the deployed application
- 📖 **[Swatch Internet Time](https://en.wikipedia.org/wiki/Swatch_Internet_Time)** — A predecessor concept (single timezone, no local solar context)

---

## Philosophy

> *"My hope is that this holistic view of time notation will lead people to be more aware of their natural relative connection with the Earth's cycles of night and day, as well as a global view of humans living on the planet in a complex interconnected web of ecosystems."*

Traditional attempts at global time (like Swatch Internet Time) solved coordination but lost local context. Earth Time preserves both:

- **Global reference**: `@beats` are synchronized worldwide
- **Local context**: Solar positions keep you grounded in your environment
- **Neutral reference**: Point Nemo (the most remote ocean location) has no geopolitical bias

---

## Contributing

Contributions are welcome! Please see the [project backlog on Trello](https://trello.com/b/sU6SPRV5) for current development priorities.

---

## License

This project is part of the Earth Time initiative.
