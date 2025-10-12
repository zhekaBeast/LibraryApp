import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Book {
	id: number;
	title: string;
	author: string;
	genre?: string | null;
}

export default function CatalogPage() {
	const [q, setQ] = useState('');
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		api.get<Book[]>('/api/books')
			.then((data) => {
				if (active) setBooks(data);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	const filtered = q
		? books.filter((b) =>
			[b.title, b.author, b.genre ?? ''].some((s) => s.toLowerCase().includes(q.toLowerCase()))
		  )
		: books;

	return (
		<div>
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
					Каталог книг
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px' }}>
					Найдите и забронируйте книги из нашей библиотеки
				</p>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<input 
					placeholder="Поиск по названию, автору или жанру..." 
					value={q} 
					onChange={(e) => setQ(e.target.value)}
					style={{
						width: '100%',
						maxWidth: '500px',
						padding: '12px 16px',
						border: '1px solid #d1d5db',
						borderRadius: '8px',
						fontSize: '16px',
						boxSizing: 'border-box'
					}}
				/>
			</div>

			{loading && (
				<div style={{ textAlign: 'center', padding: '48px' }}>
					<p style={{ color: '#6b7280' }}>Загрузка каталога...</p>
				</div>
			)}

			{error && (
				<div style={{ 
					background: '#fef2f2', 
					border: '1px solid #fecaca', 
					borderRadius: '8px', 
					padding: '16px',
					marginBottom: '24px'
				}}>
					<p style={{ color: '#dc2626', margin: 0 }}>Ошибка загрузки: {error}</p>
				</div>
			)}

			{!loading && !error && (
				<div style={{ display: 'grid', gap: '16px' }}>
					{filtered.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '48px' }}>
							<p style={{ color: '#6b7280', fontSize: '18px' }}>
								{q ? 'Книги не найдены' : 'В каталоге пока нет книг'}
							</p>
						</div>
					) : (
						filtered.map((book) => (
							<div 
								key={book.id}
								style={{
									background: '#fff',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									padding: '20px',
									boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
									transition: 'all 0.2s'
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
									<div style={{ flex: 1 }}>
										<h3 style={{ 
											fontSize: '18px', 
											fontWeight: '600', 
											color: '#1f2937', 
											margin: '0 0 8px 0' 
										}}>
											{book.title}
										</h3>
										<p style={{ 
											color: '#6b7280', 
											margin: '0 0 4px 0',
											fontSize: '16px'
										}}>
											{book.author}
										</p>
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
									<Link 
										to={`/book/${book.id}`}
										style={{
											background: '#2563eb',
											color: '#fff',
											padding: '8px 16px',
											borderRadius: '6px',
											textDecoration: 'none',
											fontSize: '14px',
											fontWeight: '500',
											transition: 'all 0.2s'
										}}
										onMouseOver={(e) => {
											e.currentTarget.style.background = '#1d4ed8'
										}}
										onMouseOut={(e) => {
											e.currentTarget.style.background = '#2563eb'
										}}
									>
										Подробнее
									</Link>
								</div>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}


