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
        console.error('Fehler beim Löschen:', error);
        return;
      }

      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
    }
  }

  async function updateTodoOrder(newTodos) {
    try {
      // Update sort_order für alle betroffenen Todos
      const updates = newTodos.map((todo, index) => ({
        id: todo.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('todos')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setTodos(prev => prev.map(todo => {
        const update = updates.find(u => u.id === todo.id);
        return update ? { ...todo, sort_order: update.sort_order } : todo;
      }));
    } catch (err) {
      console.error('Fehler beim Sortieren:', err);
    }
  }

  function handleDragStart(e, todo, index) {
    setDraggedItem({ todo, index });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedOverIndex(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e, index) {
    e.preventDefault();
    setDraggedOverIndex(index);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === dropIndex) return;

    const filteredTodos = todos.filter(todo => todo.category === activeCategory);
    const newTodos = [...filteredTodos];
    const draggedTodo = newTodos[draggedItem.index];
    
    // Element entfernen und an neuer Position einfügen
    newTodos.splice(draggedItem.index, 1);
    newTodos.splice(dropIndex, 0, draggedTodo);
    
    updateTodoOrder(newTodos);
    setDraggedOverIndex(null);
  }

  // Touch events für mobile Geräte
  function handleTouchStart(e, todo, index) {
    const touch = e.touches[0];
    setDraggedItem({ 
      todo, 
      index, 
      startY: touch.clientY,
      element: e.target.closest('.todo-item')
    });
  }

  function handleTouchMove(e) {
    if (!draggedItem) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - draggedItem.startY;
    
    // Visuelles Feedback
    if (draggedItem.element) {
      draggedItem.element.style.transform = `translateY(${deltaY}px)`;
      draggedItem.element.style.opacity = '0.7';
      draggedItem.element.style.zIndex = '1000';
    }
  }

  function handleTouchEnd(e) {
    if (!draggedItem) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const todoItem = elementBelow?.closest('.todo-item');
    
    if (draggedItem.element) {
      draggedItem.element.style.transform = '';
      draggedItem.element.style.opacity = '';
      draggedItem.element.style.zIndex = '';
    }
    
    if (todoItem) {
      const dropIndex = parseInt(todoItem.dataset.index);
      if (!isNaN(dropIndex) && dropIndex !== draggedItem.index) {
        const filteredTodos = todos.filter(todo => todo.category === activeCategory);
        const newTodos = [...filteredTodos];
        const draggedTodo = newTodos[draggedItem.index];
        
        newTodos.splice(draggedItem.index, 1);
        newTodos.splice(dropIndex, 0, draggedTodo);
        
        updateTodoOrder(newTodos);
      }
    }
    
    setDraggedItem(null);
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
          
          <Link href="/hq" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            fontWeight: '500'
          }}>
            <span>🏢</span>
            <span>HQ</span>
          </Link>
          
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
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '6px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-hover)',
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
                color: activeCategory === key ? 'white' : 'var(--text-secondary)',
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
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-hover)'
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
                border: `2px solid var(--input-border)`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = categories[activeCategory].color}
              onBlur={(e) => e.target.style.borderColor = 'var(--input-border)'}
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
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-hover)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {categories[activeCategory].icon}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {completedCount} von {filteredTodos.length} erledigt
          </div>
          {filteredTodos.length > 0 && (
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--input-border)',
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
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-hover)',
          overflow: 'hidden'
        }}>
          {filteredTodos.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
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
                className="todo-item"
                data-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, todo, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => handleTouchStart(e, todo, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: index < filteredTodos.length - 1 ? `1px solid var(--input-border)` : 'none',
                  backgroundColor: todo.completed ? 'var(--input-border)' : 
                    draggedOverIndex === index ? 'rgba(74, 175, 239, 0.1)' : 'var(--bg-secondary)',
                  transition: 'all 0.2s ease',
                  cursor: 'grab',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  padding: '4px',
                  marginRight: '8px',
                  cursor: 'grab',
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  ⋮⋮
                </div>

                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${categories[activeCategory].color}`,
                    backgroundColor: todo.completed ? categories[activeCategory].color : 'transparent',
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
                    color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {todo.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
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
                    color: 'var(--text-secondary)',
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
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .todo-item:active {
          cursor: grabbing !important;
        }
        
        @media (max-width: 768px) {
          .todo-item {
            touch-action: manipulation;
          }
        }
      `}</style>
    </main>
  );
}
