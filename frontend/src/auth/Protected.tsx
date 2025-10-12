import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../types';

interface ProtectedProps {
	roles?: Role[];
	children?: React.ReactNode;
}

export function Protected({ roles, children }: ProtectedProps) {
	const { user } = useAuth();
	if (!user) return <Navigate to="/login" replace />;
	if (roles && roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;
	return children ? <>{children}</> : <Outlet />;
}


