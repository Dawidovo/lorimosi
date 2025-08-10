import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
              title: e.title,
              start: e.starts_at,
              end: e.ends_at ?? undefined,
              allDay: e.all_day
            })),
          select: async (info) => {
            const title = prompt('Titel?');
            if (!title) return;
            await supabase.from('events').insert({
              owner: user.id,
              title,
              starts_at: info.startStr,
              ends_at: info.endStr,
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
            if (confirm('Löschen?')) {
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
          id: e.id, title: e.title, start: e.starts_at, end: e.ends_at ?? undefined, allDay: e.all_day
        })));
      }
    })();
    return () => { /* nothing */ };
  }, [user, rows]);

  if (!user) return <main style={{padding:16}}>Lade…</main>;

  return (
    <main style={{ padding: 16 }}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1>Kalender</h1>
        <button onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>Logout</button>
      </header>
      <div ref={hostRef} />
    </main>
  );
}
