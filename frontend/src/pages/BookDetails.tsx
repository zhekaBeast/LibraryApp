import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface BookCopy {
	id: number;
	bookId: number;
	status: string;
	location?: string | null;
}

interface Book {
	id: number;
	title: string;
	author: string;
	isbn?: string | null;
	genre?: string | null;
	copies: BookCopy[];
	createdAt: string;
}

export default function BookDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const { user, hasRole } = useAuth();
	const { addToast } = useToast();
	const [book, setBook] = useState<Book | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reserving, setReserving] = useState(false);

	useEffect(() => {
		if (!id) return;
		
		let active = true;
		setLoading(true);
		api.get<Book>(`/api/books/${id}`)
			.then((data) => {
				if (active) setBook(data);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
		return () => {
			active = false;
		};
	}, [id]);

	const handleReserve = async () => {
		if (!book || !user) return;
		
		setReserving(true);
		try {
			await api.post('/api/reservations', { bookId: book.id });
			addToast('Книга успешно забронирована!', 'success');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Ошибка бронирования';
			addToast(errorMessage, 'error');
		} finally {
			setReserving(false);
		}
	};

	const availableCopies = book?.copies.filter(copy => copy.status === 'available') || [];
	const isAvailable = availableCopies.length > 0;

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '48px' }}>
				<p style={{ color: '#6b7280' }}>Загрузка информации о книге...</p>
			</div>
		);
	}

	if (error || !book) {
		return (
			<div style={{ textAlign: 'center', padding: '48px' }}>
				<p style={{ color: '#dc2626' }}>Ошибка: {error || 'Книга не найдена'}</p>
				<Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
					← Вернуться к каталогу
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div style={{ marginBottom: '24px' }}>
				<Link 
					to="/" 
					style={{ 
						color: '#6b7280', 
						textDecoration: 'none',
						fontSize: '14px',
						display: 'inline-flex',
						alignItems: 'center',
						gap: '4px',
						marginBottom: '16px'
					}}
				>
					← Вернуться к каталогу
				</Link>
			</div>

			<div style={{ 
				background: '#fff', 
				borderRadius: '12px', 
				padding: '32px',
				boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
				marginBottom: '24px'
			}}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
					<div style={{ flex: 1 }}>
						<h1 style={{ 
							fontSize: '32px', 
							fontWeight: '700', 
							color: '#1f2937', 
							margin: '0 0 8px 0' 
						}}>
							{book.title}
						</h1>
						<p style={{ 
							fontSize: '20px', 
							color: '#6b7280', 
							margin: '0 0 16px 0' 
						}}>
							{book.author}
						</p>
						{book.genre && (
							<span style={{
								display: 'inline-block',
								background: '#eff6ff',
								color: '#2563eb',
								padding: '6px 12px',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								marginBottom: '16px'
							}}>
								{book.genre}
							</span>
						)}
					</div>
					<div style={{ textAlign: 'right' }}>
						<div style={{
							padding: '8px 16px',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							background: isAvailable ? '#dcfce7' : '#fef2f2',
							color: isAvailable ? '#166534' : '#dc2626'
						}}>
							{isAvailable ? 'Доступна' : 'Недоступна'}
						</div>
					</div>
				</div>

				{book.isbn && (
					<div style={{ marginBottom: '16px' }}>
						<strong style={{ color: '#374151' }}>ISBN:</strong> {book.isbn}
					</div>
				)}

				<div style={{ marginBottom: '24px' }}>
					<h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
						Экземпляры ({book.copies.length})
					</h3>
					<div style={{ display: 'grid', gap: '8px' }}>
						{book.copies.map((copy) => (
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
				</div>

				{user && (
					<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
						{isAvailable ? (
							<button
								onClick={handleReserve}
								disabled={reserving}
								style={{
									background: '#2563eb',
									color: '#fff',
									padding: '12px 24px',
									border: 'none',
									borderRadius: '8px',
									fontSize: '16px',
									fontWeight: '500',
									cursor: reserving ? 'not-allowed' : 'pointer',
									opacity: reserving ? 0.7 : 1,
									transition: 'all 0.2s'
								}}
								onMouseOver={(e) => {
									if (!reserving) e.currentTarget.style.background = '#1d4ed8'
								}}
								onMouseOut={(e) => {
									if (!reserving) e.currentTarget.style.background = '#2563eb'
								}}
							>
								{reserving ? 'Бронирование...' : 'Забронировать'}
							</button>
						) : (
							<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
								Все экземпляры книги в настоящее время выданы
							</p>
						)}
					</div>
				)}

				{!user && (
					<p style={{ color: '#6b7280' }}>
						<Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
							Войдите
						</Link>
						{' '}в систему, чтобы забронировать книгу
					</p>
				)}
			</div>

			{hasRole('LIBRARIAN', 'ADMIN') && (
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Управление (только для библиотекарей)
					</h3>
					<div style={{ display: 'flex', gap: '12px' }}>
						<button style={{
							background: '#10b981',
							color: '#fff',
							padding: '8px 16px',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							cursor: 'pointer'
						}}>
							Добавить экземпляр
						</button>
						<button style={{
							background: '#f59e0b',
							color: '#fff',
							padding: '8px 16px',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							cursor: 'pointer'
						}}>
							Редактировать книгу
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
