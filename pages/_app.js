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
        :root {
          /* Light Theme */
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --text-primary: #333333;
          --text-secondary: #666666;
          --border-color: #ddd;
          --shadow: 0 1px 3px rgba(0,0,0,0.1);
          --shadow-hover: 0 2px 8px rgba(0,0,0,0.1);
          --calendar-bg: #ffffff;
          --header-bg: #ffffff;
          --input-bg: #ffffff;
          --input-border: #f0f0f0;
        }

        [data-theme="dark"] {
          /* Dark Theme */
          --bg-primary: #1a1a1a;
          --bg-secondary: #2d2d2d;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --border-color: #404040;
          --shadow: 0 1px 3px rgba(0,0,0,0.3);
          --shadow-hover: 0 2px 8px rgba(0,0,0,0.4);
          --calendar-bg: #2d2d2d;
          --header-bg: #2d2d2d;
          --input-bg: #404040;
          --input-border: #555555;
        }

        * {
          box-sizing: border-box;
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          padding: 8px;
        }
        
        .fc {
          font-family: inherit;
        }
        
        .fc-header-toolbar {
          margin-bottom: 0.5em !important;
          padding: 8px 12px;
          background-color: var(--header-bg) !important;
          border-radius: 6px;
          box-shadow: var(--shadow);
          flex-wrap: wrap;
        }
        
        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .fc-button {
          background-color: #4cafef !important;
          border-color: #4cafef !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
          min-height: 32px;
        }
        
        .fc-button:hover {
          background-color: #3a9bd1 !important;
          border-color: #3a9bd1 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .fc-toolbar-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin: 0 8px !important;
          color: var(--text-primary) !important;
        }
        
        .fc-event {
          border-radius: 4px !important;
          border: none !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
          cursor: pointer !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
        }
        
        .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }
        
        .fc-daygrid-event {
          margin: 1px !important;
          border-radius: 3px !important;
        }
        
        .fc-col-header-cell {
          padding: 6px 2px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          background-color: var(--header-bg) !important;
          color: var(--text-primary) !important;
        }
        
        .fc-col-header-cell:hover {
          background-color: rgba(74, 175, 239, 0.1) !important;
        }
        
        .fc-daygrid-day-number {
          padding: 4px !important;
          font-size: 13px !important;
          color: var(--text-primary) !important;
        }
        
        .fc-timegrid-slot-label {
          font-size: 10px !important;
          padding: 2px 4px !important;
          color: var(--text-secondary) !important;
        }
        
        .fc-timegrid-event {
          border-radius: 3px !important;
          margin: 1px !important;
        }

        /* Calendar Day Background */
        .fc-daygrid-day,
        .fc-timegrid-col {
          background-color: var(--calendar-bg) !important;
        }

        .fc-scrollgrid {
          background-color: var(--calendar-bg) !important;
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: var(--border-color) !important;
        }

        .fc-timegrid-divider {
          background-color: var(--border-color) !important;
        }

        .fc-now-indicator-line {
          border-color: #4cafef !important;
        }
        
        /* Mobile-spezifische Anpassungen */
        @media (max-width: 768px) {
          .fc-header-toolbar {
            padding: 6px 8px !important;
          }
          
          .fc-button {
            font-size: 11px !important;
            padding: 5px 8px !important;
            min-height: 28px;
          }
          
          .fc-toolbar-title {
            font-size: 14px !important;
            margin: 0 4px !important;
          }
          
          .fc-event {
            font-size: 10px !important;
            padding: 1px 3px !important;
          }
          
          .fc-col-header-cell {
            padding: 4px 1px !important;
            font-size: 10px !important;
            cursor: pointer !important;
          }
          
          .fc-col-header-cell:hover {
            background-color: rgba(74, 175, 239, 0.1) !important;
          }
          
          .fc-daygrid-day-number {
            font-size: 12px !important;
            padding: 2px !important;
          }
          
          .fc-timegrid-slot-label {
            font-size: 9px !important;
            padding: 1px 2px !important;
          }
        }
      `}</style>
      
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
