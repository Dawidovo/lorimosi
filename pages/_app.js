// pages/_app.js - Vollständiger Dark Mode Fix
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Our Future Plans - Gemeinsamer Kalender</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Gemeinsamer Kalender für Paare - Plane eure Zukunft zusammen" />
        
        {/* Manifest für PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color für Mobile Browser */}
        <meta name="theme-color" content="#4cafef" />
        <meta name="msapplication-TileColor" content="#4cafef" />
        
        {/* Favicon Links */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
        
        {/* FullCalendar CSS */}
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
          background-color: #1a1a1a !important;
          padding: 8px;
          color: #ffffff;
        }
        
        /* Basis Calendar Styling */
        .fc {
          font-family: inherit;
          background-color: #2a2a2a !important;
        }
        
        /* Alle FullCalendar Container */
        .fc,
        .fc *,
        .fc-theme-standard,
        .fc-view,
        .fc-view-harness,
        .fc-view-harness-active,
        .fc-daygrid,
        .fc-timegrid,
        .fc-scrollgrid,
        .fc-scrollgrid-sync-table,
        .fc-scrollgrid-sync-inner,
        .fc-scroller,
        .fc-scroller-liquid,
        .fc-scroller-liquid-absolute {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
        }
        
        /* Header Toolbar */
        .fc-header-toolbar {
          margin-bottom: 0.5em !important;
          padding: 8px 12px !important;
          background-color: #1e1e1e !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
          flex-wrap: wrap !important;
        }
        
        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        /* Buttons */
        .fc-button-primary {
          background-color: #4cafef !important;
          border-color: #4cafef !important;
          color: white !important;
        }
        
        .fc-button {
          background-color: #4cafef !important;
          border-color: #4cafef !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
          min-height: 32px !important;
          color: white !important;
        }
        
        .fc-button:hover,
        .fc-button:focus {
          background-color: #3a9bd1 !important;
          border-color: #3a9bd1 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }
        
        .fc-button-active {
          background-color: #3a9bd1 !important;
          border-color: #3a9bd1 !important;
        }
        
        /* Title */
        .fc-toolbar-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          margin: 0 8px !important;
          color: #ffffff !important;
        }
        
        /* Table Elements */
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #444444 !important;
          background-color: #2a2a2a !important;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border-color: #444444 !important;
          background-color: #2a2a2a !important;
        }
        
        /* Column Headers */
        .fc-col-header {
          background-color: #1e1e1e !important;
        }
        
        .fc-col-header-cell {
          padding: 6px 2px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          background-color: #1e1e1e !important;
          border-color: #444444 !important;
          color: #cccccc !important;
        }
        
        .fc-col-header-cell:hover {
          background-color: rgba(74, 175, 239, 0.2) !important;
        }
        
        .fc-col-header-cell-cushion {
          color: #cccccc !important;
        }
        
        /* Day Cells */
        .fc-daygrid-day {
          background-color: #2a2a2a !important;
          border-color: #444444 !important;
        }
        
        .fc-day-today {
          background-color: rgba(74, 175, 239, 0.15) !important;
        }
        
        .fc-daygrid-day-number {
          padding: 4px !important;
          font-size: 13px !important;
          color: #cccccc !important;
        }
        
        .fc-daygrid-day-top {
          background-color: #2a2a2a !important;
        }
        
        /* Time Grid */
        .fc-timegrid-body {
          background-color: #2a2a2a !important;
        }
        
        .fc-timegrid-axis {
          background-color: #2a2a2a !important;
          border-color: #444444 !important;
        }
        
        .fc-timegrid-axis-cushion {
          color: #999999 !important;
        }
        
        .fc-timegrid-slot {
          background-color: #2a2a2a !important;
          border-color: #444444 !important;
        }
        
        .fc-timegrid-slot-minor {
          border-color: #333333 !important;
        }
        
        .fc-timegrid-slot-label {
          font-size: 10px !important;
          padding: 2px 4px !important;
          color: #999999 !important;
          background-color: #2a2a2a !important;
          border-color: #444444 !important;
        }
        
        .fc-timegrid-slot-label-cushion {
          color: #999999 !important;
        }
        
        /* All Day Section */
        .fc-timegrid-divider {
          background-color: #444444 !important;
          border-color: #444444 !important;
        }
        
        .fc-timegrid-axis-frame {
          background-color: #2a2a2a !important;
        }
        
        /* Events */
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
        
        .fc-timegrid-event {
          border-radius: 3px !important;
          margin: 1px !important;
        }
        
        /* Now Indicator */
        .fc-timegrid-now-indicator-line {
          border-color: #ff6b6b !important;
        }
        
        .fc-timegrid-now-indicator-arrow {
          border-color: #ff6b6b !important;
        }
        
        /* Scrollbars */
        .fc-scroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .fc-scroller::-webkit-scrollbar-track {
          background: #1e1e1e !important;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb {
          background: #444444 !important;
          border-radius: 4px;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #555555 !important;
        }
        
        /* More Time Link */
        .fc-daygrid-more-link {
          color: #4cafef !important;
          background-color: #333333 !important;
          border-radius: 3px !important;
          padding: 2px 4px !important;
        }
        
        /* Popover */
        .fc-popover {
          background-color: #2a2a2a !important;
          border-color: #444444 !important;
          color: #ffffff !important;
        }
        
        .fc-popover-header {
          background-color: #1e1e1e !important;
          border-color: #444444 !important;
          color: #ffffff !important;
        }
        
        .fc-popover-body {
          background-color: #2a2a2a !important;
        }
        
        /* Selection */
        .fc-highlight {
          background-color: rgba(74, 175, 239, 0.3) !important;
        }
        
        /* Media Queries */
        @media (max-width: 768px) {
          .fc-header-toolbar {
            padding: 6px 8px !important;
          }
          
          .fc-button {
            font-size: 11px !important;
            padding: 5px 8px !important;
            min-height: 28px !important;
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
