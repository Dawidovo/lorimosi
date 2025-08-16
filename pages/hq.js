import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/useTheme';
import Link from 'next/link';

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

const FeatureCard = ({ icon, title, description, status, comingSoon, onClick, href }) => {
  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-hover)',
    transition: 'all 0.3s ease',
    cursor: comingSoon ? 'not-allowed' : 'pointer',
    opacity: comingSoon ? 0.6 : 1,
    border: '2px solid transparent',
    position: 'relative',
    overflow: 'hidden'
  };

  const hoverStyle = {
    transform: comingSoon ? 'none' : 'translateY(-4px)',
    boxShadow: comingSoon ? 'var(--shadow-hover)' : '0 8px 25px rgba(0,0,0,0.15)',
    borderColor: comingSoon ? 'transparent' : 'var(--border-color)'
  };

  const CardContent = () => (
    <div style={cardStyle}
         onMouseEnter={(e) => {
           if (!comingSoon) {
             Object.assign(e.target.style, hoverStyle);
           }
         }}
         onMouseLeave={(e) => {
           if (!comingSoon) {
             e.target.style.transform = 'translateY(0)';
             e.target.style.boxShadow = 'var(--shadow-hover)';
             e.target.style.borderColor = 'transparent';
           }
         }}
         onClick={!comingSoon ? onClick : undefined}>
      {comingSoon && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          SOON
        </div>
      )}
      
      <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
        {icon}
      </div>
      
      <h3 style={{
        margin: '0 0 8px 0',
        color: 'var(--text-primary)',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {title}
      </h3>
      
      <p style={{
        margin: '0 0 12px 0',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        {description}
      </p>
      
      {status && (
        <div style={{
          backgroundColor: 'var(--input-border)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {status}
        </div>
      )}
    </div>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default function HQPage() {
  const [user, setUser] = useState(null);
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

  const currentFeatures = [
    {
      icon: '📅',
      title: 'Kalender',
      description: 'Gemeinsame Termine und Events planen',
      href: '/',
      status: '✅ Aktiv'
    },
    {
      icon: '📝',
      title: 'Todo Listen',
      description: 'Aufgaben, Einkaufen & Bucket List',
      href: '/todo',
      status: '✅ Aktiv'
    }
  ];

  const upcomingFeatures = [
    {
      icon: '🌤️',
      title: 'Wetter Integration',
      description: 'Wetter für geplante Events anzeigen',
      comingSoon: true,
      status: 'In Planung'
    },
    {
      icon: '📸',
      title: 'Event Fotos',
      description: 'Bilder zu vergangenen Terminen hinzufügen',
      comingSoon: true,
      status: 'In Entwicklung'
    },
    {
      icon: '🔔',
      title: 'Erinnerungen',
      description: 'Push-Benachrichtigungen für Events',
      comingSoon: true,
      status: 'Geplant'
    },
    {
      icon: '🎯',
      title: 'Paar-Ziele',
      description: 'Gemeinsame Ziele setzen und verfolgen',
      comingSoon: true,
      status: 'Konzept'
    },
    {
      icon: '💕',
      title: 'Anniversary Counter',
      description: 'Beziehungs-Meilensteine verfolgen',
      comingSoon: true,
      status: 'Idee'
    },
    {
      icon: '✈️',
      title: 'Reise Planer',
      description: 'Urlaub und Trips organisieren',
      comingSoon: true,
      status: 'Zukunft'
    }
  ];

  if (!user) {
    return (
      <main style={{ 
        padding: 20, 
        textAlign: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}>
        <h2>Lade HQ...</h2>
        <p>Bitte warten Sie einen Moment.</p>
      </main>
    );
  }

  return (
    <main style={{ 
      padding: 0, 
      maxWidth: '100%', 
      margin: '0',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: `1px solid var(--border-color)`,
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ 
            textDecoration: 'none', 
            fontSize: '20px',
            color: 'var(--text-secondary)'
          }}>
            ←
          </Link>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>
              🏢 HQ - Headquarters
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              {user.email.split('@')[0]} • Feature Dashboard
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
          
          <button 
            onClick={async () => { 
              if (confirm('Logout?')) {
                await supabase.auth.signOut(); 
                window.location.href = '/';
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

      <div style={{ padding: '0 16px 32px' }}>
        {/* Welcome Section */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-hover)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💕</div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            color: 'var(--text-primary)', 
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Welcome to your HQ!
          </h2>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-secondary)', 
            fontSize: '16px' 
          }}>
            Hier verwaltet ihr alle Features eurer gemeinsamen App
          </p>
        </div>

        {/* Current Features */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span>
            Aktive Features
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {currentFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* Upcoming Features */}
        <section>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🚀</span>
            Kommende Features
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {upcomingFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: 'var(--input-border)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            💡 Habt ihr Ideen für neue Features? Einfach implementieren lassen! 
          </p>
        </div>
      </div>
    </main>
  );
}
