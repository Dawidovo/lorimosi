// pages/index.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import CalendarComponent from "../components/Calendar";

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) setUser(user || null);
      setLoading(false);
    }

    // Session-Änderungen mitbekommen
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    load();
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, []);

  async function signIn(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) return <main style={{padding:16}}>Lade…</main>;

  return (
    <main style={{ padding: 16, maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Gemeinsamer Kalender</h1>

      {!user ? (
        <form onSubmit={signIn} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <p>Bitte einloggen, um Termine zu erstellen/bearbeiten.</p>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 8 }}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            style={{ padding: 8 }}
          />
          <button type="submit" style={{ padding: 10, cursor: "pointer" }}>
            Einloggen
          </button>
        </form>
      ) : (
        <>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span>Eingeloggt als <code>{user.email}</code></span>
            <button onClick={signOut} style={{ padding: "6px 10px", cursor: "pointer" }}>
              Logout
            </button>
          </div>
          {/* user.id an den Kalender geben */}
          <CalendarComponent userId={user.id} />
        </>
      )}
    </main>
  );
}
