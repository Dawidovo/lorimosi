// pages/_app.js
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Our Future Plans - Gemeinsamer Kalender</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Gemeinsamer Kalender für Paare - Plane eure Zukunft zusammen" />
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.14/main.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.14/main.min.css"
          rel="stylesheet"
        />
      </Head>
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
        }
        
        .fc {
          font-family: inherit;
        }
        
        .fc-header-toolbar {
          margin-bottom: 1em !important;
          padding: 15px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .fc-button {
          background-color: #4cafef !important;
          border-color: #4cafef !important;
          font-size: 14px !important;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
        }
        
        .fc-button:hover {
          background-color: #3a9bd1 !important;
          border-color: #3a9bd1 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .fc-event {
          border-radius: 6px !important;
          border: none !important;
          padding: 3px 6px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          cursor: pointer !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
        }
        
        .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
        }
      `}</style>
      
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
