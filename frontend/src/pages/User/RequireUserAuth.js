// RequireUserAuth.js
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const RequireUserAuth = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!isAuthenticated || user?.role !== 'user') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireUserAuth;
