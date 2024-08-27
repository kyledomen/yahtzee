const socket = io();

const messages = document.getElementById('messagesContainer');
const container = document.getElementById('diceContainer');

let myTurn = false;
let myDice = [];

socket.on('your turn', () => {
    const li = document.createElement('li');
    li.textContent = '---[my turn]---';
    messages.appendChild(li);

    // enable all the buttons for the player
    document.getElementById('rollButton').disabled = false;
    document.querySelectorAll('.score-field').forEach(button => {
        button.disabled = false;
    });

    myTurn = true;
    myDice = [];
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

    // no more rolls, calculate possible scores | END OF TURN
    socket.emit('calculate score', myDice);
    
    document.getElementById('rollButton').disabled = true;
    document.getElementById('diceContainer').innerHTML = '';
});

document.getElementById('rollButton').addEventListener('click', () => {
    if (myTurn) {
        myDice.sort((a, b) => a.value - b.value);

        socket.emit('roll dice', myDice);
    }
});

document.querySelectorAll('.score-field').forEach(field => {
    field.addEventListener('click', function() {
        if (!this.classList.contains('locked') && myTurn) {
            const category = this.id;
            const score = parseInt(this.textContent);
            this.style.color = "red";
            socket.emit('lock score', category, score)

            // END OF TURN
            document.getElementById('rollButton').disabled = true;
            document.querySelectorAll('.score-field').forEach(button => {
                button.disabled = true;
            });
        }
    });
});

socket.on('rolled', (data) => {
    // Combine myDice and data.roll into tempMyDice
    const tempMyDice = [...myDice];
    const offset = myDice.length;

    data.roll.forEach((value, index) => {
        tempMyDice.push({ value, index: offset + index });
    });

    // Put the roll on the webpage
    const li = document.createElement('li');
    li.textContent = 'I rolled: ' + data.roll.toString() + ' (Roll count: ' + data.counter + ')';
    messages.appendChild(li);

    // clear the button from last time
    container.innerHTML = '';

    // Use tempMyDice to populate the buttons
    tempMyDice.forEach((dice) => {
        const button = document.createElement('button');
        button.textContent = dice.value;
        button.className = 'dice-button';

        button.addEventListener('click', () => {
            const foundIndex = myDice.findIndex(d => d.index === dice.index && d.value === dice.value);

            if (foundIndex !== -1) {
                // Dice found, remove the dice from hand
                myDice.splice(foundIndex, 1);
                socket.emit('dice removed', dice);
            } else {
                myDice.push(dice);
                socket.emit('dice added', dice);
            }
        });

        container.appendChild(button);
    });

    socket.emit('calculate score', tempMyDice);
});

socket.on('update scorecard', (scores) => {
    console.log(scores);

    for (const category in scores) {
        const scoreElement = document.getElementById(category);
        
        if (scoreElement && !scoreElement.classList.contains('locked'))
            scoreElement.textContent = scores[category];
    }
});

socket.on('score locked', (category, score) => {
    const scoreElement = document.getElementById(category);
    scoreElement.textContent = score;
    scoreElement.classList.add('locked');
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
