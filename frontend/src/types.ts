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
	genre?: string;
	year?: number;
	isbn?: string;
	description?: string;
  }
  


export interface Copy {
	id: number;
	status: 'AVAILABLE' | 'BORROWED' | 'DELETED';
	barcode: string;
  }
