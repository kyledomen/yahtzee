const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let currentTurn = 0;
let rollCounters = {};
let numberOfDice = 5;

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

    socket.on('roll dice', (dice) => {
        if (players[currentTurn] === socket.id && rollCounters[socket.id] < 3) {
            let roll;
            if ((typeof dice.length) === 'undefined') {
                roll = roll_dice(numberOfDice);
            } else {
                roll = roll_dice(numberOfDice - dice.length);
            }


            rollCounters[socket.id] += 1;

            socket.emit('rolled', {roll: roll, counter: rollCounters[socket.id]});

            // display the current roll to other players
            socket.broadcast.emit('opponent rolled', {player: socket.id, roll: roll, counter: rollCounters[socket.id]});

            if (rollCounters[socket.id] >= 3) {
                rollCounters[socket.id] = 0;
                currentTurn = (currentTurn + 1) % players.length;
                io.to(players[currentTurn]).emit('your turn');

                let otherPlayer = (currentTurn + 1) % players.length;
                io.to(players[otherPlayer]).emit('finished rolling', roll);
            }
        }
    });

    socket.on('dice added', (dice) => {
        socket.broadcast.emit('opponent added dice', dice);
    });

    socket.on('dice removed', (dice) => {
        socket.broadcast.emit('opponent removed dice', dice);
    });

    socket.on('calculate score', (dice) => {
        console.log(dice);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

});

function roll_dice(totalDice) {
    const randomIntegers = [];

    for (let i = 0; i < totalDice; i++) {
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

