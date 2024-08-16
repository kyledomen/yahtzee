const socket = io();

const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

let myTurn = false;
let rollCounter = 0;

socket.on('your turn', () => {
    const li = document.createElement('li');
    li.textContent = '---my turn---';
    messages.appendChild(li);

    myTurn = true;
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn) {
        const myRoll = roll_dice();
        rollCounter++;

        const li = document.createElement('li');
        li.textContent = 'my roll is: ' + myRoll.toString();
        messages.appendChild(li);


        // button stuff
        const myDice = [];
        const container = document.getElementById('diceContainer');
        container.innerHTML = '';
        myRoll.forEach(value => {
            const button = document.createElement('button');
            button.textContent = value;
            button.className = 'dice-button';

            button.addEventListener('click', () => {
                if (myDice.includes(value)) {
                    const index = myDice.indexOf(value);
                    myDice.splice(index, 1);
                    console.log(`removed dice with value: ${value}`);
                } else {
                    myDice.push(value);
                    console.log(`added dice with value: ${value}`);
                }
                console.log('myDice: ', myDice);
            });

            container.appendChild(button);

            console.log('test');
        });

        socket.emit('rolled', {roll: myRoll});

        if (rollCounter >= 3) {
            rollCounter = 0;
            myTurn = false;

            const li = document.createElement('li');
            li.textContent = '---turn over---';
            messages.appendChild(li);

            socket.emit('turn over');
        }
    } else {
        console.log('roll invalid');
    }
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



