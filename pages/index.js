import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const userColors = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': '#ff4f00',
  '5a1d936f-6f39-4c2a-915b-bac53b6cf627': '#00bfff',
  'together': '#8b5cf6' // Violett für gemeinsame Termine
};

const userNames = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': 'Mosi',
  '5a1d936f-6f39-4c2a-915b-bac53b6cf627': 'Lori',
  'together': 'Together ❤️'
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
      const todayDayOfWeek = today.getDay(); // 0=Sonntag, 1=Montag, ...
      
      // Setze heute als ersten Tag der Woche
      calRef.current.setOption('firstDay', todayDayOfWeek);
      
      // Gehe zu heute
      calRef.current.gotoDate(today);
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
        views: {
          timeGridWeek: {
            type: 'timeGrid',
            duration: { days: 7 },
            buttonText: 'Week'
          },
          timeGridDay: {
            buttonText: 'Day'
          },
          dayGridMonth: {
            buttonText: 'Month'
          }
        },
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        firstDay: 0, // Dynamisch setzen - heute als erster Tag
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
        
        // Klick auf Tages-Header aktivieren
        dayHeaderClassNames: 'clickable-day-header',
        
        // Custom Event Handler für Klick auf Tag-Header
        customButtons: {},
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
          backgroundColor: e.is_together ? userColors['together'] : userColors[e.owner] || '#9E9E9E',
          extendedProps: {
            location: e.location,
            owner: e.owner,
            owner_name: e.owner_name,
            is_together: e.is_together
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

          // Prüfe ob mehrtägige Auswahl (nur in Monatsansicht möglich)
          const isMultiDay = info.start && info.end && 
                            (info.end.getTime() - info.start.getTime()) > 24 * 60 * 60 * 1000;

          if (isMultiDay) {
            // Mehrtägiger Termin (z.B. Urlaub)
            const confirmMultiDay = confirm(`Mehrtägiger Termin "${title}" vom ${info.start.toLocaleDateString('de-DE')} bis ${new Date(info.end.getTime() - 1).toLocaleDateString('de-DE')}?\n\nOK = Mehrtägig\nAbbrechen = Nur einen Tag`);
            
            if (confirmMultiDay) {
              // Mehrtägig als Ganztag-Event
              isAllDay = true;
              startsAt = info.startStr;
              endsAt = info.endStr;
            } else {
              // Nur ersten Tag nehmen
              const endOfFirstDay = new Date(info.start);
              endOfFirstDay.setDate(endOfFirstDay.getDate() + 1);
              endsAt = endOfFirstDay.toISOString().split('T')[0];
              isAllDay = true;
            }
          } else {
            // Eintägiger Termin - normale Uhrzeit-Abfrage
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
          }

          const location = prompt('Ort (optional):') || null;

          // Together-Option hinzufügen
          const isTogetherEvent = confirm('Ist das ein gemeinsamer Termin für euch beide?\n\n💕 OK = Together (Violett)\n👤 Abbrechen = Nur für mich');

          try {
            const { data, error } = await supabase.from('events').insert({
              owner: user.id,
              owner_name: user.email.split('@')[0],
              title,
              location,
              starts_at: startsAt,
              ends_at: endsAt,
              all_day: isAllDay,
              is_together: isTogetherEvent
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
              backgroundColor: newEvent.is_together ? userColors['together'] : userColors[newEvent.owner] || '#9E9E9E',
              extendedProps: {
                location: newEvent.location,
                owner: newEvent.owner,
                owner_name: newEvent.owner_name,
                is_together: newEvent.is_together
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
          
          const startTime = event.start ? event.start.toLocaleDateString('de-DE') : 'Unbekannt';
          const endTime = event.end ? new Date(event.end.getTime() - 1).toLocaleDateString('de-DE') : 'Unbekannt';
          const ownerName = props.is_together ? 'Together ❤️' : (userNames[props.owner] || props.owner_name || 'Unbekannt');
          
          // Prüfe ob mehrtägig
          const isMultiDay = event.start && event.end && 
                            (event.end.getTime() - event.start.getTime()) > 24 * 60 * 60 * 1000;
          
          let details = `📅 ${event.title}\n\n`;
          
          if (isMultiDay) {
            details += `📆 Von: ${startTime}\n`;
            details += `📆 Bis: ${endTime}\n`;
            const days = Math.ceil((event.end.getTime() - event.start.getTime()) / (24 * 60 * 60 * 1000));
            details += `⏱️ Dauer: ${days} Tag${days > 1 ? 'e' : ''}\n`;
          } else {
            const startTimeFormatted = event.start ? event.start.toLocaleString('de-DE') : 'Unbekannt';
            const endTimeFormatted = event.end ? event.end.toLocaleString('de-DE') : 'Unbekannt';
            details += `🕐 Von: ${startTimeFormatted}\n`;
            details += `🕐 Bis: ${endTimeFormatted}\n`;
          }
          
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
      
      // Event Listener für Klick auf Tages-Header hinzufügen
      setTimeout(() => {
        const dayHeaders = document.querySelectorAll('.fc-col-header-cell');
        dayHeaders.forEach(header => {
          header.style.cursor = 'pointer';
          header.addEventListener('click', (e) => {
            // Datum aus dem Header extrahieren
            const dateStr = header.getAttribute('data-date');
            if (dateStr) {
              // Zur Tagesansicht wechseln und zum geklickten Datum springen
              calendar.changeView('timeGridDay', dateStr);
            }
          });
        });
        
        // Optimale Woche setzen
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
        backgroundColor: e.is_together ? userColors['together'] : userColors[e.owner] || '#9E9E9E',
        extendedProps: {
          location: e.location,
          owner: e.owner,
          owner_name: e.owner_name,
          is_together: e.is_together
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
    <main style={{ padding: 0, maxWidth: '100%', margin: '0' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        padding: '8px 0',
        borderBottom: '1px solid #ddd'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '20px' }}>💕 Our future Plans</h1>
          <div style={{ margin: '2px 0 0 0', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>{user.email.split('@')[0]}</span>
            <span style={{ color: userColors['fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc'] }}>●</span>
            <span style={{ color: userColors['5a1d936f-6f39-4c2a-915b-bac53b6cf627'] }}>●</span>
            <span style={{ color: userColors['together'] }}>●</span>
          </div>
        </div>
        <button 
          onClick={async () => { 
            if (confirm('You really wanna log out Süße?? <3')) {
              await supabase.auth.signOut(); 
              location.reload(); 
            }
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef5350',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Logout
        </button>
      </header>
      <div ref={hostRef} style={{ backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
    </main>
  );
}
