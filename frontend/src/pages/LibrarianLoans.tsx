import { useEffect, useState } from 'react';
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
	copy: BookCopy;
}

export default function LibrarianLoansPage() {
	const [loans, setLoans] = useState<Loan[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showIssueForm, setShowIssueForm] = useState(false);
	const [issueForm, setIssueForm] = useState({
		userId: '',
		copyId: '',
		dueAt: ''
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const [loansData, usersData, booksData] = await Promise.all([
				api.get<Loan[]>('/api/loans'),
				api.get<User[]>('/api/users'),
				api.get<Book[]>('/api/books')
			]);
			setLoans(loansData);
			setUsers(usersData);
			setBooks(booksData);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Ошибка загрузки');
		} finally {
			setLoading(false);
		}
	};

	const handleIssueLoan = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await api.post('/api/loans/issue', {
				userId: parseInt(issueForm.userId),
				copyId: parseInt(issueForm.copyId),
				dueAt: issueForm.dueAt
			});
			setIssueForm({ userId: '', copyId: '', dueAt: '' });
			setShowIssueForm(false);
			loadData();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Ошибка выдачи книги');
		}
	};

	const handleReturnLoan = async (loanId: number) => {
		if (!confirm('Подтвердить возврат книги?')) return;
		
		try {
			await api.post('/api/loans/return', { loanId });
			loadData();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Ошибка возврата книги');
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString('ru-RU');
	};

	const activeLoans = loans.filter(loan => !loan.returnedAt);
	const overdueLoans = activeLoans.filter(loan => new Date(loan.dueAt) < new Date());
	const returnedLoans = loans.filter(loan => loan.returnedAt);

	// Get all copies for issue form
	const allCopies = books.flatMap(book => 
		book.copies?.map(copy => ({ ...copy, book })) || []
	).filter(copy => copy.status === 'available');

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
					Управление займами
				</h1>
				<p style={{ color: '#6b7280', fontSize: '16px' }}>
					Выдача и возврат книг
				</p>
			</div>

			{/* Issue Loan Button */}
			<div style={{ marginBottom: '24px' }}>
				<button
					onClick={() => setShowIssueForm(!showIssueForm)}
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
					{showIssueForm ? 'Отменить' : '+ Выдать книгу'}
				</button>
			</div>

			{/* Issue Loan Form */}
			{showIssueForm && (
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					marginBottom: '24px'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Выдать книгу
					</h2>
					<form onSubmit={handleIssueLoan} style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
								Пользователь *
							</label>
							<select
								value={issueForm.userId}
								onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
								required
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
							>
								<option value="">Выберите пользователя</option>
								{users.map(user => (
									<option key={user.id} value={user.id}>
										{user.name} ({user.email})
									</option>
								))}
							</select>
						</div>
						<div>
							<label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
								Экземпляр *
							</label>
							<select
								value={issueForm.copyId}
								onChange={(e) => setIssueForm({ ...issueForm, copyId: e.target.value })}
								required
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
							>
								<option value="">Выберите экземпляр</option>
								{allCopies.map(copy => (
									<option key={copy.id} value={copy.id}>
										{copy.book.title} - {copy.book.author} (Экземпляр #{copy.id})
									</option>
								))}
							</select>
						</div>
						<div>
							<label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
								Срок возврата *
							</label>
							<input
								type="date"
								value={issueForm.dueAt}
								onChange={(e) => setIssueForm({ ...issueForm, dueAt: e.target.value })}
								required
								min={new Date().toISOString().split('T')[0]}
								style={{
									width: '100%',
									padding: '12px 16px',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '16px',
									boxSizing: 'border-box'
								}}
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
								Выдать книгу
							</button>
							<button
								type="button"
								onClick={() => setShowIssueForm(false)}
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
				{/* Active Loans */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Активные займы ({activeLoans.length})
					</h2>
					
					{activeLoans.length === 0 ? (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
							Нет активных займов
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
											{loan.copy.book.author}
										</p>
										<p style={{ 
											color: '#6b7280', 
											margin: '0 0 4px 0',
											fontSize: '14px'
										}}>
											Читатель: {loan.user.name} ({loan.user.email})
										</p>
										<p style={{ 
											color: new Date(loan.dueAt) < new Date() ? '#dc2626' : '#6b7280',
											margin: 0,
											fontSize: '14px'
										}}>
											Срок возврата: {formatDate(loan.dueAt)}
											{new Date(loan.dueAt) < new Date() && ' (просрочено)'}
										</p>
										<p style={{ 
											color: '#6b7280',
											margin: '4px 0 0 0',
											fontSize: '12px'
										}}>
											Выдано: {formatDateTime(loan.issuedAt)}
										</p>
									</div>
									<div style={{ display: 'flex', gap: '8px' }}>
										<button
											onClick={() => handleReturnLoan(loan.id)}
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
											Вернуть
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Returned Loans */}
				<div style={{ 
					background: '#fff', 
					borderRadius: '12px', 
					padding: '24px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
				}}>
					<h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
						Возвращенные книги ({returnedLoans.length})
					</h2>
					
					{returnedLoans.length === 0 ? (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>
							Нет возвращенных книг
						</p>
					) : (
						<div style={{ display: 'grid', gap: '12px' }}>
							{returnedLoans.slice(0, 10).map((loan) => (
								<div 
									key={loan.id}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '16px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
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
											color: '#6b7280', 
											margin: '0 0 4px 0',
											fontSize: '14px'
										}}>
											Читатель: {loan.user.name}
										</p>
										<p style={{ 
											color: '#6b7280',
											margin: 0,
											fontSize: '12px'
										}}>
											Возвращено: {formatDateTime(loan.returnedAt!)}
										</p>
									</div>
									<span style={{
										padding: '4px 8px',
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: '500',
										background: '#dcfce7',
										color: '#166534'
									}}>
										Возвращено
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
