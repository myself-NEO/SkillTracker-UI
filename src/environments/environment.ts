// Default (production build): talk to the live backend on Render (Singapore), which uses the live
// Neon database. `ng serve` swaps this file out via angular.json fileReplacements - see environment.local.ts.
export const environment = {
  apiBaseUrl: 'https://skilltracker-api-2ae9.onrender.com'
};
