import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { Book } from '../dto/Book';
import type { BookCopy } from '../dto/BookCopy';




export default function LibrarianBooksPage() {
	const { addToast } = useToast();
	const [books, setBooks] = useState<Book[]>([]);
	const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [newBook, setNewBook] = useState({
		title: '',
		author: '',
		isbn: '',
		genre: ''
	});

	useEffect(() => {
		loadBooks();
	}, []);

	const loadBooks = async () => {
		setLoading(true);
		try {
			const data = await api.get<Book[]>('/api/books');
			setBooks(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Ошибка загрузки');
		} finally {
			setLoading(false);
		}
	};

	const handleAddBook = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await api.post('/api/books', {
				title: newBook.title,
				author: newBook.author,
				isbn: newBook.isbn || null,
				genre: newBook.genre || null
			});
			setNewBook({ title: '', author: '', isbn: '', genre: '' });
			setShowAddForm(false);
			loadBooks();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Ошибка добавления книги');
		}
	};

	const handleAddCopy = async (bookId: number) => {
		const location = prompt('Местоположение экземпляра:');
		if (!location) return;
		
		try {
			await api.post('/api/copies', { bookId, location });
			loadBooks();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Ошибка добавления экземпляра');
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '48px' }}>
				<p style={{ color: '#6b7280' }}>Загрузка книг...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ 
				background: '#fef2f2', 
				border: '1px solid #fecaca', 
				borderRadius: '8px', 
				padding: '16px',
				marginBottom: '24px'
			}}>
				<p style={{ color: '#dc2626', margin: 0 }}>Ошибка загрузки: {error}</p>
			</div>
		);
	}

	return (
		<div>
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
					Управление книгами
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px' }}>
					Добавляйте книги и управляйте экземплярами
				</p>
			</div>

			{/* Add Book Button */}
			<div style={{ marginBottom: '24px' }}>
				<button
					onClick={() => setShowAddForm(!showAddForm)}
					style={{
						background: '#2563eb',
						color: '#fff',
						padding: '12px 24px',
						border: 'none',
						borderRadius: '8px',
						fontSize: '16px',
						fontWeight: '500',
						cursor: 'pointer'
					}}
				>
					{showAddForm ? 'Отменить' : '+ Добавить книгу'}
				</button>
			</div>

			{/* Add Book Form */}
			{showAddForm && (
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					marginBottom: '24px'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Добавить новую книгу
					</h2>
					<form onSubmit={handleAddBook} style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
						<div>
							<input
								value={newBook.title}
								onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
								required
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
								placeholder='Название'
							/>
						</div>
						<div>
							<input
								value={newBook.author}
								onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
								required
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
								placeholder='Автор'
							/>
						</div>
						<div>
							<input
								value={newBook.isbn}
								onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
								placeholder='ISBN'
							/>
						</div>
						<div>
							<input
								value={newBook.genre}
								onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
								placeholder='Жанр'
							/>
						</div>
						<div style={{ display: 'flex', gap: '12px' }}>
							<button
								type="submit"
								style={{
									background: '#10b981',
									color: '#fff',
									padding: '12px 24px',
									border: 'none',
									borderRadius: '8px',
									fontSize: '16px',
									fontWeight: '500',
									cursor: 'pointer'
								}}
							>
								Добавить книгу
							</button>
							<button
								type="button"
								onClick={() => setShowAddForm(false)}
								style={{
									background: '#f3f4f6',
									color: '#374151',
									padding: '12px 24px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									cursor: 'pointer'
								}}
							>
								Отменить
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Books List */}
			<div style={{ display: 'grid', gap: '16px' }}>
				{books.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '48px' }}>
						<p style={{ color: '#6b7280', fontSize: '18px' }}>
							В библиотеке пока нет книг
						</p>
					</div>
				) : (
					books.map((book) => (
						<div 
							key={book.id}
							style={{
								background: '#fff',
								border: '1px solid #e5e7eb',
								borderRadius: '12px',
								padding: '24px',
								boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
								<div style={{ flex: 1 }}>
									<h3 style={{ 
										fontSize: '20px', 
										fontWeight: '600', 
										color: '#1f2937', 
										margin: '0 0 8px 0' 
									}}>
										{book.title}
									</h3>
									<p style={{ 
										color: '#6b7280', 
										margin: '0 0 8px 0',
										fontSize: '16px'
									}}>
										{book.author}
									</p>
									{book.isbn && (
										<p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>
											ISBN: {book.isbn}
										</p>
									)}
									{book.genre && (
										<span style={{
											display: 'inline-block',
											background: '#eff6ff',
											color: '#2563eb',
											padding: '4px 8px',
											borderRadius: '4px',
											fontSize: '14px',
											fontWeight: '500'
										}}>
											{book.genre}
										</span>
									)}
								</div>
								<div style={{ display: 'flex', gap: '8px' }}>
									<Link 
										to={`/book/${book.id}`}
										style={{
											background: '#2563eb',
											color: '#fff',
											padding: '8px 16px',
											borderRadius: '6px',
											textDecoration: 'none',
											fontSize: '14px',
											fontWeight: '500'
										}}
									>
										Подробнее
									</Link>
									<button
										onClick={() => handleAddCopy(book.id)}
										style={{
											background: '#10b981',
											color: '#fff',
											padding: '8px 16px',
											border: 'none',
											borderRadius: '6px',
											fontSize: '14px',
											cursor: 'pointer'
										}}
									>
										+ Экземпляр
									</button>
								</div>
							</div>

							{/* Copies */}
							<div>
								<h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
									Экземпляры ({bookCopies.length})
								</h4>
								{bookCopies.length === 0 ? (
									<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
										Нет экземпляров
									</p>
								) : (
									<div style={{ display: 'grid', gap: '8px' }}>
									{bookCopies.map((copy) => (
											<div 
												key={copy.id}
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													padding: '12px 16px',
													background: copy.status === 'available' ? '#f0f9ff' : '#f9fafb',
													border: `1px solid ${copy.status === 'available' ? '#0ea5e9' : '#e5e7eb'}`,
													borderRadius: '8px'
												}}
											>
												<div>
													<span style={{ fontWeight: '500' }}>Экземпляр #{copy.id}</span>
													{copy.location && (
														<span style={{ color: '#6b7280', marginLeft: '8px' }}>
															({copy.location})
														</span>
													)}
												</div>
												<span style={{
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '12px',
													fontWeight: '500',
													background: copy.status === 'available' ? '#dcfce7' : '#fef2f2',
													color: copy.status === 'available' ? '#166534' : '#dc2626'
												}}>
													{copy.status === 'available' ? 'Доступен' : 'Выдан'}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
