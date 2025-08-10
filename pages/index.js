import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Farben pro Nutzer-ID festlegen (IDs aus Supabase Users Tabelle holen)
const userColors = {
  'fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc': '#ffa500', // z.B. du
  'USER_ID_2': '88a63a7f-b350-4704-9b1e-44445a6f33bb'  // z.B. deine Freundin
};

export default function Home() {
  const calRef = useRef(null);
  const hostRef = useRef(null);
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);

  // Session laden
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Simple Login-Prompt (E-Mail+Passwort)
        const email = prompt('E-Mail:');
        const password = prompt('Passwort:');
        if (!email || !password) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { alert(error.message); return; }
      }
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
    })();
  }, []);

  // Events laden
  async function load() {
    const { data, error } = await supabase.from('events').select('*').order('starts_at');
    if (!error) setRows(data || []);
    else console.error(error);
  }

  // Kalender mounten/aktualisieren
  useEffect(() => {
    if (!user) return;
    (async () => {
      await load();
      if (hostRef.current && !calRef.current) {
        const calendar = new Calendar(hostRef.current, {
          plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth',
          selectable: true,
          editable: true,
          events: () =>
            rows.map(e => ({
              id: e.id,
              title: `${e.title} (${e.owner_name || 'Unbekannt'})${e.location ? ' @ ' + e.location : ''}`,
              start: e.starts_at,
              end: e.ends_at ?? undefined,
              allDay: e.all_day,
              backgroundColor: userColors[e.owner] || '#9E9E9E'
            })),
          select: async (info) => {
            const title = prompt('Titel?');
            if (!title) return;
            const location = prompt('Ort (optional):');
            let startsAt = info.startStr;
            let endsAt = info.endStr;

            // Uhrzeit-Abfrage nur, wenn kein Ganztag
            if (!info.allDay) {
              const startTime = prompt('Startzeit (HH:MM, optional):');
              const endTime = prompt('Endzeit (HH:MM, optional):');
              if (startTime) startsAt = `${info.startStr}T${startTime}:00`;
              if (endTime) endsAt = `${info.endStr}T${endTime}:00`;
            }

            await supabase.from('events').insert({
              owner: user.id,
              owner_name: user.email, // oder display_name falls vorhanden
              title,
              location,
              starts_at: startsAt,
              ends_at: endsAt,
              all_day: info.allDay
            });
            await load();
          },
          eventDrop: async ({ event }) => {
            await supabase.from('events').update({
              starts_at: event.start?.toISOString(),
              ends_at: event.end?.toISOString() ?? null,
              all_day: event.allDay
            }).eq('id', event.id);
            await load();
          },
          eventResize: async ({ event }) => {
            await supabase.from('events').update({
              starts_at: event.start?.toISOString(),
              ends_at: event.end?.toISOString() ?? null
            }).eq('id', event.id);
            await load();
          },
          eventClick: async ({ event }) => {
            if (confirm('Diesen Termin löschen?')) {
              await supabase.from('events').delete().eq('id', event.id);
              await load();
            }
          }
        });
        calendar.render();
        calRef.current = calendar;
      } else if (calRef.current) {
        // neu laden
        calRef.current.removeAllEventSources();
        calRef.current.addEventSource(rows.map(e => ({
          id: e.id,
          title: `${e.title} (${e.owner_name || 'Unbekannt'})${e.location ? ' @ ' + e.location : ''}`,
          start: e.starts_at,
          end: e.ends_at ?? undefined,
          allDay: e.all_day,
          backgroundColor: userColors[e.owner] || '#9E9E9E'
        })));
      }
    })();
    return () => { /* cleanup nicht nötig */ };
  }, [user, rows]);

  if (!user) return <main style={{ padding: 16 }}>Lade…</main>;

  return (
    <main style={{ padding: 16 }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <h1>Gemeinsamer Kalender</h1>
        <button onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>Logout</button>
      </header>
      <div ref={hostRef} />
    </main>
  );
}
