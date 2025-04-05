import "@/styles/globals.css";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';

function MyApp({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);

  return (
    <Component {...pageProps} />
  );
}

export default MyApp;
