// pages/_app.tsx
import '@fullcalendar/core/index.css';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';
import '../styles/globals.css'; // falls vorhanden

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
