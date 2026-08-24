const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * The Spring Boot backend isn't served from the same origin as this app (it's
 * a standalone Render deployment with no reverse proxy in front), so plain
 * relative `/api/...` calls only work when both happen to share an origin.
 * Everywhere else - local `ng serve`, a separately hosted frontend - we need
 * the backend's absolute origin, and its CORS `FRONTEND_URL` must allow
 * whatever origin this app is actually served from.
 */
export const API_BASE_URL = LOCAL_HOSTNAMES.includes(window.location.hostname)
  ? 'http://localhost:8080'
  : 'https://skilltracker-srcv.onrender.com';
