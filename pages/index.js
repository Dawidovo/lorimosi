import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const userColors = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': '#ff4f00',
  '88a63a7f-b350-4704-9b1e-44445a6f33bb': '#4cafef'
};

const userNames = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': 'Du',
  '88a63a7f-b350-4704-9b1e-44445a6f33bb': 'Freundin'
};

export default function Home() {
  const calRef = useRef(null);
  const hostRef = useRef(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
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

  function goToOptimalWeek() {
    if (calRef.current) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      let targetMonday;
      if (dayOfWeek === 0) {
        targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() + 1);
      } else {
        targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() - (dayOfWeek - 1));
      }
      
      calRef.current.gotoDate(targetMonday);
    }
  }

  function isAllDayEvent(startStr, endStr) {
    if (!startStr || !endStr) return false;
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      return start.getHours() === 0 && start.getMinutes() === 0 && 
             end.getHours() === 0 && end.getMinutes() === 0 &&
             (end - start) >= 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!user) return;

    loadEvents();

    if (hostRef.current && !calRef.current) {
      const calendar = new Calendar(hostRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        firstDay: 1,
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
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

        events: events.map(e => ({
          id: e.id,
          title: e.title,
          start: e.starts_at,
          end: e.ends_at,
          allDay: e.all_day || isAllDayEvent(e.starts_at, e.ends_at),
          backgroundColor: userColors[e.owner] || '#9E9E9E',
          extendedProps: {
            location: e.location,
            owner: e.owner,
            owner_name: e.owner_name
          }
        })),

        select: async (info) => {
          const title = prompt('Titel des Termins:');
          if (!title) {
            info.view.calendar.unselect();
            return;
          }

          let startsAt = info.startStr;
          let endsAt = info.endStr;
          let isAllDay = info.allDay;

          const useSpecificTime = confirm('Möchten Sie eine spezielle Uhrzeit festlegen?\n\nOK = Uhrzeit eingeben\nAbbrechen = Ganztägiger Termin');
          
          if (useSpecificTime) {
            const startTime = prompt('Startzeit (Format: HH:MM, z.B. 14:30):', '09:00');
            if (startTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
              const endTime = prompt('Endzeit (Format: HH:MM, z.B. 16:00):', '10:00');
              if (endTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
                const startDate = new Date(info.start);
                const endDate = new Date(info.end || info.start);
                
                const [startHour, startMin] = startTime.split(':');
                const [endHour, endMin] = endTime.split(':');
                
                startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                
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

          const location = prompt('Ort (optional):') || null;

          try {
            const { data, error } = await supabase.from('events').insert({
              owner: user.id,
              owner_name: user.email.split('@')[0],
              title,
              location,
              starts_at: startsAt,
              ends_at: endsAt,
              all_day: isAllDay
            }).select();

            if (error) {
              console.error('Fehler beim Erstellen:', error);
              alert('Fehler beim Erstellen des Termins: ' + error.message);
              return;
            }

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

        eventClick: async (info) => {
          const event = info.event;
          const props = event.extendedProps;
          
          const startTime = event.start ? event.start.toLocaleString('de-DE') : 'Unbekannt';
          const endTime = event.end ? event.end.toLocaleString('de-DE') : 'Unbekannt';
          const ownerName = userNames[props.owner] || props.owner_name || 'Unbekannt';
          
          let details = `📅 ${event.title}\n\n`;
          details += `🕐 Von: ${startTime}\n`;
          details += `🕐 Bis: ${endTime}\n`;
          if (props.location) details += `📍 Ort: ${props.location}\n`;
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
      
      setTimeout(() => {
        goToOptimalWeek();
      }, 100);
    }
  }, [user]);

  useEffect(() => {
    if (calRef.current && events.length >= 0) {
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
          <h1 style={{ margin: 0, color: '#333' }}>💕 Our future Plans 💕</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Angemeldet als: {user.email}
          </p>
        </div>
        <button 
          onClick={async () => { 
            if (confirm('Möchtenst du dich wirklich abmelden my love? <3')) {
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
