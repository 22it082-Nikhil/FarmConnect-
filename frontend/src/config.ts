const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Remove trailing slash if present to avoid "//api" errors (e.g., "https://api.com/" -> "https://api.com")
const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

console.log("🔌 Configured API URL:", API_URL);

export default API_URL;
