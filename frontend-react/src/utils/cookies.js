import { Cookies } from 'react-cookie';

const cookies = new Cookies();

// Set a cookie (default: 20 years)
export function setCookie(name, value, options = {}) {
  cookies.set(name, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 20, // 20 years in seconds
    ...options,
  });
}

// Get a cookie
export function getCookie(name) {
  return cookies.get(name);
}

// Remove a cookie
export function removeCookie(name, options = {}) {
  cookies.remove(name, { path: '/', ...options });
} 