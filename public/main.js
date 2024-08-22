const socket = io();

const messages = document.getElementById('messages');
const container = document.getElementById('diceContainer');

let myTurn = false;
const myDice = [];
const turnDice = [];

socket.on('your turn', () => {
    const li = document.createElement('li');
    li.textContent = '---my turn---';
    messages.appendChild(li);

    document.getElementById('rollButton').disabled = false;
    myTurn = true;
});

socket.on('not your turn', () => {
    myDice = [];
    turnDice = [];

    document.getElementById('rollButton').disabled = true;
    document.getElementById('diceContainer').innerHTML = '';
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn) {
        let offset = myDice.length;
        for (let i = 0; i < turnDice.length; i++) 
            myDice.push({ value: turnDice[i].value, index: offset + i});
        
        console.log('myDice: ', myDice);
        console.log('turnDice: ', turnDice);

        socket.emit('roll dice', myDice);
    }
});

socket.on('rolled', (data) => {
    const li = document.createElement('li');
    li.textContent = 'my roll is: ' + data.roll.toString() + ' (Roll count: ' + data.counter + ')';
    messages.appendChild(li);

    // Handle dice buttons for the client-side display
    container.innerHTML = '';

    data.roll.forEach((value, index) => {
        const button = document.createElement('button');
        button.textContent = value;
        button.className = 'dice-button';

        button.addEventListener('click', () => {
            const dice = { value, index };  // Store both value and index

            const foundIndex = turnDice.findIndex(d => d.index === index && d.value === value);

            if (foundIndex !== -1) {
                turnDice.splice(foundIndex, 1);  // Remove dice if found
                //console.log(`removed dice with value: ${value} at index ${index}`);
            } else {
                turnDice.push(dice);  // Add dice if not found
                //console.log(`added dice with value: ${value} at index ${index}`);
            }

        });

        container.appendChild(button);
    });
});

socket.on('move made', (data) => {
    console.log(`Player ${data.player} made a move:`, data.roll);

    const li = document.createElement('li');
    li.textContent = 'Other player roll is: ' + data.roll.toString();
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



