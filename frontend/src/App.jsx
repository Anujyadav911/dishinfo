import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import DishCard from './components/DishCard';
import './App.css';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api/dishes';

function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial data
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setDishes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dishes:', err);
        setLoading(false);
      });

    // Setup Socket.IO connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    socket.on('dishUpdated', (updatedDish) => {
      console.log('Real-time update received:', updatedDish);
      setDishes((prevDishes) =>
        prevDishes.map((dish) =>
          dish.dishId === updatedDish.dishId ? updatedDish : dish
        )
      );
    });

    socket.on('dishDeleted', (deletedId) => {
      setDishes((prevDishes) =>
        prevDishes.filter((dish) => dish.dishId !== deletedId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTogglePublish = async (dishId) => {
    // Optimistic UI update could go here, but we rely on real-time to show the robust nature
    // However, for immediate visual feedback, optimistic update is best practice.
    
    // Let's do optimistic update
    setDishes((prev) => 
      prev.map(d => d.dishId === dishId ? { ...d, isPublished: !d.isPublished } : d)
    );

    try {
      const res = await fetch(`${API_URL}/${dishId}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        throw new Error('Failed to toggle status');
      }
    } catch (err) {
      console.error(err);
      // Revert on failure (simple reload for now or real-time will fix it)
      fetch(API_URL)
        .then(res => res.json())
        .then(setDishes);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Menu Manager</h1>
          <p>Real-time dish publication dashboard</p>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dishes...</p>
          </div>
        ) : (
          <div className="dish-grid">
            {dishes.map((dish) => (
              <DishCard
                key={dish.dishId}
                dish={dish}
                onToggle={() => handleTogglePublish(dish.dishId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
