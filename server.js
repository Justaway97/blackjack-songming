const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(__dirname + '/dist/blackjack-songming'));
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname +
        '/dist/blackjack-songming/index.html'));
});
const http = require('http').Server(app);
var cors = require('cors');
app.use(cors());
const io = require('socket.io')(http, {
    cors: {
        origin: "*", credentials: true
    }
});

let players = [initPlayer(), initPlayer(), initPlayer(), initPlayer(), initPlayer()]
let lastMatchTable = [initPlayer(), initPlayer(), initPlayer(), initPlayer(), initPlayer()]
let isPlaying = false
let dealer = {
    username: 'dealer',
    cardPoint: 0,
    card: [],
}
let ableToJoin = true

const points = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10
}
const baseCard = [
    'AS', 'AH', 'AC', 'AD', '2S', '2H', '2C', '2D', '3S', '3H', '3C', '3D',
    '4S', '4H', '4C', '4D', '5S', '5H', '5C', '5D', '6S', '6H', '6C', '6D',
    '7S', '7H', '7C', '7D', '8S', '8H', '8C', '8D', '9S', '9H', '9C', '9D',
    '10S', '10H', '10C', '10D', 'JS', 'JH', 'JC', 'JD', 'QS', 'QH', 'QC', 'QD',
    'KS', 'KH', 'KC', 'KD'
]
const playingCards = [
    'AS', 'AH', 'AC', 'AD', '2S', '2H', '2C', '2D', '3S', '3H', '3C', '3D',
    '4S', '4H', '4C', '4D', '5S', '5H', '5C', '5D', '6S', '6H', '6C', '6D',
    '7S', '7H', '7C', '7D', '8S', '8H', '8C', '8D', '9S', '9H', '9C', '9D',
    '10S', '10H', '10C', '10D', 'JS', 'JH', 'JC', 'JD', 'QS', 'QH', 'QC', 'QD',
    'KS', 'KH', 'KC', 'KD'
]

function initPlayer() {
    return {
        username: '',
        // score: 0,
        card: [],
        id: '',
        alive: 0,
    }
}

function resetGame() {
    for (let i = 0; i < players.length; i++) {
        players[i] = initPlayer()
    }
    dealer.card = []
    dealer.cardPoint = 0
}

