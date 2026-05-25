import { Navigate } from 'react-router';
import { isAuthenticated, getUserRole } from '../services/authService';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (userRole === 'service_provider') {
      return <Navigate to="/dashboard/provider" replace />;
    } else {
      return <Navigate to="/dashboard/user" replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;
