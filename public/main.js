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
});

socket.on('finished rolling', (remainingDice) => {
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

    turnDice = [];


    document.getElementById('rollButton').disabled = true;
    document.getElementById('diceContainer').innerHTML = '';
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn) {
        let offset = myDice.length;
        for (let i = 0; i < turnDice.length; i++) 
            myDice.push({ value: turnDice[i].value, index: offset + i});

        turnDice = [];
        
        console.log('myDice: ', myDice);
        console.log('turnDice: ', turnDice);

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

    data.roll.forEach((value, index) => {
        const button = document.createElement('button');
        button.textContent = value;
        button.className = 'dice-button';

        button.addEventListener('click', () => {
            const dice = { value, index };  // Store both value and index

            const foundIndex = turnDice.findIndex(d => d.index === index && d.value === value);

            if (foundIndex !== -1) {
                turnDice.splice(foundIndex, 1);  // Remove dice if found
            } else {
                turnDice.push(dice);  // Add dice if not found
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



