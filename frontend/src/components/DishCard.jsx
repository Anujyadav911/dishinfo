import React from 'react';

function DishCard({ dish, onToggle }) {
  return (
    <div className="dish-card">
      <div className="dish-image-container">
        <img src={dish.imageUrl} alt={dish.dishName} className="dish-image" />
        <div className={`status-badge ${dish.isPublished ? 'published' : 'unpublished'}`}>
          {dish.isPublished ? 'Published' : 'Unpublished'}
        </div>
      </div>
      <div className="dish-info">
        <h3 className="dish-title">{dish.dishName}</h3>
        
        <div className="toggle-container">
          <span className="toggle-label">Publication Status</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={dish.isPublished} 
              onChange={onToggle} 
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default DishCard;
