import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import '../styles/global.scss';
import { Header } from '../components/Header';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SessionProvider>
        <Header />
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp
