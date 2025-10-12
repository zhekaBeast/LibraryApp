export type Role = 'READER' | 'LIBRARIAN' | 'ADMIN';

export interface User {
	id: number;
	email: string;
	name: string;
	role: Role;
}

export interface AuthResponse {
	token: string;
	user: User;
}


