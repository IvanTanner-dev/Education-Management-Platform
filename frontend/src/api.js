import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

if (import.meta.env.DEV) {
  console.log("API Base URL:", baseURL);
}
// In unit tests, `axios` may be mocked and `create()` may exist but return `undefined`.
// Fall back to the mocked axios object to avoid crashing at import time.
const createdApi =
  typeof axios?.create === "function" ? axios.create({ baseURL }) : undefined;
const api =
  createdApi && typeof createdApi?.get === "function" ? createdApi : axios;

// Establish global authorization logic by injecting JWT tokens into outgoing requests.
if (api?.interceptors?.request?.use) {
  api.interceptors.request.use((config) => {
    // Avoid recursion or invalid headers during token refresh cycles.
    if (config.skipAuthRefresh) return config;

    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

if (api?.interceptors?.response?.use) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;

      // Handle session expiration by attempting an automated token rotation.
      if (status !== 401) return Promise.reject(error);
      if (!originalRequest) return Promise.reject(error);
      if (originalRequest._retry) return Promise.reject(error);
      if (originalRequest.skipAuthRefresh) return Promise.reject(error);

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Exchange the persistent refresh token for a new short-lived access token.
        const refreshResponse = await axios.post(
          `${baseURL}/api/token/refresh/`,
          { refresh: refreshToken },
          { skipAuthRefresh: true },
        );

        const newAccessToken = refreshResponse.data?.access;
        if (!newAccessToken) throw new Error("No access token returned");

        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    },
  );
}

export default api;
