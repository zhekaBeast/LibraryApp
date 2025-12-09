const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

export interface ApiClientOptions {
	getToken?: () => string | null;
	onError?: (error: Error) => void;
}

export class ApiClient {
	private readonly getToken: () => string | null;
	private readonly onError?: (error: Error) => void;

	constructor(options: ApiClientOptions = {}) {
		this.getToken = options.getToken ?? (() => localStorage.getItem('token'));
		this.onError = options.onError;
	}

	private buildHeaders(extra?: HeadersInit): HeadersInit {
		const headers: HeadersInit = { 'Content-Type': 'application/json', ...extra };
		const token = this.getToken();
		if (token) {
			return { ...headers, Authorization: `Bearer ${token}` };
		}
		return headers;
	}

	async request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const url = `${API_BASE}${path}`;
		try {
			const res = await fetch(url, { ...init, headers: this.buildHeaders(init.headers) });
			
			if (!res.ok) {
				let errorMessage = `Request failed with ${res.status}`;
				
				try {
					const errorData = await res.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch {
					// If JSON parsing fails, use status text or default message
					errorMessage = res.statusText || errorMessage;
				}
				
				const error = new Error(errorMessage);
				(error as any).status = res.status;
				
				// Handle auth errors
				if (res.status === 401) {
					// Clear token and redirect to login
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					//window.location.href = '/login';
				}
				
				throw error;
			}
			
			return (await res.json()) as T;
		} catch (error) {
			if (this.onError && error instanceof Error) {
				this.onError(error);
			}
			throw error;
		}
	}

	get<T>(path: string): Promise<T> {
		return this.request<T>(path);
	}

	post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
	}

	put<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
	}

	delete<T>(path: string): Promise<T> {
		return this.request<T>(path, { method: 'DELETE' });
	}
}

export const api = new ApiClient();


