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

export interface Book {
	id: number;
	title: string;
	author: string;
	isbn?: string | null;
	genre?: string | null;
	createdAt: string;
}


export interface BookCopy {
	id: number;
	bookId: number;
	status: string;
}
