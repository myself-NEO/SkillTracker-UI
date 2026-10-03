// Default (production build): talk to the live backend on Render, which uses the live database.
// `ng serve` swaps this file out via angular.json fileReplacements - see environment.local.ts.
export const environment = {
  apiBaseUrl: 'https://skilltracker-srcv.onrender.com'
};
