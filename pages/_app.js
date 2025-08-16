// pages/_app.js - Updated with dark mode fixes
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
          background-color: #f8f9fa;
          padding: 8px;
        }
        
        .fc {
          font-family: inherit;
          background-color: #2a2a2a !important;
        }
        
        /* Dark mode calendar container */
        .fc-theme-standard {
          background-color: #2a2a2a !important;
        }
        
        /* Header toolbar */
        .fc-header-toolbar {
          margin-bottom: 0.5em !important;
          padding: 8px 12px;
          background-color: #1e1e1e !important;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
          color: white !important;
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
          color: white !important;
        }
        
        /* Calendar view backgrounds */
        .fc-view {
          background-color: #2a2a2a !important;
        }
        
        .fc-view-harness {
          background-color: #2a2a2a !important;
        }
        
        /* Day grid specific */
        .fc-daygrid {
          background-color: #2a2a2a !important;
        }
        
        .fc-scrollgrid {
          background-color: #2a2a2a !important;
        }
        
        .fc-scrollgrid-sync-table {
          background-color: #2a2a2a !important;
        }
        
        /* Time grid specific fixes */
        .fc-timegrid {
          background-color: #2a2a2a !important;
        }
        
        .fc-timegrid-body {
          background-color: #2a2a2a !important;
        }
        
        .fc-timegrid-axis {
          background-color: #2a2a2a !important;
          border-color: #444 !important;
        }
        
        .fc-timegrid-slot {
          background-color: #2a2a2a !important;
          border-color: #444 !important;
        }
        
        .fc-timegrid-slot-minor {
          border-color: #333 !important;
        }
        
        /* All day row */
        .fc-timegrid-divider {
          background-color: #444 !important;
          border-color: #444 !important;
        }
        
        .fc-timegrid-axis-cushion {
          color: #ccc !important;
        }
        
        /* Column headers */
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
          border-color: #444 !important;
          color: #ccc !important;
        }
        
        .fc-col-header-cell:hover {
          background-color: rgba(74, 175, 239, 0.2) !important;
        }
        
        /* Day cells */
        .fc-daygrid-day {
          background-color: #2a2a2a !important;
          border-color: #444 !important;
        }
        
        .fc-day-today {
          background-color: rgba(74, 175, 239, 0.1) !important;
        }
        
        .fc-daygrid-day-number {
          padding: 4px !important;
          font-size: 13px !important;
          color: #ccc !important;
        }
        
        /* Time slots */
        .fc-timegrid-slot-label {
          font-size: 10px !important;
          padding: 2px 4px !important;
          color: #999 !important;
          background-color: #2a2a2a !important;
          border-color: #444 !important;
        }
        
        .fc-timegrid-slot-label-cushion {
          color: #999 !important;
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
        
        /* Borders and dividers */
        .fc-theme-standard td, 
        .fc-theme-standard th {
          border-color: #444 !important;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border-color: #444 !important;
        }
        
        /* Now indicator */
        .fc-timegrid-now-indicator-line {
          border-color: #ff6b6b !important;
        }
        
        .fc-timegrid-now-indicator-arrow {
          border-color: #ff6b6b !important;
        }
        
        /* Scrollbar styling for dark mode */
        .fc-scroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .fc-scroller::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #555;
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
            background-color: rgba(74, 175, 239, 0.2) !important;
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
