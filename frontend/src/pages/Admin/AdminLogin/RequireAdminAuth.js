import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RequireAdminAuth = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default RequireAdminAuth;
