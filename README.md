# Community Event Finder

A full-stack event discovery app built with React and Node.js.

## Project structure

- `server/` — Express API and event data storage
- `server/data/completed-events.json` — automatically archived past events
- `client/` — React + Vite user interface
- `postman/` — Postman collection examples for the backend API

## Setup

1. Install server dependencies:
   ```bash
   npm run install:server
   ```

2. Install client dependencies:
   ```bash
   npm run install:client
   ```

3. Start the backend:
   ```bash
   npm run dev:server
   ```

4. Start the frontend in a second terminal:
   ```bash
   npm run dev:client
   ```

5. Open the app at http://localhost:5173

## Publish the website

`localhost` is only the private development address on your computer. To make this a normal public website, deploy the `client` folder to a frontend host such as Vercel or Netlify, deploy the `server` folder to a Node host such as Render or Railway, and connect a custom domain through the frontend host.

When the backend is hosted, add this frontend environment variable before building:

```text
VITE_API_URL=https://your-backend-domain.example.com/api
```

The local Vite proxy continues to work when `VITE_API_URL` is not set.

### Render deployment

This repository includes `render.yaml` for a single Render web service. In Render, choose **New +** then **Blueprint**, connect this repository, and select the `render.yaml` file. The service will build the React client, start Express, and expose both the website and API from the same public URL.

Because the prototype stores events in JSON files, use a persistent disk or move the data layer to a database before treating the deployment as production data storage.

## Backend API

Base URL: `http://localhost:5000/api`

### Endpoints

- `GET /api/events` — get upcoming events with optional filters (`city`, `category`, `search`)
- `GET /api/events?status=completed` — get events archived after their date has passed
- `GET /api/events/:id` — get a single event
- `POST /api/events` — create a new event with `address`, `organizer`, and optional `latitude`/`longitude`
- `PUT /api/events/:id` — update an event
- `DELETE /api/events/:id` — delete an event only when the `x-organizer` header matches the organizer name
- `GET /api/health` — backend health check

## Postman

Import the collection from `postman/EventFinderAPI.postman_collection.json`.

## Notes

The backend uses local JSON files for simple persistence. On each event read/write, events whose date has passed are moved from `events.json` into `completed-events.json`, so users can distinguish upcoming listings from event history.
