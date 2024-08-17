const socket = io();

const messages = document.getElementById('messages');
const container = document.getElementById('diceContainer');

let myTurn = false;

socket.on('your turn', () => {
    const li = document.createElement('li');
    li.textContent = '---my turn---';
    messages.appendChild(li);

    myTurn = true;
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn)
        socket.emit('roll dice');
});

socket.on('rolled', (data) => {
    const li = document.createElement('li');
    li.textContent = 'my roll is: ' + data.roll.toString() + ' (Roll count: ' + data.counter + ')';
    messages.appendChild(li);

    // Handle dice buttons for the client-side display
    container.innerHTML = '';
    const myDice = [];

    data.roll.forEach((value, index) => {
        const button = document.createElement('button');
        button.textContent = value;
        button.className = 'dice-button';

        button.addEventListener('click', () => {
            const dice = { value, index };  // Store both value and index

            const foundIndex = myDice.findIndex(d => d.index === index && d.value === value);

            if (foundIndex !== -1) {
                myDice.splice(foundIndex, 1);  // Remove dice if found
                console.log(`removed dice with value: ${value} at index ${index}`);
            } else {
                myDice.push(dice);  // Add dice if not found
                console.log(`added dice with value: ${value} at index ${index}`);
            }

            console.log('myDice: ', myDice);
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



