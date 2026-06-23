const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany({
      orderBy: { dishId: 'asc' },
    });
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

app.patch('/api/dishes/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the dish
    const dish = await prisma.dish.findUnique({
      where: { dishId: id },
    });
    
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    
    // Toggle the status
    const updatedDish = await prisma.dish.update({
      where: { dishId: id },
      data: { isPublished: !dish.isPublished },
    });
    
    // Emit event immediately for responsiveness
    io.emit('dishUpdated', updatedDish);
    
    res.json(updatedDish);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dish' });
  }
});

// Real-time polling for external DB updates
// We keep a snapshot of the latest known state (updatedAt timestamps)
let knownState = new Map();

async function initPolling() {
  // Initialize known state
  const dishes = await prisma.dish.findMany();
  dishes.forEach(d => knownState.set(d.dishId, d.updatedAt.getTime()));
  
  // Poll every 2 seconds
  setInterval(async () => {
    try {
      const currentDishes = await prisma.dish.findMany();
      let hasChanges = false;
      
      currentDishes.forEach(dish => {
        const lastKnownTime = knownState.get(dish.dishId);
        const currentTime = dish.updatedAt.getTime();
        
        // If dish is new or its updatedAt changed (meaning it was updated externally)
        if (!lastKnownTime || currentTime > lastKnownTime) {
          knownState.set(dish.dishId, currentTime);
          hasChanges = true;
          // Broadcast the specific updated dish
          io.emit('dishUpdated', dish);
        }
      });
      
      // If we need to handle deletions (optional, based on requirements, but safe to add)
      if (currentDishes.length < knownState.size) {
         const currentIds = new Set(currentDishes.map(d => d.dishId));
         for (const [id] of knownState) {
           if (!currentIds.has(id)) {
             knownState.delete(id);
             io.emit('dishDeleted', id);
           }
         }
      }
      
    } catch (err) {
      console.error('Error polling database:', err);
    }
  }, 2000);
}

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Run seed just in case it's the first time
  try {
    require('./seed.js');
  } catch (e) {
    console.log('Seed file already run or failed.');
  }
  
  // Initialize polling after a slight delay to allow seed to finish
  setTimeout(initPolling, 1000);
});
