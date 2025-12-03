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

export interface Review {
	id: number;
	userId: number;
	bookId: number;
	rating: number;
	comment: string | null;
	createdAt: string;
	user: {
	  name: string;
	};
  }

  export interface ReviewsSectionProps {
	bookId: number;
  }

  export interface SubscriptionCheckResponse {
	isSubscribed: boolean;
  }