import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Book {
	id: number;
	title: string;
	author: string;
	genre?: string | null;
}

interface BookCopy {
	id: number;
	bookId: number;
	status: string;
	location?: string | null;
	book: Book;
}

interface Loan {
	id: number;
	issuedAt: string;
	dueAt: string;
	returnedAt?: string | null;
	fineCents: number;
	copy: BookCopy;
}

interface Reservation {
	id: number;
	status: string;
	createdAt: string;
	book: Book;
}

export default function DashboardPage() {
	const [loans, setLoans] = useState<Loan[]>([]);
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		
		Promise.all([
			api.get<Loan[]>('/api/loans/my'),
			api.get<Reservation[]>('/api/reservations')
		])
		.then(([loansData, reservationsData]) => {
			if (active) {
				setLoans(loansData);
				setReservations(reservationsData);
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

	const isOverdue = (dueAt: string) => {
		return new Date(dueAt) < new Date() && !loans.find(l => l.dueAt === dueAt)?.returnedAt;
	};

	const activeLoans = loans.filter(loan => !loan.returnedAt);
	const overdueLoans = activeLoans.filter(loan => isOverdue(loan.dueAt));
	const activeReservations = reservations.filter(res => res.status === 'active');

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '48px' }}>
				<p style={{ color: '#6b7280' }}>Загрузка ваших книг...</p>
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
					Мои книги
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px' }}>
					Управляйте своими займами и бронированиями
				</p>
			</div>

			{overdueLoans.length > 0 && (
				<div style={{ 
					background: '#fef2f2', 
					border: '1px solid #fecaca', 
					borderRadius: '8px', 
					padding: '16px',
					marginBottom: '24px'
				}}>
					<h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
						⚠️ Просроченные книги ({overdueLoans.length})
					</h3>
					<p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>
						Пожалуйста, верните просроченные книги как можно скорее
					</p>
				</div>
			)}

			<div style={{ display: 'grid', gap: '24px' }}>
				{/* Active Loans */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Текущие займы ({activeLoans.length})
					</h2>
					
					{activeLoans.length === 0 ? (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
							У вас нет активных займов
						</p>
					) : (
						<div style={{ display: 'grid', gap: '12px' }}>
							{activeLoans.map((loan) => (
								<div 
									key={loan.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '16px',
										background: isOverdue(loan.dueAt) ? '#fef2f2' : '#f9fafb',
										border: `1px solid ${isOverdue(loan.dueAt) ? '#fecaca' : '#e5e7eb'}`,
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
											{loan.copy.book.author}
										</p>
										<p style={{ 
											color: isOverdue(loan.dueAt) ? '#dc2626' : '#6b7280',
											margin: 0,
											fontSize: '14px'
										}}>
											Срок возврата: {formatDate(loan.dueAt)}
											{isOverdue(loan.dueAt) && ' (просрочено)'}
										</p>
									</div>
									<div style={{ textAlign: 'right' }}>
										<span style={{
											padding: '4px 8px',
											borderRadius: '4px',
											fontSize: '12px',
											fontWeight: '500',
											background: isOverdue(loan.dueAt) ? '#fef2f2' : '#dcfce7',
											color: isOverdue(loan.dueAt) ? '#dc2626' : '#166534'
										}}>
											{isOverdue(loan.dueAt) ? 'Просрочено' : 'Активно'}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Reservations */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Бронирования ({activeReservations.length})
					</h2>
					
					{activeReservations.length === 0 ? (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
							У вас нет активных бронирований
						</p>
					) : (
						<div style={{ display: 'grid', gap: '12px' }}>
							{activeReservations.map((reservation) => (
								<div 
									key={reservation.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '16px',
										background: '#f0f9ff',
										border: '1px solid #0ea5e9',
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
											{reservation.book.title}
										</h3>
										<p style={{ 
											color: '#6b7280', 
											margin: '0 0 4px 0',
											fontSize: '14px'
										}}>
											{reservation.book.author}
										</p>
										<p style={{ 
											color: '#6b7280',
											margin: 0,
											fontSize: '14px'
										}}>
											Забронировано: {formatDate(reservation.createdAt)}
										</p>
									</div>
									<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
										<Link 
											to={`/book/${reservation.book.id}`}
											style={{
												background: '#2563eb',
												color: '#fff',
												padding: '6px 12px',
												borderRadius: '6px',
												textDecoration: 'none',
												fontSize: '12px',
												fontWeight: '500'
											}}
										>
											Подробнее
										</Link>
										<button style={{
											background: '#f3f4f6',
											color: '#374151',
											padding: '6px 12px',
											border: '1px solid #d1d5db',
											borderRadius: '6px',
											fontSize: '12px',
											cursor: 'pointer'
										}}>
											Отменить
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
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
						<Link 
							to="/"
							style={{
								background: '#2563eb',
								color: '#fff',
								padding: '12px 20px',
								borderRadius: '8px',
								textDecoration: 'none',
								fontSize: '14px',
								fontWeight: '500',
								display: 'inline-flex',
								alignItems: 'center',
								gap: '8px'
							}}
						>
							📚 Поиск книг
						</Link>
						<button style={{
							background: '#f3f4f6',
							color: '#374151',
							padding: '12px 20px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							fontSize: '14px',
							cursor: 'pointer',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '8px'
						}}>
							📋 История займов
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
