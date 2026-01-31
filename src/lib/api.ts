import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// API base URL - adjust based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Create axios instance
export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Types
export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "GURU" | "MURID";
	createdAt?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
	role: "GURU" | "MURID";
}

export interface AuthResponse {
	success: boolean;
	data: {
		user: User;
		accessToken: string;
		refreshToken: string;
	};
	message: string;
}

export interface ApiError {
	success: false;
	error: string;
	message?: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = "sahabatguru_access_token";
const REFRESH_TOKEN_KEY = "sahabatguru_refresh_token";

// Token management
export const tokenManager = {
	getAccessToken: (): string | null => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(ACCESS_TOKEN_KEY);
	},

	getRefreshToken: (): string | null => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	},

	setTokens: (tokens: AuthTokens): void => {
		if (typeof window === "undefined") return;
		localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
		localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
	},

	clearTokens: (): void => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	},
};

// Request interceptor - attach access token
api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = tokenManager.getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean;
		};

		// If 401 and not already retrying
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// Queue requests while refreshing
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return api(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = tokenManager.getRefreshToken();

			if (!refreshToken) {
				tokenManager.clearTokens();
				if (typeof window !== "undefined") {
					window.location.href = "/login";
				}
				return Promise.reject(error);
			}

			try {
				const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
					refreshToken,
				});

				const { accessToken, refreshToken: newRefreshToken } = response.data.data;
				tokenManager.setTokens({
					accessToken,
					refreshToken: newRefreshToken,
				});

				processQueue(null, accessToken);
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error, null);
				tokenManager.clearTokens();
				if (typeof window !== "undefined") {
					window.location.href = "/login";
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

// Auth API functions
export const authApi = {
	login: async (data: LoginRequest): Promise<AuthResponse> => {
		const response = await api.post<AuthResponse>("/auth/login", data);
		return response.data;
	},

	register: async (data: RegisterRequest): Promise<AuthResponse> => {
		const response = await api.post<AuthResponse>("/auth/register", data);
		return response.data;
	},

	logout: async (): Promise<void> => {
		const refreshToken = tokenManager.getRefreshToken();
		if (refreshToken) {
			try {
				await api.post("/auth/logout", { refreshToken });
			} catch {
				// Ignore logout errors
			}
		}
		tokenManager.clearTokens();
	},

	getCurrentUser: async (): Promise<User> => {
		const response = await api.get<{ success: boolean; data: User }>("/auth/me");
		return response.data.data;
	},

	refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
		const response = await api.post<{ success: boolean; data: AuthTokens }>(
			"/auth/refresh",
			{ refreshToken }
		);
		return response.data.data;
	},
};

export default api;