function shuffleArray(array) {
    for (var j = 0; j < 1; j++) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

function updateDealerPoint(index) {
    for (let i = index; i < dealer.card.length; i++) {
        if (dealer.card[i].startsWith('A') && dealer.cardPoint < 12) {
            dealer.cardPoint += 10
        }
    }
}

function deal(data) {
    const card = playingCards.splice(0, 1);
    dealCard(card, data.id, true);
}

function dealerDraw() {
    const card = playingCards.splice(0, 1);
    dealer.card = dealer.card.concat(card[0]);
    dealer.cardPoint += points[card[0].substring(0, card[0].length - 1)];
}

function dealCard(card, id, isPlayerDraw) {
    const index = players.findIndex(player => player.id == id)
    players[index].alive = new Date().getTime() + 5000
    players[index].card = players[index].card.concat(card)
    io.emit('dealCard', {
        timeout: players[index].alive,
        id: id,
        card: card,
        dealerCard: isPlayerDraw ? undefined : dealer.card[dealer.card.length - 1]
    });
    console.log('successfully distribute', card, 'card to', id);
}

function dealerTurn() {
    console.log("Now is dealer turn");
    updateDealerPoint(0);
    while (dealer.cardPoint < 16 && dealer.card.length < 5) {
        dealerDraw();
        updateDealerPoint(dealer.card.length - 1);
    }
    timeout = new Date().getTime() + 5000
    for (let i = 0; i < players.length; i++) {
        if (players[i].username != '') {
            console.log('Player', players[i].username, 'has', players[i].card)
        }
    }
    io.emit('endGame', {
        dealerPoint: dealer.cardPoint,
        dealerCard: dealer.card,
        players: players,
        timeout: timeout,
    })
    resetGame();
    setTimeout(function () {
        isPlaying = false;
        ableToJoin = true;
        io.emit('checkNumberOfPlayer')
    }, timeout - new Date().getTime() + 1000)
}

function newGame() {
    console.log('')
    console.log('')
    console.log('new Game')
    for (let i = 0; i < players.length; i++) {
        players[i].alive = 0
    }
    if (playingCards.length < 15) {
        for (let i = 0; i < baseCard.length; i++) {
            playingCards[i] = baseCard[i];
        }
    }
    let numberOfPlayer = 0
    for (let i = 0; i < players.length; i++) {
        if (players[i].id != '') {
            numberOfPlayer++
        }
    }
    console.log('there are', numberOfPlayer, 'players')
    shuffleArray(playingCards)
    distributeCard()
    distributeCard()
    console.log('dealer card ->', dealer.card)
    selectedPlayer = ''
    let i = 0
    for (; i < players.length; i++) {
        if (players[i].id != '') {
            break;
        }
    }
    if (i < players.length) {
        players[i].alive = new Date().getTime()
        players[i].alive += 5000
        console.log('now is', players[i], 'turn')
        io.emit('myTurn', {
            dealerCard: dealer.card[0],
            timeout: players[i].alive,
            id: players[i].id
        })
    }
    playerTimeOut(i);
}

function playerTimeOut(i) {
    let j = 0
    if (i < players.length) {
        setTimeout(() => {
            if (Math.abs(players[i].alive - new Date().getTime()) > 100) {
                if (players[i].alive < new Date().getTime()) {
                    players[i].alive = new Date().getTime()
                }
                playerTimeOut(i)
                return;
            }
            for (j = i + 1; j < players.length; j++) {
                if (players[j].id != '') {
                    players[j].alive = new Date().getTime() + 5000
                    console.log('now is', players[j].id, 'turn')
                    io.emit('myTurn', {
                        timeout: players[j].alive,
                        id: players[j].id
                    })
                    playerTimeOut(j)
                    return;
                }
            }
            if (j >= players.length) {
                dealerTurn()
            }
        }, players[i].alive - new Date().getTime())
    }
}

function distributeCard() {
    const removeCards = playingCards.splice(0, ((Object.keys(io.engine.clients).length + 1)))
    console.log('remove', removeCards)
    const dealerCards = removeCards.splice(0, 1);
    dealer.card = dealer.card.concat(dealerCards[0]);
    dealer.cardPoint += points[dealerCards[0].substring(0, dealerCards[0].length - 1)];
    for (let i = 0; i < players.length; i++) {
        if (players[i].id != '') {
            dealCard(removeCards.splice(0, 1), players[i].id, false);
        }
    }
}

io.on('connection', socket => {
    socket.emit('getId', { 'id': socket.client.id });
    socket.on("join", (player, callback) => {
        if (ableToJoin == true) {
            ableToJoin = false
            const clientsArray = Object.keys(io.engine.clients);
            for (let i = 0; i < clientsArray.length; i++) {
                if (players.findIndex(p => p.id == clientsArray[i]) == -1) {
                    const lastMatchIndex = lastMatchTable.findIndex(last => last.id == clientsArray[i])
                    if (lastMatchIndex != -1) {
                        players[lastMatchIndex].id = lastMatchTable[lastMatchIndex].id;
                        players[lastMatchIndex].username = lastMatchTable[lastMatchIndex].username;
                    } else {
                        for (let j = 0; j < players.length; j++) {
                            if (players[j].id == '') {
                                players[j].id = clientsArray[i];
                                if (players[j].id === player.socketId) {
                                    players[j].username = player.username[0];
                                }
                                break;
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < players.length; i++) {
                lastMatchTable[i].id = players[i].id
                lastMatchTable[i].username = players[i].username
            }
        }
        callback({
            position: players.findIndex(player => player.id == socket.client.id),
            ableToJoin: !ableToJoin,
            players: players
        });

        setTimeout(function () {
            if (isPlaying == false) {
                isPlaying = true
                newGame()
            }
        }, 3000)
    });

    socket.on('deal', (data) => {
        if (players.findIndex(player => player.id == data.id) != -1) {
            deal(data)
        }
    });

    socket.on('forceDisconnect', () => {
        socket.disconnect();
    });

    console.log(`Socket ${socket.id} has connected`);
    io.emit('checkNumberOfPlayer')
});

http.listen(process.env.PORT || 8080, () => {
    console.log('Listening on port 8080');
});