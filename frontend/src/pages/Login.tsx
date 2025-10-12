import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const { addToast } = useToast();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(email, password);
			addToast('Успешный вход в систему!', 'success');
			navigate('/');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
			setError(errorMessage);
			addToast(errorMessage, 'error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 300, margin: '64px auto' }}>
			<h2>Вход</h2>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<label>
				<input 
					placeholder='Email' 
					value={email} 
					onChange={(e) => setEmail(e.target.value)} 
					type="email" 
					required 
					style={{
					padding: '12px 16px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					fontSize: '16px',
					width: '100%',
					boxSizing: 'border-box'
					}}
				/>
				</label>
				<label>
				<input 
					placeholder='Пароль' 
					value={password} 
					onChange={(e) => setPassword(e.target.value)} 
					type="password" 
					required 
					style={{
					padding: '12px 16px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					fontSize: '16px',
					width: '100%',
					boxSizing: 'border-box'
					}}
				/>
				</label>
				<button type="submit" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
				{error && <p style={{ color: 'red' }}>{error}</p>}
			</form>
			<p>Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link></p>
		</div>
	);
}


