// pages/_app.js
import "@fullcalendar/core/index.css";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";
import "../styles/globals.css"; // falls vorhanden – sonst Zeile löschen

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
