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
            socket.broadcast.emit('opponent locked score', {player: socket.id, category: category, score: score});
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
    const counts = {};
    roll.forEach(die => counts[die] = (counts[die] || 0) + 1);

    // Check for three of a kind, four of a kind, and Yahtzee
    let threeOfAKind = 0, fourOfAKind = 0, yahtzee = 0;
    let fullHouse = 0;
    let hasThree = false, hasTwo = false;

    for (const die in counts) {
        if (counts[die] === 3) {
            threeOfAKind = roll.reduce((sum, die) => sum + die, 0);
            hasThree = true;
        } else if (counts[die] === 4) {
            fourOfAKind = roll.reduce((sum, die) => sum + die, 0);
            threeOfAKind = roll.reduce((sum, die) => sum + die, 0); // 4 of a kind implies 3 of a kind
        } else if (counts[die] === 5) {
            yahtzee = 50;
        }

        if (counts[die] === 3) hasThree = true;
        if (counts[die] === 2) hasTwo = true;
    }

    if (hasThree && hasTwo) {
        fullHouse = 25;
    }

    // Check for straights
    const sortedRoll = [...new Set(roll)].sort((a, b) => a - b);
    let smallStraight = 0, largeStraight = 0;

    const straights = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ];

    const largeStraights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
    ];

    straights.forEach(straight => {
        if (straight.every(val => sortedRoll.includes(val))) {
            smallStraight = 30;
        }
    });

    largeStraights.forEach(straight => {
        if (straight.every(val => sortedRoll.includes(val))) {
            largeStraight = 40;
        }
    });

    return {
        threeOfAKind,
        fourOfAKind,
        fullHouse,
        smallStraight,
        largeStraight,
        yahtzee,
        chance: roll.reduce((sum, die) => sum + die, 0),
        ones: counts[1] ? counts[1] * 1 : 0,
        twos: counts[2] ? counts[2] * 2 : 0,
        threes: counts[3] ? counts[3] * 3 : 0,
        fours: counts[4] ? counts[4] * 4 : 0,
        fives: counts[5] ? counts[5] * 5 : 0,
        sixes: counts[6] ? counts[6] * 6 : 0,
    };
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

