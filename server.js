const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let currentTurn = 0;
let rollCounters = {};

// Serve the client files
app.use(express.static('public'));

// Connected
io.on('connection', (socket) => {
    console.log('A player connected: ', socket.id);

    players.push(socket.id);
    rollCounters[socket.id] = 0;

    if (players.length === 2) {
        io.to(players[currentTurn]).emit('your turn');
    }

    socket.on('roll dice', (data) => {
        if (players[currentTurn] === socket.id && rollCounters[socket.id] < 3) {
            const myRoll = roll_dice();
            rollCounters[socket.id] += 1;

            socket.emit('rolled', {roll: myRoll, counter: rollCounters[socket.id]});

            socket.broadcast.emit('move made', {player: socket.id, roll: myRoll, counter: rollCounters[socket.id]});

            if (rollCounters[socket.id] >= 3) {
                rollCounters[socket.id] = 0;
                currentTurn = (currentTurn + 1) % players.length;
                io.to(players[currentTurn]).emit('your turn');
            }
        }
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

