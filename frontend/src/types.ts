export type Role = 'READER' | 'LIBRARIAN' | 'ADMIN';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

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
	book: Book;
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


// types.ts - добавь поле bookId
export type Loan = {
	id: number;
	userId: number;
	copyId: number;
	bookId: number; // Добавь это поле
	issuedAt: string;
	dueAt: string;
	returnedAt: string | null;
	status: LoanStatus;
	fineCents: number | null;
	copy?: Copy;
	book?: Book;
  };
  
export interface AvailabilitySubscription  {
	id: number;
	bookId: number;
	isActive: boolean;
	createdAt: string;
	book: Book
}
	
	export interface Tab {
	id: string;
	label: string;
	icon: string;
  }

  export interface Notification {
	id: number;
	userId: number;
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
  }