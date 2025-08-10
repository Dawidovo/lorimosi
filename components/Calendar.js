import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "../lib/supabaseClient";

export default function CalendarComponent() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadEvents() {
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
        `);

      if (error) {
        console.error("Error loading events:", error);
        return;
      }

      // Mapping auf FullCalendar-Format
      const mappedEvents = data.map((event) => ({
        id: event.id,
        title: `${event.title} (${event.profiles?.display_name || "Unbekannt"})`,
        start: event.starts_at,
        end: event.ends_at,
        backgroundColor: getUserColor(event.created_by),
        extendedProps: {
          location: event.location,
          description: event.description,
          created_by: event.created_by,
          display_name: event.profiles?.display_name || "Unbekannt",
        },
      }));

      setEvents(mappedEvents);
    }

    loadEvents();
  }, []);

  // Farben pro User-ID (einfaches Beispiel)
  function getUserColor(userId) {
    const colors = {
      "88a63a7f-b350-4704-9b1e-44445a6f33bb": "#4cafef", // Blau
      "fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc": "#ef5350", // Rot
    };
    return colors[userId] || "#9e9e9e"; // Grau, falls User unbekannt
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventClick={(info) => {
        alert(
          `Titel: ${info.event.title}\n` +
          `Ort: ${info.event.extendedProps.location || "—"}\n` +
          `Beschreibung: ${info.event.extendedProps.description || "—"}\n` +
          `Erstellt von: ${info.event.extendedProps.display_name}`
        );
      }}
    />
  );
}
