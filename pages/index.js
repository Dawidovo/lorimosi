import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/useTheme';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const userColors = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': '#ff4f00',
  '5a1d936f-6f39-4c2a-915b-bac53b6cf627': '#00bfff',
  'together': '#8b5cf6'
};

const userNames = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': 'Mosi',
  '5a1d936f-6f39-4c2a-915b-bac53b6cf627': 'Lori',
  'together': 'Together ❤️'
};

const ThemeToggle = ({ isDark, toggleTheme }) => (
  <button 
    onClick={toggleTheme}
    style={{
      padding: '6px 10px',
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s ease'
    }}
    title={isDark ? 'Light Mode' : 'Dark Mode'}
  >
    <span>{isDark ? '☀️' : '🌙'}</span>
  </button>
);

export default function Home() {
  const calRef = useRef(null);
  const hostRef = useRef(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const { isDark, toggleTheme } = useTheme();

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

  function parseTimeInput(input) {
    if (!input) return null;
    
    input = input.trim().toLowerCase();
    
    if (/^\d{1,2}:\d{2}$/.test(input)) {
      const [hours, minutes] = input.split(':');
      const h = parseInt(hours);
      const m = parseInt(minutes);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }
    
    if (/^\d{1,4}$/.test(input)) {
      const num = input.padStart(4, '0');
      
      if (input.length <= 2) {
        const hours = parseInt(input);
        if (hours >= 0 && hours <= 23) {
          return `${hours.toString().padStart(2, '0')}:00`;
        }
      } else {
        const hours = parseInt(num.substring(0, 2));
        const minutes = parseInt(num.substring(2, 4));
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  function goToOptimalWeek() {
    if (calRef.current) {
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      calRef.current.setOption('firstDay', todayDayOfWeek);
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
        firstDay: 0,
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

          const daysDifference = Math.ceil((info.end.getTime() - info.start.getTime()) / (24 * 60 * 60 * 1000));
          const isMultiDay = daysDifference > 1 && info.view.type === 'dayGridMonth';

          if (isMultiDay) {
            const confirmMultiDay = confirm(`Mehrtägiger Termin "${title}" vom ${info.start.toLocaleDateString('de-DE')} bis ${new Date(info.end.getTime() - 1).toLocaleDateString('de-DE')}?\n\nOK = Mehrtägig\nAbbrechen = Nur einen Tag`);
            
            if (confirmMultiDay) {
              isAllDay = true;
              startsAt = info.startStr;
              endsAt = info.endStr;
            } else {
              const endOfFirstDay = new Date(info.start);
              endOfFirstDay.setDate(endOfFirstDay.getDate() + 1);
              endsAt = endOfFirstDay.toISOString().split('T')[0];
              isAllDay = true;
            }
          } else {
            const useSpecificTime = confirm('Möchten Sie eine spezielle Uhrzeit festlegen?\n\nOK = Uhrzeit eingeben\nAbbrechen = Ganztägiger Termin');
            
            if (useSpecificTime) {
              const startTimeInput = prompt('Startzeit (z.B. 15:30, 1530, 15):', '9');
              const parsedStartTime = parseTimeInput(startTimeInput);
              
              if (parsedStartTime) {
                const endTimeInput = prompt('Endzeit (z.B. 17:00, 1700, 17):', '10');
                const parsedEndTime = parseTimeInput(endTimeInput);
                
                if (parsedEndTime) {
                  const startDate = new Date(info.start);
                  const endDate = new Date(info.start);
                  
                  const [startHour, startMin] = parsedStartTime.split(':');
                  const [endHour, endMin] = parsedEndTime.split(':');
                  
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
                  const endOfDay = new Date(info.start);
                  endOfDay.setDate(endOfDay.getDate() + 1);
                  endsAt = endOfDay.toISOString().split('T')[0];
                }
              } else {
                alert('Ungültige Startzeit. Termin wird als ganztägig angelegt.');
                isAllDay = true;
                const endOfDay = new Date(info.start);
                endOfDay.setDate(endOfDay.getDate() + 1);
                endsAt = endOfDay.toISOString().split('T')[0];
              }
            } else {
              isAllDay = true;
              const endOfDay = new Date(info.start);
              endOfDay.setDate(endOfDay.getDate() + 1);
              endsAt = endOfDay.toISOString().split('T')[0];
            }
          }

          const location = prompt('Ort (optional):') || null;
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
      
      setTimeout(() => {
        const dayHeaders = document.querySelectorAll('.fc-col-header-cell');
        dayHeaders.forEach(header => {
          header.style.cursor = 'pointer';
          header.addEventListener('click', (e) => {
            const dateStr = header.getAttribute('data-date');
            if (dateStr) {
              calendar.changeView('timeGridDay', dateStr);
            }
          });
        });
        
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
      <main style={{ padding: 20, textAlign: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
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
        borderBottom: `1px solid var(--border-color)`
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>💕 Our future Plans</h1>
          <div style={{ margin: '2px 0 0 0', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{user.email.split('@')[0]}</span>
            <span style={{ color: userColors['fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc'] }}>●</span>
            <span style={{ color: userColors['5a1d936f-6f39-4c2a-915b-bac53b6cf627'] }}>●</span>
            <span style={{ color: userColors['together'] }}>●</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
          
          <Link href="/hq" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            fontWeight: '500'
          }}>
            <span>🏢</span>
            <span>HQ</span>
          </Link>
          
          <Link href="/todo" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            border: `1px solid var(--border-color)`,
            transition: 'all 0.2s ease',
            fontWeight: '500'
          }}>
            <span>📝</span>
            <span>Todos</span>
          </Link>
          
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
        </div>
      </header>
      <div ref={hostRef} style={{ backgroundColor: 'var(--calendar-bg)', borderRadius: '6px', boxShadow: 'var(--shadow)' }} />
    </main>
  );
}
