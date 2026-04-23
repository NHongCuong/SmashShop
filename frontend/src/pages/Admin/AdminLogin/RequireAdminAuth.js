import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RequireAdminAuth = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.adminAuth.isAuthenticated);
  const user = useSelector((state) => state.adminAuth.user);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default RequireAdminAuth;
