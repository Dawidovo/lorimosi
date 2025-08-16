// pages/_app.js
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Gemeinsamer Kalender</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
        
        /* FullCalendar Anpassungen */
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
        
        .fc-button:disabled {
          background-color: #ccc !important;
          border-color: #ccc !important;
          transform: none;
        }
        
        .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #2196F3 !important;
          border-color: #2196F3 !important;
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
        
        .fc-event-title {
          font-weight: 600 !important;
          color: white !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .fc-daygrid-event {
          margin: 2px 3px !important;
          border-radius: 6px !important;
        }
        
        .fc-day-today {
          background-color: rgba(74, 175, 239, 0.08) !important;
        }
        
        .fc-day-sat,
        .fc-day-sun {
          background-color: rgba(0,0,0,0.02) !important;
        }
        
        .fc-highlight {
          background-color: rgba(74, 175, 239, 0.3) !important;
        }
        
        .fc-timegrid-now-indicator-line {
          border-color: #ef5350 !important;
          border-width: 2px !important;
        }
        
        .fc-timegrid-slot-label {
          font-size: 12px !important;
          color: #666 !important;
        }
        
        .fc-col-header-cell {
          background-color: #fafafa;
        }
        
        /* Mobile Anpassungen */
        @media (max-width: 768px) {
          .fc-header-toolbar {
            flex-direction: column !important;
            gap: 12px;
            padding: 12px;
          }
          
          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .fc-button {
            font-size: 12px !important;
            padding: 6px 10px !important;
          }
          
          .fc-event {
            font-size: 11px !important;
            padding: 2px 4px !important;
          }
          
          .fc-toolbar-title {
            font-size: 1.3em !important;
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          .fc-toolbar-title {
            font-size: 1.1em !important;
          }
          
          .fc-button {
            font-size: 11px !important;
            padding: 5px 8px !important;
          }
        }
      `}</style>
      
      <Component {...pageProps} />
    </>
  );
}
