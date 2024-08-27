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
let scorecards = {};

// Serve the client files
app.use(express.static('public'));

// Connected
io.on('connection', (socket) => {
    console.log('A player connected: ', socket.id);

    players.push(socket.id);
    rollCounters[socket.id] = 0;
    scorecards[socket.id] = initializeScorecard();

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

            if (rollCounters[socket.id] >= 3)
                io.to(players[currentTurn]).emit('finished rolling', roll);
        }
    });

    socket.on('dice added', (dice) => {
        socket.broadcast.emit('opponent added dice', dice);
    });

    socket.on('dice removed', (dice) => {
        socket.broadcast.emit('opponent removed dice', dice);
    });

    socket.on('calculate score', (dice) => {
        const scores = calculateScores(dice.map(d => d.value));
        socket.emit('update scorecard', scores);
    });

    socket.on('lock score', (category, score) => {
        if (!scorecards[socket.id][category].locked) {
            scorecards[socket.id][category].value = score;
            scorecards[socket.id][category].locked = true;
            socket.emit('score locked', category, score);
            socket.broadcast.emit('opponent locked score', socket.id, category, score);
        }

        // END OF TURN
        rollCounters[socket.id] = 0;
        currentTurn = (currentTurn + 1) % players.length;
        io.to(players[currentTurn]).emit('your turn');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');

        players = players.filter(player => player !== socket.id);
        delete rollCounters[socket.id];
        delete scorecards[socket.id];
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

function calculateScores(roll) {
    const scores = {
        ones: roll.filter(die => die === 1).reduce((sum, die) => sum + die, 0),
        twos: roll.filter(die => die === 2).reduce((sum, die) => sum + die, 0),
        threes: roll.filter(die => die === 3).reduce((sum, die) => sum + die, 0),
        fours: roll.filter(die => die === 4).reduce((sum, die) => sum + die, 0),
        fives: roll.filter(die => die === 5).reduce((sum, die) => sum + die, 0),
        sixes: roll.filter(die => die === 6).reduce((sum, die) => sum + die, 0),
        threeOfAKind: roll.reduce((sum, die) => sum + die, 0),
        fourOfAKind: roll.reduce((sum, die) => sum + die, 0),
        fullHouse: 25,
        smallStraight: 30,
        largeStraight: 40,
        yahtzee: 50,
        chance: roll.reduce((sum, die) => sum + die, 0),
    };

    return scores;
}

function initializeScorecard() {
    return {
        ones: { value: 0, locked: false },
        twos: { value: 0, locked: false },
        threes: { value: 0, locked: false },
        fours: { value: 0, locked: false },
        fives: { value: 0, locked: false },
        sixes: { value: 0, locked: false },
        threeOfAKind: { value: 0, locked: false },
        fourOfAKind: { value: 0, locked: false },
        fullHouse: { value: 0, locked: false },
        smallStraight: { value: 0, locked: false },
        largeStraight: { value: 0, locked: false },
        yahtzee: { value: 0, locked: false },
        chance: { value: 0, locked: false },
    };
}

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

