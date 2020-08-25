
const layout = document.getElementById('cardLayout');
const sevSpade = document.getElementById('sevenspade');
var rect = sevSpade.getBoundingClientRect();
highlight(sevSpade);



const suits = document.getElementsByClassName('suitRow');
const cardLayoutArray = Array.from(suits);
const deck = [];
const jokerSymbol = document.getElementById('joker').innerText; 

function cardStyle(card, text){
    card.innerText = text; 
    card.style.height = '70px'; 
    card.style.width = '50px'; 
    card.style.display = 'inline-block'; 
    card.style.textAlign = 'center'; 
    card.style.margin = '5x'; 
    card.style.verticalAlign = 'top'; 
    card.style.backgroundColor = 'rgb(240, 236, 236)';
}

for (let i = 0; i < 2; i++) {
    const joker = document.createElement('div');
    cardStyle(joker, jokerSymbol); 
    joker.style.fontSize = '70px';
    joker.style.lineHeight = '62px';
    joker.style.backgroundColor = 'rgb(240, 236, 236)';
    joker.style.color = (i == 1) ? 'black' : 'red';
    deck.push(joker);
}

for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
        const handCard = document.createElement('div');
        cardStyle(handCard, cardLayoutArray[i].children[j].innerText); 
        handCard.style.color = (i == 0 || i == 2) ? 'black' : 'red';
        handCard.style.lineHeight = '70px';
        deck.push(handCard);
    }
}

function hide(element){
    element.style.display = 'none';
}

function highlight(card){
    card.style.boxShadow = '0 0 0 3px rgb(20, 255, 20)'; 
    card.style.opacity = '0.4';
}

var lastCardPlaced = null; //keeps track of the last card placed to be highlighted (background) green
 
function placeCard(cardID, cardDropped) { 
    if (cardID == 'sevenspade' && sevSpade.style.opacity == '0.4') {
        lastCardPlaced = document.getElementById(cardID); 
        lastCardPlaced.style.backgroundColor = 'rgb(108, 235, 108)';
        highlight(document.getElementById('sevenheart')); 
        highlight(document.getElementById('sevenclub'));
        highlight(document.getElementById('sevendiamond'));
    }
    getAvailableMoves(cardID, cardDropped); 
}

var placedOnCard = false;

var yourTurn = false;

var spadeUpperBound = 6; //index of seven
var spadeLowerBound = 6;

var playedCards = [];

// var jokerOn = null;

function cardPlaced(cardID) {
    placedOnCard = true;
    const card = document.getElementById(cardID);
    if (yourTurn && dragging) {
        var structIndexOfCardPlaced = 0;
        var correctlyPlaced = false; 
        for (let j = 0; j < handStruct.length; j++) {
            if (deck[handStruct[j]].innerText == cardBeingDragged.innerText) {
                structIndexOfCardPlaced = handStruct[j];
            }
        } 
        //if card in cardlayout is available and the dragged card matches or is a joker
        if (card.style.opacity == '0.4' && (cardBeingDragged.innerText == card.innerText || cardBeingDragged.innerText == jokerSymbol)) {
            if (cardBeingDragged.innerText == jokerSymbol && card.className == 'sev') {
                yourTurn = true;
            } else {
                correctlyPlaced = true;
                hide(document.getElementById('ask'));
                placeCard(cardID, cardBeingDragged.innerText);
                socket.emit('turnOver', username, cardID, structIndexOfCardPlaced, cardBeingDragged.innerText);
                yourTurn = false;
            }
        } else {
            yourTurn = true;
        } 
        for (let i = 0; i < hand.length; i++) {
            if (hand[i].innerText == cardBeingDragged.innerText) {
                if (!correctlyPlaced) {
                    hand[i].style.display = 'inline-block';
                }
            }
            if (correctlyPlaced) {
                hand[i].onmousedown = null;
            }
        }
        if(correctlyPlaced){
            playedCards.push(card.innerText);
            if(playedCards.length == hand.length){
               gameOver();
            }
        }
        hide(cardBeingDragged);
        dragging = false;
    }
}


function findStructIndex(cardText){
    for(let i = 0; i < deck.length; i++){
        if(deck[i].innerText == cardText){ 
            return i; 
        }
    }
}

var jokerCards = [];

