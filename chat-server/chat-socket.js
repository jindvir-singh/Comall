const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create an Express application
const app = express();

// Enable CORS for Express (allow connections from localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',  // Allow only localhost:3000
  methods: ['GET', 'POST'],  // Allow only GET and POST requests
}));

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',  // Allow only localhost:3000 for Socket.IO connections
    methods: ['GET', 'POST'],  // Allow only GET and POST methods
  }
});

// Store users in an object (in-memory storage)
let users = {}; // Store user ID and their corresponding socket ID

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('New client connected');

  // Listen for user registration (user ID)
  socket.on('register', (userId) => {
    users[userId] = socket.id;  // Store the socket ID with userId
    console.log(`${userId} registered with socket ID: ${socket.id}`);
  });

  // Handle incoming chat messages
  socket.on('chat', (data) => {
    const { fromUserId, toUserId, content } = data;
    const toSocketId = users[toUserId];
    if (toSocketId) {
      io.to(toSocketId).emit('chat', {
        from: fromUserId,
        content,
      });
      console.log(`Message sent from ${fromUserId} to ${toUserId}`);
    } else {
      console.log(`User ${toUserId} not connected`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Clean up the user-to-socket mapping on disconnect
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Define Express routes (optional, just for testing purposes)
app.get('/', (req, res) => {
  res.send({ message: 'Server is running' });
});

// Start the server
server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
