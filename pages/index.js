// pages/index.js - Verbesserte Version
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Farben für die beiden Nutzer
const userColors = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': '#ef5350', // Rot
  '88a63a7f-b350-4704-9b1e-44445a6f33bb': '#4cafef'  // Blau
};

// Namen für die Nutzer (optional, für interne Referenz)
const userNames = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': 'Du',
  '88a63a7f-b350-4704-9b1e-44445a6f33bb': 'Freundin'
};

export default function Home() {
  const calRef = useRef(null);
  const hostRef = useRef(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  // Session laden
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Simple Login-Prompt
        const email = prompt('E-Mail:');
        const password = prompt('Passwort:');
        if (!email || !password) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { 
          alert('Login fehlgeschlagen: ' + error.message); 
          return; 
        }
      }
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
    })();
  }, []);

  // Events laden
  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('starts_at');
      
      if (error) {
        console.error('Fehler beim Laden der Events:', error);
        return;
      }
      
      setEvents(data || []);
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  }

  // Hilfsfunktion: Prüfung ob Ganztag-Event
  function isAllDayEvent(startStr, endStr) {
    if (!startStr || !endStr) return false;
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      // Ganztag wenn beide Zeiten Mitternacht sind und mindestens 24h Unterschied
      return start.getHours() === 0 && start.getMinutes() === 0 && 
             end.getHours() === 0 && end.getMinutes() === 0 &&
             (end - start) >= 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  // Kalender initialisieren und Events laden
  useEffect(() => {
    if (!user) return;

    loadEvents();

    if (hostRef.current && !calRef.current) {
      const calendar = new Calendar(hostRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        selectable: true,
        selectMirror: true,
        editable: true,
        eventResizableFromStart: true,
        longPressDelay: 250,
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        nowIndicator: true,
        height: 'auto',
        locale: 'de',

        // Events bereitstellen
        events: events.map(e => ({
          id: e.id,
          title: e.title, // Nur Titel, keine E-Mail-Adresse
          start: e.starts_at,
          end: e.ends_at,
          allDay: e.all_day || isAllDayEvent(e.starts_at, e.ends_at),
          backgroundColor: userColors[e.owner] || '#9E9E9E',
          extendedProps: {
            location: e.location,
            description: e.description || '',
            owner: e.owner,
            owner_name: e.owner_name
          }
        })),

        // Neuen Termin erstellen
        select: async (info) => {
          const title = prompt('Titel des Termins:');
          if (!title) {
            info.view.calendar.unselect();
            return;
          }

          let startsAt = info.startStr;
          let endsAt = info.endStr;
          let isAllDay = info.allDay;

          // Wenn nicht Ganztag, Uhrzeiten abfragen
          if (!info.allDay) {
            const useSpecificTime = confirm('Möchten Sie eine spezielle Uhrzeit festlegen?\n\nOK = Uhrzeit eingeben\nAbbrechen = Ganztägiger Termin');
            
            if (useSpecificTime) {
              const startTime = prompt('Startzeit (Format: HH:MM, z.B. 14:30):', '09:00');
              if (startTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
                const endTime = prompt('Endzeit (Format: HH:MM, z.B. 16:00):', '10:00');
                if (endTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
                  // Datum vom info.start nehmen und Zeit hinzufügen
                  const startDate = new Date(info.start);
                  const endDate = new Date(info.end || info.start);
                  
                  const [startHour, startMin] = startTime.split(':');
                  const [endHour, endMin] = endTime.split(':');
                  
                  startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                  endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                  
                  // Wenn Endzeit vor Startzeit, dann nächster Tag
                  if (endDate <= startDate) {
                    endDate.setDate(endDate.getDate() + 1);
                  }
                  
                  startsAt = startDate.toISOString();
                  endsAt = endDate.toISOString();
                  isAllDay = false;
                } else {
                  alert('Ungültige Endzeit. Termin wird als ganztägig angelegt.');
                  isAllDay = true;
                }
              } else {
                alert('Ungültige Startzeit. Termin wird als ganztägig angelegt.');
                isAllDay = true;
              }
            } else {
              isAllDay = true;
            }
          }

          // Optionale Zusatzinfos
          const location = prompt('Ort (optional):') || null;
          const description = prompt('Beschreibung (optional):') || null;

          try {
            const { data, error } = await supabase.from('events').insert({
              owner: user.id,
              owner_name: user.email.split('@')[0], // Nur Name vor @
              title,
              location,
              description,
              starts_at: startsAt,
              ends_at: endsAt,
              all_day: isAllDay
            }).select();

            if (error) {
              console.error('Fehler beim Erstellen:', error);
              alert('Fehler beim Erstellen des Termins: ' + error.message);
              return;
            }

            // Event zum Kalender hinzufügen ohne Neuladen
            const newEvent = data[0];
            calendar.addEvent({
              id: newEvent.id,
              title: newEvent.title,
              start: newEvent.starts_at,
              end: newEvent.ends_at,
              allDay: newEvent.all_day,
              backgroundColor: userColors[newEvent.owner] || '#9E9E9E',
              extendedProps: {
                location: newEvent.location,
                description: newEvent.description,
                owner: newEvent.owner,
                owner_name: newEvent.owner_name
              }
            });

          } catch (err) {
            console.error('Unerwarteter Fehler:', err);
            alert('Ein unerwarteter Fehler ist aufgetreten.');
          }

          info.view.calendar.unselect();
        },

        // Event verschieben
        eventDrop: async (info) => {
          try {
            const { error } = await supabase
              .from('events')
              .update({
                starts_at: info.event.start?.toISOString(),
                ends_at: info.event.end?.toISOString(),
                all_day: info.event.allDay
              })
              .eq('id', info.event.id);

            if (error) {
              console.error('Fehler beim Verschieben:', error);
              alert('Fehler beim Verschieben: ' + error.message);
              info.revert();
            }
          } catch (err) {
            console.error('Unerwarteter Fehler:', err);
            info.revert();
          }
        },

        // Event Größe ändern
        eventResize: async (info) => {
          try {
            const { error } = await supabase
              .from('events')
              .update({
                starts_at: info.event.start?.toISOString(),
                ends_at: info.event.end?.toISOString()
              })
              .eq('id', info.event.id);

            if (error) {
              console.error('Fehler beim Ändern der Größe:', error);
              alert('Fehler beim Ändern der Größe: ' + error.message);
              info.revert();
            }
          } catch (err) {
            console.error('Unerwarteter Fehler:', err);
            info.revert();
          }
        },

        // Event anklicken - Details anzeigen und löschen
        eventClick: async (info) => {
          const event = info.event;
          const props = event.extendedProps;
          
          // Details zusammenstellen
          const startTime = event.start ? event.start.toLocaleString('de-DE') : 'Unbekannt';
          const endTime = event.end ? event.end.toLocaleString('de-DE') : 'Unbekannt';
          const ownerName = userNames[props.owner] || props.owner_name || 'Unbekannt';
          
          let details = `📅 ${event.title}\n\n`;
          details += `🕐 Von: ${startTime}\n`;
          details += `🕐 Bis: ${endTime}\n`;
          if (props.location) details += `📍 Ort: ${props.location}\n`;
          if (props.description) details += `📝 Beschreibung: ${props.description}\n`;
          details += `👤 Erstellt von: ${ownerName}\n\n`;
          details += `Möchten Sie diesen Termin löschen?`;

          if (confirm(details)) {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id);

              if (error) {
                console.error('Fehler beim Löschen:', error);
                alert('Fehler beim Löschen: ' + error.message);
                return;
              }

              // Event aus Kalender entfernen
              event.remove();
              
            } catch (err) {
              console.error('Unerwarteter Fehler:', err);
              alert('Ein unerwarteter Fehler ist aufgetreten.');
            }
          }
        }
      });

      calendar.render();
      calRef.current = calendar;
    }
  }, [user]);

  // Events aktualisieren wenn sich die Daten ändern
  useEffect(() => {
    if (calRef.current && events.length >= 0) {
      // Alle Event-Sources entfernen und neu hinzufügen
      calRef.current.removeAllEventSources();
      calRef.current.addEventSource(events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.starts_at,
        end: e.ends_at,
        allDay: e.all_day || isAllDayEvent(e.starts_at, e.ends_at),
        backgroundColor: userColors[e.owner] || '#9E9E9E',
        extendedProps: {
          location: e.location,
          description: e.description || '',
          owner: e.owner,
          owner_name: e.owner_name
        }
      })));
    }
  }, [events]);

  if (!user) {
    return (
      <main style={{ padding: 20, textAlign: 'center' }}>
        <h2>Lade Kalender...</h2>
        <p>Bitte warten Sie einen Moment.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: '10px 0',
        borderBottom: '2px solid #eee'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>💕 Unser gemeinsamer Kalender</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Angemeldet als: {user.email}
          </p>
        </div>
        <button 
          onClick={async () => { 
            if (confirm('Möchten Sie sich wirklich abmelden?')) {
              await supabase.auth.signOut(); 
              location.reload(); 
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>💡 Bedienungshilfe:</h3>
        <ul style={{ margin: 0, fontSize: '14px', color: '#555' }}>
          <li><strong>Neuer Termin:</strong> Klicken und ziehen Sie über den gewünschten Zeitraum</li>
          <li><strong>Termin verschieben:</strong> Termin anklicken und ziehen</li>
          <li><strong>Termin löschen:</strong> Auf den Termin klicken, dann bestätigen</li>
          <li><strong>Farbkodierung:</strong> <span style={{color: userColors['fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc']}}>●</span> Rot = Ein Partner | <span style={{color: userColors['88a63a7f-b350-4704-9b1e-44445a6f33bb']}}>●</span> Blau = Anderer Partner</li>
        </ul>
      </div>

      <div ref={hostRef} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
    </main>
  );
}
      </header>
      <div ref={hostRef} />
    </main>
  );
}