function getAvailableMoves(cardID, cardDropped) { //get allowable moves
    lastCardPlaced.style.backgroundColor = 'rgb(240, 236, 236)';
    lastCardPlaced = document.getElementById(cardID); 
    lastCardPlaced.style.backgroundColor = 'rgb(108, 235, 108)'; //green background on latest card
    for (let i = 0; i < cardLayoutArray.length; i++) {
        for (let j = 0; j < cardLayoutArray[i].children.length; j++) {
            const currentCard = cardLayoutArray[i].children[j];
            const leftCard = cardLayoutArray[i].children[j - 1];
            const rightCard = cardLayoutArray[i].children[j + 1];
            const suitArray = Array.from(cardLayoutArray[i].children); 
            if (currentCard.id == cardID) {
                if (i == 0) { //change spade boundaries
                    if (suitArray.indexOf(currentCard) > spadeUpperBound) {
                        spadeUpperBound++;
                    }
                    if (suitArray.indexOf(currentCard) < spadeLowerBound) {
                        spadeLowerBound--;
                    } 
                }
                if (cardDropped == jokerSymbol) {
                    if(yourTurn){
                        jokerCards.push(currentCard.innerText);
                        socket.emit('jokerPlaced', currentCard.innerText, findStructIndex(currentCard.innerText));
                    }
                    currentCard.style.color = document.getElementById(cardID).style.color;
                    currentCard.style.fontSize = '70px';
                    currentCard.style.verticalAlign = 'top';
                    currentCard.style.lineHeight = '62px';
                    currentCard.innerText = cardDropped;
                }
                currentCard.style.border = '2px solid white';
                currentCard.style.opacity = '1';
                currentCard.style.boxShadow = 'none';
                if (i == 0) { //spade is trump
                    if (j != 0) {
                        for (let k = 0; k < 4; k++) {
                            var columnCard = cardLayoutArray[k].children[j];
                            if (columnCard.style.opacity != '1' && (cardLayoutArray[k].children[j - 1].style.opacity == '1')) {
                                highlight(columnCard);
                            }
                        }
                        if (leftCard.style.opacity != '1') {
                            highlight(leftCard);
                        }
                    }
                    if (j != 12) {
                        for (let k = 0; k < 4; k++) {
                            var columnCard = cardLayoutArray[k].children[j];
                            if (columnCard.style.opacity != '1' && (cardLayoutArray[k].children[j + 1].style.opacity == '1')) {
                                highlight(columnCard);
                            }
                        }
                        if (rightCard.style.opacity != '1') {
                            highlight(rightCard);
                        }
                    }
                }else {
                    if (j != 0 && leftCard.style.opacity != '1' && (suitArray.indexOf(leftCard) >= spadeLowerBound)) {
                        highlight(leftCard);
                    }
                    if (j != 12 && rightCard.style.opacity != '1' && (suitArray.indexOf(rightCard) <= spadeUpperBound)) {
                        highlight(rightCard);
                    }
                }
            }
        }

    }
}


var socket = io();

   

//get user from URL 
const userInput = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
const username = userInput.username;

document.getElementById('welcome').innerText += ": " + username;

socket.on('msg', (msg) => {
    console.log(msg);
})

var hand = [];


var opponents = document.getElementById('opponents');//OPPONENTS


socket.emit('user', username);

socket.on('tooLate', () => {
    document.getElementById('tooLateWindow').style.display = 'inline-block'; 
});

function backToLogin(){
    hide(document.getElementById('tooLateWindow'));
    window.location.href = window.location.origin;
}

socket.on('otherUsers', (userArray) => {//display other users
    const x = {
        user: username
    }
    fetch('/userInfo', {
        method: 'POST', 
        body: JSON.stringify(x), 
        headers: {
            'Content-type': 'application/json'
        }
    }).then(res => res.json())
    .then(result => console.log(result));
    while (opponents.firstChild) {
        opponents.removeChild(opponents.firstChild);
    }
    for (let i = 0; i < userArray.length; i++) {
        var newPlayer = document.createElement('div'); 
        newPlayer.style.fontSize = '24px';
        newPlayer.innerText = userArray[i];
        opponents.appendChild(newPlayer); 
    }
}); 
  
socket.on('handSizes', (handSizes) => {
    //console.log(opponents);
    for(let i = 0; i < handSizes.length; i++){
        const numCards = document.createElement('p'); 
        numCards.innerText = handSizes[i]+' cards';
        numCards.style.fontSize = '14px';
        numCards.style.marginTop = '0';
        if(opponents.children[i].childNodes[1] != null)
            opponents.children[i].replaceChild(numCards, opponents.children[i].childNodes[1]); 
        else 
            opponents.children[i].appendChild(numCards);
    }
});

function deal() {
    socket.emit('deal'); 
    hide(document.getElementById('dealButton'));  
} 

var handStruct = [];
var userHandDiv = document.getElementById('userHand'); 

