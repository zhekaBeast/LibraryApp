import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Book {
	id: number;
	title: string;
	author: string;
	genre?: string | null;
	copies: BookCopy[];
}

interface BookCopy {
	id: number;
	bookId: number;
	status: string;
	location?: string | null;
}

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
}

interface Loan {
	id: number;
	issuedAt: string;
	dueAt: string;
	returnedAt?: string | null;
	fineCents: number;
	user: User;
	copy: BookCopy & { book: Book };
}

export default function LibrarianDashboardPage() {
	const [books, setBooks] = useState<Book[]>([]);
	const [loans, setLoans] = useState<Loan[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		
		Promise.all([
			api.get<Book[]>('/api/books'),
			api.get<Loan[]>('/api/loans'),
			api.get<User[]>('/api/users')
		])
		.then(([booksData, loansData, usersData]) => {
			if (active) {
				setBooks(booksData);
				setLoans(loansData);
				setUsers(usersData);
			}
		})
		.catch((e) => setError(e.message))
		.finally(() => setLoading(false));
		
		return () => {
			active = false;
		};
	}, []);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	const activeLoans = loans.filter(loan => !loan.returnedAt);
	const overdueLoans = activeLoans.filter(loan => new Date(loan.dueAt) < new Date());
	const totalBooks = books.length;
	const totalCopies = books.reduce((sum, book) => sum + book.copies.length, 0);
	const availableCopies = books.reduce((sum, book) => 
		sum + book.copies.filter(copy => copy.status === 'available').length, 0
	);

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '48px' }}>
				<p style={{ color: '#6b7280' }}>Загрузка данных...</p>
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
					Панель управления библиотекой
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px' }}>
					Управление книгами, займами и пользователями
				</p>
			</div>

			{/* Statistics Cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					borderLeft: '4px solid #3b82f6'
				}}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px 0' }}>
						Всего книг
					</h3>
					<p style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
						{totalBooks}
					</p>
				</div>

				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					borderLeft: '4px solid #10b981'
				}}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px 0' }}>
						Всего экземпляров
					</h3>
					<p style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
						{totalCopies}
					</p>
				</div>

				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					borderLeft: '4px solid #f59e0b'
				}}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px 0' }}>
						Доступно
					</h3>
					<p style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
						{availableCopies}
					</p>
				</div>

				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					borderLeft: '4px solid',
                    color: '#ef4444'
				}}>
					<h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px 0' }}>
						Активных займов
					</h3>
					<p style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
						{activeLoans.length}
					</p>
				</div>
			</div>

			{/* Overdue Loans Alert */}
			{overdueLoans.length > 0 && (
				<div style={{ 
					background: '#fef2f2', 
					border: '1px solid #fecaca', 
					borderRadius: '8px', 
					padding: '16px',
					marginBottom: '24px'
				}}>
					<h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
						⚠️ Просроченные займы ({overdueLoans.length})
					</h3>
					<p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>
						Требуется внимание: {overdueLoans.length} займов просрочены
					</p>
				</div>
			)}

			<div style={{ display: 'grid', gap: '24px' }}>
				{/* Recent Loans */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Недавние займы
					</h2>
					
					{activeLoans.length === 0 ? (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
							Нет активных займов
						</p>
					) : (
						<div style={{ display: 'grid', gap: '12px' }}>
							{activeLoans.slice(0, 5).map((loan) => (
								<div 
									key={loan.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '16px',
										background: new Date(loan.dueAt) < new Date() ? '#fef2f2' : '#f9fafb',
										border: `1px solid ${new Date(loan.dueAt) < new Date() ? '#fecaca' : '#e5e7eb'}`,
										borderRadius: '8px'
									}}
								>
									<div style={{ flex: 1 }}>
										<h3 style={{ 
											fontSize: '16px', 
											fontWeight: '600', 
											color: '#1f2937', 
											margin: '0 0 4px 0' 
										}}>
											{loan.copy.book.title}
										</h3>
										<p style={{ 
											color: '#6b7280', 
											margin: '0 0 4px 0',
											fontSize: '14px'
										}}>
											{loan.user.name} ({loan.user.email})
										</p>
										<p style={{ 
											color: new Date(loan.dueAt) < new Date() ? '#dc2626' : '#6b7280',
											margin: 0,
											fontSize: '14px'
										}}>
											Срок возврата: {formatDate(loan.dueAt)}
											{new Date(loan.dueAt) < new Date() && ' (просрочено)'}
										</p>
									</div>
									<div style={{ display: 'flex', gap: '8px' }}>
										<button style={{
											background: '#10b981',
											color: '#fff',
											padding: '6px 12px',
											border: 'none',
											borderRadius: '6px',
											fontSize: '12px',
											cursor: 'pointer'
										}}>
											Вернуть
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Quick Actions */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Быстрые действия
					</h2>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
						<Link 
							to="/librarian/books"
							style={{
								background: '#2563eb',
								color: '#fff',
								padding: '16px 20px',
								borderRadius: '8px',
								textDecoration: 'none',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								textAlign: 'center'
							}}
						>
							📚 Управление книгами
						</Link>
						<Link 
							to="/librarian/loans"
							style={{
								background: '#10b981',
								color: '#fff',
								padding: '16px 20px',
								borderRadius: '8px',
								textDecoration: 'none',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								textAlign: 'center'
							}}
						>
							📋 Управление займами
						</Link>
						<Link 
							to="/librarian/users"
							style={{
								background: '#f59e0b',
								color: '#fff',
								padding: '16px 20px',
								borderRadius: '8px',
								textDecoration: 'none',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								textAlign: 'center'
							}}
						>
							👥 Управление пользователями
						</Link>
						<button style={{
							background: '#8b5cf6',
							color: '#fff',
							padding: '16px 20px',
							border: 'none',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							textAlign: 'center'
						}}>
							📊 Отчеты
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
