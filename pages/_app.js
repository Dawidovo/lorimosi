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
        
        {/* Meta-Tags zum Verhindern der Indexierung */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        
        {/* Zusätzliche Sicherheitsmaßnahmen */}
        <meta name="referrer" content="no-referrer" />
        <meta property="og:title" content="Private Calendar" />
        <meta property="og:description" content="Private couple calendar application" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Private Calendar" />
        <meta name="twitter:description" content="Private couple calendar application" />
        
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
        /* CSS-Variablen für Light Mode (Standard) */
        :root {
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --text-primary: #333333;
          --text-secondary: #666666;
          --border-color: #dddddd;
          --input-bg: #ffffff;
          --input-border: #f0f0f0;
          --shadow: 0 1px 3px rgba(0,0,0,0.1);
          --shadow-hover: 0 2px 8px rgba(0,0,0,0.1);
          --calendar-bg: #ffffff;
        }

        /* CSS-Variablen für Dark Mode */
        [data-theme="dark"] {
          --bg-primary: #1a1a1a;
          --bg-secondary: #2d2d2d;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --border-color: #404040;
          --input-bg: #3a3a3a;
          --input-border: #4a4a4a;
          --shadow: 0 1px 3px rgba(0,0,0,0.3);
          --shadow-hover: 0 2px 8px rgba(0,0,0,0.2);
          --calendar-bg: #2d2d2d;
        }

        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          padding: 8px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        .fc {
          font-family: inherit;
        }
        
        .fc-header-toolbar {
          margin-bottom: 0.5em !important;
          padding: 8px 12px;
          background-color: var(--bg-secondary) !important;
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

        /* Calendar Grid und Background */
        .fc-view-harness {
          background-color: var(--calendar-bg) !important;
        }

        .fc-daygrid-body,
        .fc-timegrid-body,
        .fc-scrollgrid,
        .fc-theme-standard td,
        .fc-theme-standard th {
          background-color: var(--calendar-bg) !important;
          border-color: var(--border-color) !important;
        }

        .fc-col-header-cell {
          padding: 6px 2px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
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

        .fc-timegrid-axis {
          background-color: var(--bg-secondary) !important;
        }

        /* Event Styling - Intelligente Textfarben basierend auf Hintergrund */
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
          border: 1px solid rgba(0,0,0,0.1) !important;
        }
        
        .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4) !important;
          filter: brightness(1.1) !important;
        }
        
        /* Event Text - Standard dunkle Schrift für besseren Kontrast */
        .fc-event .fc-event-title,
        .fc-event .fc-event-time,
        .fc-event-title-container,
        .fc-event-main {
          color: rgba(0,0,0,0.9) !important;
          text-shadow: none !important;
          font-weight: 600 !important;
        }
        
        /* Daygrid Events - dunkle Schrift auf farbigem Hintergrund */
        .fc-daygrid-event {
          margin: 1px !important;
          border-radius: 3px !important;
          min-height: 20px !important;
        }
        
        .fc-daygrid-event .fc-event-title {
          color: rgba(0,0,0,0.9) !important;
          font-weight: 600 !important;
          text-shadow: none !important;
          font-size: 11px !important;
        }
        
        /* Timegrid Events - weiße Schrift für kleinere Events */
        .fc-timegrid-event {
          border-radius: 3px !important;
          margin: 1px !important;
          min-width: 100% !important;
          padding: 1px 3px !important;
        }
        
        .fc-timegrid-event .fc-event-title {
          color: white !important;
          font-weight: 700 !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        
        .fc-timegrid-event .fc-event-time {
          color: white !important;
          font-weight: 600 !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
          font-size: 9px !important;
          opacity: 0.9 !important;
        }

        /* Spezielle Verbesserungen für sehr schmale Events */
        .fc-timegrid-event[style*="width"] {
          min-width: 80px !important;
        }

        /* Event Content Container für bessere Kontrolle */
        .fc-event-main {
          padding: 1px 2px !important;
        }

        .fc-event-main-frame {
          padding: 0 !important;
        }
        
        /* Spezifische Farb-Überschreibungen für verschiedene Event-Typen */
        .fc-event[style*="rgb(255, 79, 0)"],
        .fc-event[style*="#ff4f00"] {
          background-color: #ff4f00 !important;
          border-color: #ff4f00 !important;
        }
        
        .fc-event[style*="rgb(0, 191, 255)"],
        .fc-event[style*="#00bfff"] {
          background-color: #00bfff !important;
          border-color: #00bfff !important;
        }
        
        .fc-event[style*="rgb(139, 92, 246)"],
        .fc-event[style*="#8b5cf6"] {
          background-color: #8b5cf6 !important;
          border-color: #8b5cf6 !important;
        }

        /* Today Highlighting */
        .fc-day-today {
          background-color: rgba(74, 175, 239, 0.1) !important;
        }

        /* Dark Mode spezifische Verbesserungen */
        [data-theme="dark"] .fc-event {
          /* Erhöhte Sichtbarkeit im Dark Mode */
          box-shadow: 0 2px 4px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        [data-theme="dark"] .fc-event:hover {
          box-shadow: 0 3px 6px rgba(0,0,0,0.6) !important;
          filter: brightness(1.2) !important;
        }
        
        /* Dark Mode: Helle Schrift für Daygrid Events */
        [data-theme="dark"] .fc-daygrid-event .fc-event-title,
        [data-theme="dark"] .fc-daygrid-event .fc-event-time {
          color: white !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.7) !important;
        }

        /* Light Mode: Dunkle Schrift für besseren Kontrast auf farbigen Events */
        :root .fc-daygrid-event .fc-event-title,
        :root .fc-daygrid-event .fc-event-time {
          color: rgba(0,0,0,0.9) !important;
          text-shadow: 0 1px 2px rgba(255,255,255,0.3) !important;
        }

        /* Timegrid Events behalten weiße Schrift in beiden Modi */
        .fc-timegrid-event .fc-event-title,
        .fc-timegrid-event .fc-event-time {
          color: white !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
        }

        /* Now Indicator */
        .fc-timegrid-now-indicator-line {
          border-color: #ff4f00 !important;
        }

        .fc-timegrid-now-indicator-arrow {
          border-left-color: #ff4f00 !important;
          border-right-color: #ff4f00 !important;
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
            font-size: 9px !important;
            padding: 1px 2px !important;
          }

          .fc-daygrid-event .fc-event-title {
            font-size: 9px !important;
            font-weight: 600 !important;
          }

          .fc-timegrid-event .fc-event-title {
            font-size: 8px !important;
            font-weight: 700 !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.9) !important;
            color: white !important;
          }

          .fc-timegrid-event .fc-event-time {
            font-size: 7px !important;
            font-weight: 600 !important;
            color: white !important;
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
