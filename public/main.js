const socket = io();

const messages = document.getElementById('messages');
const container = document.getElementById('diceContainer');

let myTurn = false;
let myDice = [];
let turnDice = [];

socket.on('your turn', () => {
    const li = document.createElement('li');
    li.textContent = '---my turn---';
    messages.appendChild(li);

    document.getElementById('rollButton').disabled = false;
    myTurn = true;

    myDice = [];
    turnDice = [];
});

socket.on('finished rolling', (remainingDice) => {
    // fill in remaining dice on the last roll
    if (myDice.length < 5) {
        let offset = myDice.length;
        for (let i = 0; i < remainingDice.length; i++) {
            myDice.push({ value: remainingDice[i], index: offset + i});
        }
    }

    // print resulting dice on page
    const li = document.createElement('li');
    let str = 'Final dice: ';
    for (let i = 0; i < myDice.length; i++)
        str = str +  String(myDice[i].value) + ', ';
    li.textContent = str;
    messages.appendChild(li);

    // no more rolls, calculate possible scores
    socket.emit('calculate score', myDice);

    document.getElementById('rollButton').disabled = true;
    document.getElementById('diceContainer').innerHTML = '';
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn) {

        // insert the turn dice into the users hand in ascending order
        let offset = myDice.length;
        for (let i = 0; i < turnDice.length; i++) 
            myDice.push({ value: turnDice[i].value, index: offset + i});

        myDice.sort((a, b) => a.value - b.value);

        turnDice = [];
        
        socket.emit('roll dice', myDice);
    }
});

socket.on('rolled', (data) => {
    // put the roll on the webpage
    const li = document.createElement('li');
    li.textContent = 'I rolled: ' + data.roll.toString() + ' (Roll count: ' + data.counter + ')';
    messages.appendChild(li);

    // Handle dice buttons for the client-side display
    container.innerHTML = '';

    myDice.forEach((value, index) => {
        const button = document.createElement('button');
        button.textContent = value;
        button.className = 'dice-button';

        button.addEventListener('click', () => {
            const dice = { value, index };

            const foundIndex = turnDice.findIndex(d => d.index === index && d.value === value);

            if (foundIndex !== -1) {
                // dice found, remove the dice from hand
                turnDice.splice(foundIndex, 1);
                socket.emit('dice removed', dice);
            } else {
                turnDice.push(dice);
                socket.emit('dice added', dice);
            }

        });

        container.appendChild(button);
    });
});

socket.on('opponent rolled', (data) => {
    console.log(`Player ${data.player} rolled:`, data.roll);

    const li = document.createElement('li');
    li.textContent = 'Other player roll is: ' + data.roll.toString();
    messages.appendChild(li);
});

socket.on('opponent added dice', (dice) => {
    const li = document.createElement('li');
    li.textContent = 'Other player added dice to their hand: ' + dice.value.toString();
    messages.appendChild(li);
});

socket.on('opponent removed dice', (dice) => {
    const li = document.createElement('li');
    li.textContent = 'Other player removed dice from their hand: ' + dice.value.toString();
    messages.appendChild(li);
});

function roll_dice() {
    const randomIntegers = [];

    for (let i = 0; i < 5; i++) {
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        randomIntegers.push(randomNumber);
    }

    return randomIntegers;
}