socket.on('deal', (handStructure) => {
    handStruct = handStructure;
    hide(document.getElementById('dealButton'));
    gameInProgress = true;
    for (let i = 0; i < deck.length; i++) {
        deck[i].style.display = 'inline-block';
        deck[i].style.backgroundColor = 'rgb(240,236,236)';
        deck[i].style.border = 'none';
        if (handStructure.includes(i)) {
            hand.push(deck[i]);
            if (deck[i].innerText == sevSpade.innerText) {
                socket.emit('player1', username);
            }
            userHandDiv.append(deck[i]);
        }
    }
    socket.emit('numCards', hand.length); 
    //console.log(hand);
});
 

function highlightPlayer(player) {
    for (let i = 0; i < opponents.children.length; i++) {
        if (opponents.children[i].childNodes[0].textContent == player) {
            opponents.children[i].style.boxShadow = '0 0 0 2px rgb(8, 187, 8)';
        } else {
            opponents.children[i].style.boxShadow = 'none';
        }
    }
}

var dragging = false;
var cardBeingDragged = null;

function dragElement(card) {
    card.onmousedown = dragMouseDown;
    var elem = card.cloneNode(true);
    function dragMouseDown(e) {
        placedOnCard = false;
        cardBeingDragged = elem;
        e.preventDefault();
        e = e || window.event; 
        //document.getElementById('userHand').removeChild(elem);
        document.body.append(elem);
        elem.style.display = 'inline-block';
        elem.style.position = 'absolute';
        elem.style.height = '70px';
        elem.style.width = '50px';
        elem.style.backgroundColor = 'white';
        elem.style.textAlign = 'center';
        elem.style.zIndex = '-1';
        elem.style.top = (e.clientY - 35 + window.scrollY) + 'px';
        elem.style.left = (e.clientX - 25 + window.scrollX) + 'px';
        document.onmouseup = stopDrag;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        hide(card);
        dragging = true;
        e = e || window.event;
        e.preventDefault();
        elem.style.top = (e.clientY - 35 + window.scrollY) + 'px';
        elem.style.left = (e.clientX - 25 + window.scrollX) + 'px';
    }

    function stopDrag(e) {
        document.onmouseup = null;
        document.onmousemove = null;
        dragging = false;
        if (!placedOnCard) {
            hide(elem);
            card.style.display = 'inline-block';
        }
    }
}

socket.on('yourTurn', () => {
    document.getElementById('ask').style.display = 'block';
    yourTurn = true;
    highlightPlayer(username);//'you'
    socket.emit('notYourTurn');
    for (let i = 0; i < hand.length; i++) {
        dragElement(hand[i]);
    }
});


socket.on('notYourTurn', (player) => { //highlights player turn
    highlightPlayer(player);
});

socket.on('cardPlaced', (cardID, cardDropped) => {
    placeCard(cardID, cardDropped); 
});

socket.on('jokerPlaced', (jokerCardText) => {
    for(let i = 0; i < hand.length; i++){
        if(hand[i].innerText == jokerCardText){ 
            //hand[i].style.boxShadow = '0 0 0 2px red';
            hand[i].style.backgroundColor = 'rgb(255, 185, 185)';
        }
    }
})


function leave() {
    window.location.href = window.location.origin;
}

var askButton = document.getElementById('ask'); 

function askForCard() {
    for(let i = 0; i < hand.length; i++){
        hand[i].onmousedown = null;
    }
    askButton.style.backgroundColor = 'rgba(255, 255, 255, 0.247)';
    askButton.style.border = '1px solid black';
    socket.emit('askForCard', username);
}
 
socket.on('giveCard', (receiver) => { 
    //console.log('give a card to ' + receiver); 
    document.getElementById('giveCard').innerText = receiver + ' needs a card';
    document.getElementById('giveCard').style.display = 'block';
    for (let i = 0; i < hand.length; i++) {
        hand[i].style.border = '0.5px solid black';
        hand[i].style.boxShadow = '0 0 0 1px rgb(19, 247, 19)';
        hand[i].addEventListener('click', giveCard);
    }
});

function giveCard(e) {
    hide(document.getElementById('giveCard'));
    //console.log(e.target)
    //console.log("CARD TO GIVE: "+e.target.innerText);
    var card = e.target;
    socket.emit('receiveCard', card.innerText, deck.indexOf(card), e.target.style.color, e.target.style.backgroundColor, username);
    playedCards.push(card.innerText);
    //console.log(playedCards);
    //hand.splice(hand.indexOf(e.target), 1);
    userHandDiv.removeChild(e.target);
    removeEvent();
    if(playedCards.length == hand.length){
        gameOver();
    }
}

