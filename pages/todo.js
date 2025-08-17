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
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
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
        .order('sort_order', { ascending: true })
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
      // Höchste sort_order in der Kategorie finden
      const filteredTodos = todos.filter(todo => todo.category === activeCategory);
      const maxSortOrder = filteredTodos.length > 0 
        ? Math.max(...filteredTodos.map(todo => todo.sort_order || 0))
        : 0;

      const { data, error } = await supabase
        .from('todos')
        .insert({
          title: newTodo.trim(),
          category: activeCategory,
          owner: user.id,
          completed: false,
          sort_order: maxSortOrder + 1
        })
        .select()
        .single();

      if (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen: ' + error.message);
        return;
      }

      setTodos([...todos, data]);
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
        console.error('Fehler beim Löschen:',
