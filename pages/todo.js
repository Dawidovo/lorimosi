import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/useTheme';
import Link from 'next/link';

const categories = {
  tasks: { name: 'Aufgaben', icon: '📋', color: '#4cafef' },
  shopping: { name: 'Einkaufen', icon: '🛒', color: '#ff6b6b' },
  bucket: { name: 'Bucket List', icon: '✨', color: '#8b5cf6' }
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

export default function TodoPage() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('tasks');
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  async function loadTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Fehler beim Laden:', error);
        return;
      }
      
      setTodos(data || []);
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  }

  async function addTodo() {
    if (!newTodo.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          title: newTodo.trim(),
          category: activeCategory,
          owner: user.id,
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen: ' + error.message);
        return;
      }

      setTodos([data, ...todos]);
      setNewTodo('');
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
      alert('Ein Fehler ist aufgetreten.');
    }
    setLoading(false);
  }

  async function toggleTodo(id, completed) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        console.error('Fehler beim Aktualisieren:', error);
        return;
      }

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  }

  async function deleteTodo(id) {
    if (!confirm('Todo wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Fehler beim Löschen:', error);
        return;
      }

      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  }

  const filteredTodos = todos.filter(todo => todo.category === activeCategory);
  const completedCount = filteredTodos.filter(todo => todo.completed).length;

  if (!user) {
    return (
      <main style={{ 
        padding: 20, 
        textAlign: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}>
        <h2>Lade Todo-Listen...</h2>
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
              📝 Todo Listen
            </h1>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              {user.email.split('@')[0]}
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

      <div style={{ padding: '0 16px' }}>
        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-secondary