function removeEvent() {
    for (let j = 0; j < hand.length; j++) {
        hand[j].style.border = 'none';
        hand[j].style.boxShadow = 'none';
        hand[j].removeEventListener('click', giveCard);
    } 
}

socket.on('cardReceived', (card, color, bgdColor) => {
    askButton.style.border = 'none'; 
    askButton.style.backgroundColor = 'rgba(255, 255, 255, 0.651)';
    hide(askButton);
    var cardReceived = document.createElement('div');
    cardReceived.innerText = card;
    cardReceived.style.color = color; 
    cardReceived.style.backgroundColor = bgdColor; 
    if (card == deck[0].innerText) { 
        cardReceived.style.fontSize = '70px';
        cardReceived.style.lineHeight = '62px';
    }else{
        cardReceived.style.lineHeight = '70px';
    }
    cardReceived.style.boxShadow = '0 0 0 1px red';
    cardReceived.style.verticalAlign = 'top';
    userHandDiv.appendChild(cardReceived);
    hand.push(cardReceived);
    socket.emit('turnOver', username, null, null, null);
})


function gameOver(){
    document.getElementById('gameOverWindow').style.display = 'block';
    document.getElementById('playerWon').innerText = 'You won!';
    socket.emit('gameOver', username); 
}

socket.on('gameOver', (winner) => {
    hide(askButton);
    document.getElementById('gameOverWindow').style.display = 'block';
    document.getElementById('playerWon').innerText = winner+' won!';
    socket.emit('pointsLeft', calculatePoints(), username);
})

function calculatePoints(){
    var points = 0;   
    var leftOver = hand.filter(card => !playedCards.includes(card.innerText)); 
    for(let i = 0; i < leftOver.length; i++){
        const cardNum = leftOver[i].innerText.substring(0, leftOver[i].innerText.length-1); 
        if(leftOver[i].style.backgroundColor == 'rgb(255, 185, 185)'){ //if card joker is on
            points += 50; 
        }else if(leftOver[i].innerHTML == jokerSymbol){ //if joker
            points += 50; 
        }else if(cardNum == 'J' || cardNum == 'Q' || cardNum == 'K' || cardNum == '10'){
            points += 10; 
        }else if(cardNum == 'A'){
            points += 1;
        }else{
            points += parseInt(cardNum);
        }
    }
    return points;  
}

socket.on('gameSummary', (roundPoints) => {
    //const opponents = document.getElementById('opponents').children; 
    const pointSummary = document.getElementById('pointSummary'); 
    var horline = document.createElement('hr');  
    for(let i = 0; i < opponents.children.length; i++){
        var playerScore = document.createElement('p'); 
        playerScore.innerText = opponents.children[i].childNodes[0].textContent+': '+roundPoints[i]+' pts'; 
        // pointSummary.insertBefore(playerScore, horline);
        pointSummary.insertBefore(playerScore, pointSummary.childNodes[0]);
    }  
    pointSummary.insertBefore(horline, pointSummary.childNodes[0]);  
});   

socket.on('gameReset', () => { 
    resetGame();
})

function resetGame(){//reset card layout 
    hide(document.getElementById('gameOverWindow')); 
    while (opponents.firstChild) {
        opponents.removeChild(opponents.firstChild); 
    }    
    hand = []; 
    while(userHandDiv.firstChild){
        userHandDiv.removeChild(userHandDiv.firstChild);
    }  
    for(let i = 0; i < cardLayoutArray.length; i++){ 
        for(let j = 0; j < cardLayoutArray[i].children.length; j++){
            const currentCard = cardLayoutArray[i].children[j];
            if(currentCard.innerText == jokerSymbol){ 
                currentCard.innerText = deck[(i*13)+j+2].innerText; 
                currentCard.style.lineHeight = '69px'; 
            } 
            if(currentCard.innerText == sevSpade.innerText){
                console.log('sevspade');
                highlight(currentCard); 
            }else{
                currentCard.style.opacity = '0.1'; 
                 currentCard.style.boxShadow = 'none'; 
            } 
            currentCard.style.fontSize = 'medium'; 
            currentCard.style.height = '69px'; 
            currentCard.style.width = '49px';
            currentCard.style.border = 'none';
        } 
    }     
    playedCards = [];
    handStruct = []; 
    spadeLowerBound = 6;    
    spadeUpperBound = 6;
    jokerCards = []; 
    socket.emit('user', username);
    document.getElementById('dealButton').style.display = 'inline-block';
}

//SAVE GAME SETUP TO DATABASE TO RETRIEVE ON PAGE RELOAD (USER DISCONNECT/RECONNECT)   





