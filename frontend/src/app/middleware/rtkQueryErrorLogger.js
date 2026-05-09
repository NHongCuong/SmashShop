import { isRejectedWithValue } from '@reduxjs/toolkit';
import { logout } from '../store/authSlice';
import { adminLogout } from '../store/adminAuthSlice';

/**
 * Middleware to catch 401 Unauthorized errors from RTK Query and logout the user.
 */
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    // console.warn('We got a rejected action!', action);
    
    if (action.payload.status === 401) {
      const isAdminPage = window.location.pathname.startsWith('/admin');
      
      if (isAdminPage) {
        // console.log('Admin session expired. Logging out...');
        api.dispatch(adminLogout());
      } else {
        // console.log('User session expired. Logging out...');
        api.dispatch(logout());
      }
    }
  }

  return next(action);
};
