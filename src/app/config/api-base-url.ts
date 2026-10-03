import { environment } from '../../environments/environment';

/**
 * The Spring Boot backend isn't served from the same origin as this app (it's
 * a standalone Render deployment with no reverse proxy in front), so every
 * `/api/...` call needs the backend's absolute origin, and its CORS
 * `FRONTEND_URL` must allow whatever origin this app is actually served from.
 *
 * Which backend is used is picked at build time by the Angular configuration:
 * `npm run dev` -> local backend, `npm run dev:live` / production build -> live backend.
 */
export const API_BASE_URL = environment.apiBaseUrl;
