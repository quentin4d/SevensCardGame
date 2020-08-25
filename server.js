const express = require("express"); 
const monk = require('monk');
const cors = require('cors');
const app = express(); 
const port = process.env.PORT || 5000; 
app.use(cors()); 
app.use(express.json());

const http = require('http');
const socketio = require('socket.io');

const server = http.createServer(app);
const io = socketio(server);

server.listen(port);

var deckStructure = []; 
for(let i = 0; i < 54; i++){
    deckStructure[i] = i;
}

var userArray = [];
var socketArray = [];
var handSizes = [];
var lastRemoved = undefined;
var prevIndex = 0;
var pointsArray = []
var userHands = []
var dealt = false; 
io.on('connect', (socket) => {
    //console.log("new Connection: "+socket.id);
    socket.emit('msg', 'welcome');
    socket.on('user', (username) => {
        if(!dealt){
            //if user reloads page
            console.log("User Connected: "+username);
            if(username == lastRemoved){     //keeps order of players
                userArray.splice(prevIndex, 0, username);
                socketArray.splice(prevIndex, 0, socket.id);
                if(userHands.length != 0) {//deal button stays hidden
                    io.to(socketArray[prevIndex]).emit('deal', userHands[prevIndex]);
                }
            }else{ 
                userArray.push(username); 
                socketArray.push(socket.id);  
            }
            io.emit('otherUsers', userArray);
            //console.log('userarray: '+userArray);  
            socket.on('disconnect', () => { 
                console.log('User disconnected: '+username);
                lastRemoved = username;
                prevIndex = userArray.indexOf(username);  
                userArray.splice(prevIndex, 1); 
                socketArray.splice(prevIndex, 1);  
                if(userArray.length == 0){
                    dealt = false; 
                    userArray = [];
                    userHands = []; 
                    socketArray = []; 
                    pointsArray = [];
                    io.emit('gameReset'); 
                }
                io.emit('otherUsers', userArray);
            })
        }else{
            io.to(socket.id).emit('tooLate'); 
        }
    });
    socket.on('player1', (user) => {
        var startingIndex = userArray.indexOf(user);
        socket.broadcast.emit('notYourTurn', user); //broadcasts that it is user's turn
        io.to(socketArray[startingIndex]).emit('yourTurn');
    });
    socket.on('turnOver', (user, cardID, structIndex, cardDropped) => {//user just played cardID
        const currentIndex = userArray.indexOf(user);
        if(cardID != null && structIndex != null && cardDropped != null){
            userHands[currentIndex].splice(userHands[currentIndex].indexOf(structIndex), 1); 
            socket.broadcast.emit('cardPlaced', cardID, cardDropped);//shows new move to all players
            handSizes[userArray.indexOf(user)]--;  
        }
        var nextPlayerIndex = (currentIndex + 1)%userArray.length; 
        //console.log('placed card: '+cardID+' '+structIndex);
        //console.log(userHands);
        if(!handSizes.includes(0))
            io.to(socketArray[nextPlayerIndex]).emit('yourTurn');
        io.emit('handSizes', handSizes);   
    });
    socket.on('notYourTurn', () => {
        //console.log(userArray[socketArray.indexOf(socket.id)]);
        socket.broadcast.emit('notYourTurn', userArray[socketArray.indexOf(socket.id)]);
    }); 
    socket.on('deal', () => {
        dealt = true;
        handSizes = new Array(socketArray.length); 
        pointsArray = new Array(socketArray.length);
        userHands = deal(socketArray.length); 
        for(let i = 0; i < socketArray.length; i++){
            io.to(socketArray[i]).emit('deal', userHands[i]);
        }
        //console.log(userHands);
    });
    socket.on('numCards', (numCards) => {
        handSizes[socketArray.indexOf(socket.id)] = numCards;
        if(!handSizes.includes(undefined)){
            io.emit('handSizes', handSizes);
        }
    })

    socket.on('askForCard', (user) => {  
        const currentIndex = userArray.indexOf(user); 
        io.to(socketArray[(currentIndex+(socketArray.length-1))%socketArray.length]).emit('giveCard', user);
    });

    socket.on('receiveCard', (card, structIndex, color, bgdColor, user) => { //receive card from user
        const currentIndex = userArray.indexOf(user); //index of giver
        io.to(socketArray[(currentIndex+1)%socketArray.length]).emit('cardReceived', card, color, bgdColor);
        console.log('structind: '+structIndex);
        console.log(userHands[currentIndex]); 
        userHands[currentIndex].splice(userHands[currentIndex].indexOf(structIndex), 1);
        console.log(userHands[currentIndex]);
        userHands[(currentIndex+1)%userHands.length].push(structIndex);
        handSizes[currentIndex]--; 
        handSizes[(currentIndex+1)%userHands.length]++;    
        //console.log(userHands);
        io.emit('handSizes', handSizes);      
    });
 
    socket.on('jokerPlaced', (jokerCardText, structIndex) => {
        console.log('server side joker placed: '+jokerCardText+" "+structIndex);
        console.log(userHands);
        for(let i = 0; i < userHands.length; i++){
            if(userHands[i].includes(structIndex)){
                console.log(userArray[i]+' has the joker'); 
                io.to(socketArray[i]).emit('jokerPlaced', jokerCardText); 
            }
        }
    });

    socket.on('gameOver', (winner) => {
        dealt = false;
        socket.broadcast.emit('gameOver', winner); 
        pointsArray[userArray.indexOf(winner)] = 0; 
    });

    socket.on('pointsLeft', (points, user) => {
        pointsArray[userArray.indexOf(user)] = points;
        console.log('pointsarray: '+pointsArray);
        if(!pointsArray.includes(undefined)){
            console.log('points array not empty: '+pointsArray);
            io.emit('gameSummary', pointsArray);
            userArray = [];
            userHands = []; 
            socketArray = []; 
            pointsArray = [];
        }
    }); 

    socket.on('disconnect', () => {
        console.log('User disconnected: '+socket.id);
    });
});

