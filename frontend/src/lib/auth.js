// Auth storage — uses sessionStorage instead of localStorage.
// sessionStorage is cleared when the browser tab closes, reducing the window
// of exposure to XSS attacks compared to localStorage.
// For production-grade security consider migrating to httpOnly cookies on the backend.

const TOKEN_KEY = "arroyo_admin_token";

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};
