// --------------------------------------
// This is your multiplayer "bridge" server
// Run it with: node server.js
// --------------------------------------

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Set up a basic web server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store games by room IDs ("lobbies")
const games = {};

io.on('connection', (socket) => {
    // When someone joins a room/lobby
    socket.on('join-room', ({ roomId, playerName }) => {
        socket.join(roomId);
        if (!games[roomId]) {
            games[roomId] = { players: [] };
        }
        games[roomId].players.push({ id: socket.id, name: playerName });
        io.to(roomId).emit('update-players', games[roomId].players);
    });

    // When a card is played by anyone in the room
    socket.on('play-card', ({ roomId, cardData }) => {
        // Send this card play to EVERYONE in the room
        io.to(roomId).emit('card-played', { playerId: socket.id, cardData });
    });

    // Add other events: czar choice, score update, etc
    // Example: when Card Czar picks winner
    socket.on('judge-winner', ({ roomId, winnerId }) => {
        io.to(roomId).emit('round-winner', { winnerId });
    });

    // Handle player disconnects
    socket.on('disconnecting', () => {
        Object.keys(socket.rooms).forEach(roomId => {
            if (games[roomId]) {
                games[roomId].players = games[roomId].players.filter(p => p.id !== socket.id);
                io.to(roomId).emit('update-players', games[roomId].players);
            }
        });
    });
});

server.listen(3000, () => {
    console.log('🌌 Server online at http://localhost:3000');
});
