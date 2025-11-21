
export interface BookCopy {
	id: number;
	bookId: number;
	status: string;
	location?: string | null;
}