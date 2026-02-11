import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, token, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    token,
    isAuthenticated,
    loading,
    isVendor: user?.role === 'vendor',
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  };
};

export default useAuth;
