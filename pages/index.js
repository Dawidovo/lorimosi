// pages/index.js
import CalendarComponent from "../components/Calendar";

export default function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Gemeinsamer Kalender</h1>
      <CalendarComponent />
    </main>
  );
}
