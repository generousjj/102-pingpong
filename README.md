# Ping Pong Scorer

A lightweight, static, mobile-first web application designed to score a ME102 Ping Pong project.

## Features
- **Mobile-First Design**: Large tap targets designed to be used with one thumb entirely on an iPhone.
- **Local Storage State**: The game state persists through browser refreshes locally.
- **Undo functionality**: Mistap? Undo the last event instantly.
- **Dynamic Scoring Models**: Comes with presets for 5ft and 7ft.
- **Progress Tracking**: Tracks your hit/miss probabilities on the fly.

## Development

Since this relies entirely on static assets, running it is as simple as:

1. Opening `index.html` in your favorite web browser.
2. OR firing up a simple local server:
    ```bash
    python3 -m http.server 8000
    ```
    Then visit `http://localhost:8000`

## Configuration
Inside `app.js` you will find `SCORING_PRESETS`. Alter these to adjust to any further rule changes made by the instructor for the project.

```javascript
const SCORING_PRESETS = {
    '5ft': {
        bigHole: 3,
        smallHole: 6,
        miss: -1
    },
    '7ft': {
        bigHole: 4,
        smallHole: 8,
        miss: -1
    }
};
```

## Deployment
Can be automatically deployed via Vercel, Netlify, or Github Pages by just setting the root directory of those services to this code folder. It requires absolutely no build systems.
