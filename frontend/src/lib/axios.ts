import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api/v1" : "/api/v1",
	withCredentials: true,
});

// Track if a token refresh is already in progress to avoid concurrent refresh loops
let isRefreshing = false;
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve();
		}
	});
	failedQueue = [];
};

// Response interceptor: auto-refresh access token on TOKEN_EXPIRED, retry original request
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		const isTokenExpired =
			error.response?.status === 401 &&
			(error.response?.data?.error?.code === "TOKEN_EXPIRED" ||
				error.response?.data?.code === "TOKEN_EXPIRED");

		// Don't retry refresh-token requests or already-retried requests
		const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh-token");
		const isAuthEndpoint = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/signup");

		if (isTokenExpired && !originalRequest._retry && !isRefreshRequest && !isAuthEndpoint) {
			if (isRefreshing) {
				// Queue this request until refresh completes
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(() => axiosInstance(originalRequest)).catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Try to refresh the access token
				await axiosInstance.post("/auth/refresh-token");
				processQueue(null);
				// Retry the original request with the new cookie
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError);
				// Refresh failed — redirect to login
				window.location.href = "/login";
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);
