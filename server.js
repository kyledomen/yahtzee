const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let currentTurn = 0;
let rollCounter = 0;

// Serve the client files
app.use(express.static('public'));

// Connected
io.on('connection', (socket) => {
    console.log('A player connected: ', socket.id);

    players.push(socket.id);

    if (players.length === 2) {
        io.to(players[currentTurn]).emit('your turn');
    }

    socket.on('rolled', (data) => {
        socket.broadcast.emit('move made', {player: socket.id, roll: data.roll, counter: data.counter});
    });

    socket.on('turn over', () => {
        currentTurn = (currentTurn + 1) % players.length;
        io.to(players[currentTurn]).emit('your turn');
    });


    socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function roll_dice() {
    const randomIntegers = [];

    for (let i = 0; i < 5; i++) {
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        randomIntegers.push(randomNumber);
    }

    return randomIntegers;
}

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

