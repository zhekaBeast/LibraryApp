import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { AuthResponse, Role, User } from '../types';

interface AuthState {
	user: User | null;
	token: string | null;
}

interface AuthContextValue extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	register: (params: { email: string; name: string; password: string }) => Promise<void>;
	logout: () => void;
	hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>(() => {
		const token = localStorage.getItem('token');
		const userRaw = localStorage.getItem('user');
		return { token, user: userRaw ? (JSON.parse(userRaw) as User) : null };
	});

	useEffect(() => {
		if (state.token) localStorage.setItem('token', state.token);
		else localStorage.removeItem('token');
		if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
		else localStorage.removeItem('user');
	}, [state.token, state.user]);

	const login = useCallback(async (email: string, password: string) => {
		const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
		setState({ token: res.token, user: res.user });
	}, []);

	const register = useCallback(async (params: { email: string; name: string; password: string }) => {
		const res = await api.post<AuthResponse>('/api/auth/register', params);
		setState({ token: res.token, user: res.user });
	}, []);

	const logout = useCallback(() => {
		setState({ token: null, user: null });
	}, []);

	const hasRole = useCallback((...roles: Role[]) => {
		return state.user ? roles.includes(state.user.role) : false;
	}, [state.user]);

	const value = useMemo<AuthContextValue>(() => ({ ...state, login, register, logout, hasRole }), [state, login, register, logout, hasRole]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}


