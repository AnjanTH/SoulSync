import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup'];

export function withAuth(WrappedComponent) {
  return function WithAuthComponent(props) {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
      // Check if the current route is public
      const isPublicRoute = publicRoutes.includes(router.pathname);

      // If it's not a public route and there's no user after loading
      if (!loading && !user && !isPublicRoute) {
        // Store the attempted URL for redirect after login
        sessionStorage.setItem('redirectAfterLogin', router.pathname);
        router.push('/login');
      }

      // If user is logged in and trying to access login/signup pages
      if (!loading && user && (router.pathname === '/login' || router.pathname === '/signup')) {
        router.push('/dashboard');
      }
    }, [user, loading, router.pathname]);

    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
        </div>
      );
    }

    // For public routes, render the component regardless of auth state
    if (publicRoutes.includes(router.pathname)) {
      return <WrappedComponent {...props} />;
    }

    // For protected routes, only render if user is authenticated
    if (!user) {
      return null;
    }

    // Render the protected component
    return <WrappedComponent {...props} user={user} />;
  };
}