export interface Book {
	id: number;
	title: string;
	author: string;
	isbn?: string | null;
	genre?: string | null;
	createdAt: string;
}
