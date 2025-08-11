// components/Calendar.js
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "../lib/supabaseClient";

// FullCalendar nur clientseitig laden (wichtig in Next.js)
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

export default function CalendarComponent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // einfache User-Farbzuordnung (optional anpassen)
  const getUserColor = useCallback((userId) => {
    const colors = {
      "88a63a7f-b350-4704-9b1e-44445a6f33bb": "#4cafef", // Blau
      "fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc": "#ef5350", // Rot
    };
    return colors[userId] || "#9e9e9e"; // Grau
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        starts_at,
        ends_at,
        location,
        description,
        created_by,
        profiles (display_name)
      `)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("Error loading events:", error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((ev) => ({
      id: String(ev.id),
      title: `${ev.title} (${ev.profiles?.display_name || "Unbekannt"})`,
      start: ev.starts_at,
      end: ev.ends_at || null,
      backgroundColor: getUserColor(ev.created_by),
      extendedProps: {
        location: ev.location,
        description: ev.description,
        created_by: ev.created_by,
        display_name: ev.profiles?.display_name || "Unbekannt",
      },
    }));

    setEvents(mapped);
    setLoading(false);
  }, [getUserColor]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Termin durch Auswahl anlegen (TimeGrid = mit Uhrzeit)
  const handleSelect = useCallback(async (sel) => {
    const title = window.prompt("Titel für den Termin?");
    if (!title) {
      sel.view.calendar.unselect();
      return;
    }

    // angemeldeten User für created_by holen
    const { data: userData } = await supabase.auth.getUser();
    const createdBy = userData?.user?.id || null;

    const payload = {
      title,
      starts_at: sel.startStr,
      ends_at: sel.endStr, // kommt aus FullCalendar inkl. Uhrzeit
      location: null,
      description: null,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select(`
        id, title, starts_at, ends_at, location, description, created_by,
        profiles (display_name)
      `);

    if (error) {
      console.error("Fehler beim Anlegen:", error);
      alert("Konnte Termin nicht anlegen.");
      return;
    }

    const ev = data[0];
    sel.view.calendar.addEvent({
      id: String(ev.id),
      title: `${ev.title} (${ev.profiles?.display_name || "Unbekannt"})`,
      start: ev.starts_at,
      end: ev.ends_at || null,
      backgroundColor: getUserColor(ev.created_by),
      extendedProps: {
        location: ev.location,
        description: ev.description,
        created_by: ev.created_by,
        display_name: ev.profiles?.display_name || "Unbekannt",
      },
    });

    sel.view.calendar.unselect();
  }, [getUserColor]);

  // Drag/Drop & Resize speichern
  const handleEventChange = useCallback(async (chg) => {
    const ev = chg.event;

    // Falls FullCalendar kein end setzt, 1h default
    const startISO = ev.start?.toISOString();
    const endISO =
      ev.end?.toISOString() ||
      new Date(ev.start.getTime() + 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("events")
      .update({ starts_at: startISO, ends_at: endISO })
      .eq("id", ev.id);

    if (error) {
      console.error("Update-Fehler:", error);
      alert("Konnte Änderung nicht speichern. Rückgängig gemacht.");
      chg.revert();
    }
  }, []);

  // Klick: Details anzeigen + Löschen anbieten
  const handleEventClick = useCallback(async (click) => {
    const ev = click.event;
    const details =
      `Titel: ${ev.title}\n` +
      `Von:   ${ev.start?.toLocaleString()}\n` +
      `Bis:   ${ev.end?.toLocaleString() || "—"}\n` +
      `Ort:   ${ev.extendedProps.location || "—"}\n` +
      `Beschreibung: ${ev.extendedProps.description || "—"}\n` +
      `Erstellt von: ${ev.extendedProps.display_name}\n\n` +
      `Löschen? (OK = löschen, Abbrechen = schließen)`;

    if (window.confirm(details)) {
      const { error } = await supabase.from("events").delete().eq("id", ev.id);
      if (error) {
        console.error("Lösch-Fehler:", error);
        alert("Konnte Termin nicht löschen.");
        return;
      }
      ev.remove();
    }
  }, []);

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        selectable
        selectMirror
        editable
        eventResizableFromStart
        longPressDelay={250}           // mobile long press
        select={handleSelect}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        nowIndicator
        height="auto"
      />

      {loading && <p style={{ marginTop: 8, color: "#6b7280" }}>Lade Termine…</p>}
    </div>
  );
}
