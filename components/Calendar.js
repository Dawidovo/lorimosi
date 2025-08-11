// lorimosi/components/calender.js
"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "../lib/supabaseClient";

// WICHTIG: FullCalendar nur im Client laden
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

export default function CalendarComponent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUserColor = useCallback((userId) => {
    const colors = {
      "88a63a7f-b350-4704-9b1e-44445a6f33bb": "#4cafef",
      "fe271f99-ad07-4ce1-9a22-8cdc15a8e6fc": "#ef5350",
    };
    return colors[userId] || "#9e9e9e";
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

    const mapped = (data || []).map((event) => ({
      id: String(event.id),
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

    setEvents(mapped);
    setLoading(false);
  }, [getUserColor]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auswahl: Termin anlegen (inkl. Uhrzeit in Week/Day-View)
  const handleSelect = useCallback(async (selectionInfo) => {
    const title = window.prompt("Titel für den Termin?");
    if (!title) {
      selectionInfo.view.calendar.unselect();
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const createdBy = userData?.user?.id || null;

    const payload = {
      title,
      starts_at: selectionInfo.startStr,
      ends_at: selectionInfo.endStr,
      location: null,
      description: null,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select(`
        id, title, starts_at, ends_at, location, description, created_by, profiles (display_name)
      `);

    if (error) {
      console.error("Fehler beim Anlegen:", error);
      alert("Konnte Termin nicht anlegen.");
      return;
    }

    const ev = data[0];
    selectionInfo.view.calendar.addEvent({
      id: String(ev.id),
      title: `${ev.title} (${ev.profiles?.display_name || "Unbekannt"})`,
      start: ev.starts_at,
      end: ev.ends_at,
      backgroundColor: getUserColor(ev.created_by),
      extendedProps: {
        location: ev.location,
        description: ev.description,
        created_by: ev.created_by,
        display_name: ev.profiles?.display_name || "Unbekannt",
      },
    });

    selectionInfo.view.calendar.unselect();
  }, [getUserColor]);

  // Drag/Resize speichern
  const handleEventChange = useCallback(async (changeInfo) => {
    const ev = changeInfo.event;
    const { error } = await supabase
      .from("events")
      .update({
        starts_at: ev.start?.toISOString(),
        ends_at: ev.end?.toISOString(),
      })
      .eq("id", ev.id);

    if (error) {
      console.error("Update-Fehler:", error);
      alert("Konnte Änderung nicht speichern. Rückgängig gemacht.");
      changeInfo.revert();
    }
  }, []);

  // Klick: Details + Löschen
  const handleEventClick = useCallback(async (clickInfo) => {
    console.log("eventClick", clickInfo.event?.id); // Debug
    const ev = clickInfo.event;
    const details =
      `Titel: ${ev.title}\n` +
      `Von:   ${ev.start?.toLocaleString()}\n` +
      `Bis:   ${ev.end?.toLocaleString()}\n` +
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
        longPressDelay={250}
        select={handleSelect}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        nowIndicator
        height="auto"
      />

      {loading && <p className="text-sm text-gray-500 mt-2">Lade Termine…</p>}
    </div>
  );
}