//shuffles structure and partitions deck into numPlayers hands
function deal(numPlayers){ 
    // //Durstenfeld algorithm
    for(let i = deckStructure.length-1; i > 0; i--){
        const j = Math.floor(Math.random()*(i+1));
        var temp = deckStructure[i];
        deckStructure[i] = deckStructure[j]; 
        deckStructure[j] = temp; 
        // [deckStructure[i], deckStructure[j]] = [deckStructure[j], deckStructure[i]];
    }
    var hands = new Array(numPlayers);
    var remainder = 54%hands.length; //#cards (1-3) remainder
    var evenly = 54-remainder; //#cards evenly distributed
    for(let i = 0; i < hands.length; i ++){
        hands[i] = deckStructure.slice((i/hands.length)*evenly, ((i+1)/hands.length)*evenly);
    }
    for(let i = 0; i < remainder; i++){
        hands[i].push(deckStructure[evenly+i]);
    }
    //console.log(hands);
    return hands; 
}

app.get('/', (req,res) => {
    res.sendFile(__dirname+'/public/init.html');
})

app.get('/game', (req,res) => {
    res.sendFile(__dirname+'/public/index.html');
})

const db = monk('localhost/Sevens'); 
db.then(()=>{
    console.log("CONNECTED CORRECTLY TO SERVER");
});

const userInfo = db.get('userInfo');
//userInfo.drop();

app.use(express.static('public')); 
app.use(express.json({limit: '1mb'}));

app.post('/userInfo', (req,res) => {
    userInfo.drop();
    console.log("REQBODY: "+req.body);
    userInfo.insert(req.body)
    .then(info => {
        console.log("INFO: "+info)
        res.json(info);
    });
});


app.get('/userInfo', (req,res) => {
    userInfo.find().then(users => {
        res.json(users);
        
    }); 
    
});


