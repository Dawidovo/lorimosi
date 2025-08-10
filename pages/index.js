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
  const [userMap, setUserMap] = useState({}); // owner -> name

  // Farben für jeden Nutzer (UUID anpassen!)
  const userColors = {
    'UUID_VON_DIR': '#4cafef',
    'UUID_VON_DEINER_FREUNDIN': '#ef5350'
  };

  // Session laden
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
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

  // Nutzer-Map laden (damit wir Namen anzeigen können)
  async function loadUsers() {
    const { data, error } = await supabase.from('profiles').select('id, display_name');
    if (!error && data) {
      const map = {};
      data.forEach(p => map[p.id] = p.display_name || p.id);
      setUserMap(map);
    }
  }

  // Events laden
  async function loadEvents() {
    const { data, error } = await supabase.from('events').select('*').order('starts_at');
    if (!error) setRows(data || []);
  }

  // Kalender mounten/aktualisieren
  useEffect(() => {
    if (!user) return;
    (async () => {
      await loadUsers();
      await loadEvents();
      if (hostRef.current && !calRef.current) {
        const calendar = new Calendar(hostRef.current, {
          plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth',
          selectable: true,
          editable: true,
          events: () =>
            rows.map(e => ({
              id: e.id,
              title: `${e.title} (${userMap[e.owner] || 'Unbekannt'})`,
              start: e.starts_at,
              end: e.ends_at ?? undefined,
              allDay: e.all_day,
              backgroundColor: userColors[e.owner] || '#9e9e9e'
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
            await loadEvents();
          },
          eventDrop: async ({ event }) => {
            await supabase.from('events').update({
              starts_at: event.start?.toISOString(),
              ends_at: event.end?.toISOString() ?? null,
              all_day: event.allDay
            }).eq('id', event.id);
            await loadEvents();
          },
          eventResize: async ({ event }) => {
            await supabase.from('events').update({
              starts_at: event.start?.toISOString(),
              ends_at: event.end?.toISOString() ?? null
            }).eq('id', event.id);
            await loadEvents();
          },
          eventClick: async ({ event }) => {
            if (confirm('Löschen?')) {
              await supabase.from('events').delete().eq('id', event.id);
              await loadEvents();
            }
          }
        });
        calendar.render();
        calRef.current = calendar;
      } else if (calRef.current) {
        calRef.current.removeAllEventSources();
        calRef.current.addEventSource(rows.map(e => ({
          id: e.id,
          title: `${e.title} (${userMap[e.owner] || 'Unbekannt'})`,
          start: e.starts_at,
          end: e.ends_at ?? undefined,
          allDay: e.all_day,
          backgroundColor: userColors[e.owner] || '#9e9e9e'
        })));
      }
    })();
  }, [user, rows, userMap]);

  if (!user) return <main style={{ padding: 16 }}>Lade…</main>;

  return (
    <main style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Gemeinsamer Kalender</h1>
        <button onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>Logout</button>
      </header>
      <div ref={hostRef} />
    </main>
  );
}

      </header>
      <div ref={hostRef} />
    </main>
  );
}
