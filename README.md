# Calendar Sync Setup UI

Web application for configuring multi-calendar sync for Alopex Digital employees.

## Quick Start

1. Clone this repo
2. Deploy to Cloudflare Pages
3. Configure Google OAuth Client ID in `config.js`
4. Set up n8n webhooks (see Task 3)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML page |
| `style.css` | Styling |
| `config.js` | Configuration |
| `app.js` | Application logic |

## Features

- Google Sign-In (restricted to @alopex.digital)
- Add multiple external calendars
- Configure N:N sync rules
- Choose visibility (Censored/Full) per rule
- Team calendar sharing toggle
- Save configuration to n8n backend

## Preview

Deploy to Cloudflare Pages for instant preview at `*.pages.dev`
