// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const os = require('os');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Rate limiting for HTTP endpoints
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per window
}));

// CORS middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://192.168.1.133:5173",
    /^http:\/\/192\.168\.1\.\d{1,3}:5173$/
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  path: '/socket.io', // Important for proxy compatibility
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.133:5173",
      /^http:\/\/192\.168\.1\.\d{1,3}:5173$/
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000 // 25 seconds
});

// Store active battle rooms
const rooms = new Map();

// Helper function to get local IP
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  const playerId = socket.handshake.query.playerId;
  
  // Heartbeat monitoring
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat');
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle room creation
  socket.on('create_room', () => {
    try {
      const roomId = uuidv4();
      rooms.set(roomId, {
        players: [playerId],
        host: playerId,
        battleState: null,
        createdAt: Date.now()
      });
      
      socket.join(roomId);
      socket.emit('room_created', roomId);
      console.log(`Room created: ${roomId}`);
    } catch (err) {
      console.error('Room creation error:', err);
      socket.emit('error', 'Failed to create room');
    }
  });
  
  // Handle joining existing room
  socket.on('join_room', (roomId) => {
    try {
      if (!rooms.has(roomId)) {
        return socket.emit('error', 'Room does not exist');
      }
      
      const room = rooms.get(roomId);
      
      if (room.players.length >= 2) {
        return socket.emit('room_full');
      }
      
      room.players.push(playerId);
      socket.join(roomId);
      socket.emit('room_joined', roomId);
      
      io.to(roomId).emit('player_connected');
      
      if (room.battleState) {
        socket.emit('battle_state', room.battleState);
      }
      
      console.log(`Player ${playerId} joined room ${roomId}`);
    } catch (err) {
      console.error('Join room error:', err);
      socket.emit('error', 'Failed to join room');
    }
  });
  
  // Handle Pokémon selection
  socket.on('pokemon_selected', ({ room, pokemon }) => {
    if (!room || !pokemon?.id) {
      return socket.emit('error', 'Invalid Pokémon data');
    }
    
    if (!rooms.has(room)) return;
    
    const roomData = rooms.get(room);
    roomData.pokemonSelected = true;
    socket.to(room).emit('pokemon_selected', pokemon);
  });
  
  // Handle move execution
  socket.on('move', ({ room, move }) => {
    if (!room || !move?.name) {
      return socket.emit('error', 'Invalid move data');
    }
    
    if (!rooms.has(room)) return;
    socket.to(room).emit('move', move);
  });
  
  // Handle battle state synchronization
  socket.on('battle_state', ({ room, state }) => {
    if (!room || !state) {
      return socket.emit('error', 'Invalid battle state');
    }
    
    if (!rooms.has(room)) return;
    
    const roomData = rooms.get(room);
    roomData.battleState = state;
    socket.to(room).emit('battle_state', state);
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Disconnected (${socket.id}): ${reason}`);
    clearInterval(heartbeatInterval);
    
    rooms.forEach((room, roomId) => {
      room.players = room.players.filter(id => id !== playerId);
      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} cleaned up`);
      } else {
        // Notify remaining player about disconnection
        io.to(roomId).emit('player_disconnected', playerId);
      }
    });
  });

  // Error handling
  socket.on('error', (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    activeRooms: rooms.size,
    activeConnections: io.engine.clientsCount,
    serverTime: new Date().toISOString()
  });
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  const localIp = getLocalIpAddress();
  console.log(`
  🚀 Server running:
  - Local: http://localhost:${PORT}
  - Network: http://${localIp}:${PORT}
  - Health check: http://${localIp}:${PORT}/health
  `);
});

// Clean up on process exit
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  io.disconnectSockets();
  server.close(() => {
    process.exit(0);
  });
});