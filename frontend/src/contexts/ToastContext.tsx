import { createContext, useCallback, useContext, useState } from 'react';

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

interface ToastContextValue {
	toasts: Toast[];
	addToast: (message: string, type: Toast['type'], duration?: number) => void;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: Toast['type'], duration = 5000) => {
		const id = Math.random().toString(36).substr(2, 9);
		const toast: Toast = { id, message, type, duration };
		
		setToasts(prev => [...prev, toast]);
		
		if (duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, duration);
		}
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id));
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
	}, []);

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error('useToast must be used within ToastProvider');
	return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
	return (
		<div style={{
			position: 'fixed',
			top: '20px',
			right: '20px',
			zIndex: 9999,
			display: 'flex',
			flexDirection: 'column',
			gap: '8px'
		}}>
			{toasts.map(toast => (
				<ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
			))}
		</div>
	);
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
	const getToastStyles = (type: Toast['type']) => {
		const baseStyles = {
			padding: '12px 16px',
			borderRadius: '8px',
			boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			minWidth: '300px',
			maxWidth: '500px',
			animation: 'slideIn 0.3s ease-out'
		};

		switch (type) {
			case 'success':
				return {
					...baseStyles,
					background: '#dcfce7',
					border: '1px solid #bbf7d0',
					color: '#166534'
				};
			case 'error':
				return {
					...baseStyles,
					background: '#fef2f2',
					border: '1px solid #fecaca',
					color: '#dc2626'
				};
			case 'warning':
				return {
					...baseStyles,
					background: '#fef3c7',
					border: '1px solid #fde68a',
					color: '#92400e'
				};
			case 'info':
			default:
				return {
					...baseStyles,
					background: '#dbeafe',
					border: '1px solid #93c5fd',
					color: '#1e40af'
				};
		}
	};

	const getIcon = (type: Toast['type']) => {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			case 'info':
			default:
				return 'ℹ️';
		}
	};

	return (
		<div style={getToastStyles(toast.type)}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ fontSize: '16px' }}>{getIcon(toast.type)}</span>
				<span style={{ fontSize: '14px', fontWeight: '500' }}>{toast.message}</span>
			</div>
			<button
				onClick={() => onRemove(toast.id)}
				style={{
					background: 'none',
					border: 'none',
					color: 'inherit',
					cursor: 'pointer',
					padding: '4px',
					marginLeft: '8px',
					fontSize: '16px',
					opacity: 0.7
				}}
				onMouseOver={(e) => {
					e.currentTarget.style.opacity = '1';
				}}
				onMouseOut={(e) => {
					e.currentTarget.style.opacity = '0.7';
				}}
			>
				×
			</button>
		</div>
	);
}
