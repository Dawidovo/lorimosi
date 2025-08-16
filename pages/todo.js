import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const categories = {
  tasks: { name: 'Aufgaben', icon: '📋', color: '#4cafef' },
  shopping: { name: 'Einkaufen', icon: '🛒', color: '#ff6b6b' },
  bucket: { name: 'Bucket List', icon: '✨', color: '#8b5cf6' }
};

export default function TodoPage() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('tasks');
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

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
      <main style={{ padding: 20, textAlign: 'center' }}>
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
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: '12px 16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ 
            textDecoration: 'none', 
            fontSize: '20px',
            color: '#666'
          }}>
            ←
          </Link>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
              📝 Todo Listen
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '12px' }}>
              {user.email.split('@')[0]}
            </p>
          </div>
        </div>
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
      </header>

      <div style={{ padding: '0 16px' }}>
        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '6px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          gap: '4px'
        }}>
          {Object.entries(categories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeCategory === key ? cat.color : 'transparent',
                color: activeCategory === key ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.icon}</span>
              <span style={{ fontSize: '12px' }}>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Add Todo */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder={`Neue ${categories[activeCategory].name.toLowerCase()}...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #f0f0f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = categories[activeCategory].color}
              onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
            />
            <button
              onClick={addTodo}
              disabled={loading || !newTodo.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: categories[activeCategory].color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !newTodo.trim() ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? '...' : '+'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {categories[activeCategory].icon}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {completedCount} von {filteredTodos.length} erledigt
          </div>
          {filteredTodos.length > 0 && (
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#f0f0f0',
              borderRadius: '3px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(completedCount / filteredTodos.length) * 100}%`,
                height: '100%',
                backgroundColor: categories[activeCategory].color,
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </div>

        {/* Todo List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {filteredTodos.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {categories[activeCategory].icon}
              </div>
              <p>Keine {categories[activeCategory].name.toLowerCase()} vorhanden</p>
              <p style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
                Fügen Sie oben eine neue hinzu!
              </p>
            </div>
          ) : (
            filteredTodos.map((todo, index) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: index < filteredTodos.length - 1 ? '1px solid #f0f0f0' : 'none',
                  backgroundColor: todo.completed ? '#f8f9fa' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${categories[activeCategory].color}`,
                    backgroundColor: todo.completed ? categories[activeCategory].color : 'white',
                    cursor: 'pointer',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {todo.completed && '✓'}
                </button>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    color: todo.completed ? '#999' : '#333',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {todo.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px'
                  }}>
                    {new Date(todo.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#999',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fee';
                    e.target.style.color = '#e53e3e';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#999';
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
