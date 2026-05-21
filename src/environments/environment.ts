/** When running `ionic serve` on localhost, use the local API (all admin routes). */
const isBrowserLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
  production: false,
  apiBaseUrl: 'https://food.techlapse.co.in',
};
