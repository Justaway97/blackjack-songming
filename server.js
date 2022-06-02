const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(__dirname + '/dist/blackjack-songming'));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname +
        '/dist/blackjack-songming/index.html'));
});
app.listen(process.env.PORT || 8080);
const http = require('http').Server(app);
var cors = require('cors');
app.use(cors());
const io = require('socket.io')(http, { cors: { origin: "*" } });


const table = ['', '', '', '', '']
let tableAlive = [0, 0, 0, 0, 0]
let player = [[], [], [], [], []]
const dealer = {
    point: 0,
    cardPoint: 0,
    cards: []
}
let playing = false

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const points = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
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

function updateDealerPoint() {
    for (let i = 0; i < dealer.cards.length; i++) {
        if (dealer.cards[i].startsWith('A') && dealer.cardPoint < 12) {
            dealer.cardPoint += 10
        }
    }
}

function deal(socket, data) {
    const card = playingCards.splice(0, 1);
    dealCard(socket, card, data.id);
}

function dealerDraw() {
    const card = playingCards.splice(0, 1);
    dealer.cards = dealer.cards.concat(card[0]);
    dealer.cardPoint += points[cards.indexOf(card[0].substring(0, card[0].length - 1))];
}

function dealCard(socket, card, t) {
    const index = table.indexOf(t)
    tableAlive[index] = new Date().getTime() + 5000
    let dealerCard = ''
    if (dealer.cards.length == 1) {
        dealerCard = dealer.cards[0]
    }
    player[index] = player[index].concat(card)
    io.emit('dealCard', {
        timeout: tableAlive[index],
        id: t,
        card: card,
        dealerCard: dealerCard
    });
    console.log('successfully distribute', card, 'card to', t);
}

function dealerTurn(socket, callback) {
    currentPlayer = '';
    console.log("Now is dealer turn");
    updateDealerPoint();
    while (dealer.cardPoint < 16) {
        dealerDraw();
        updateDealerPoint();
    }
    timeout = new Date().getTime() + 5000
    for (let i = 0; i < table.length; i++) {
        if (table[i] != '') {
            console.log('Player', table[i], 'has', player[i])
        }
    }
    io.emit('endGame', {
        dealerPoint: dealer.cardPoint,
        dealerCard: dealer.cards,
        players: player,
        timeout: timeout
    })
    player = [[], [], [], [], []]
    dealer.cards = [];
    dealer.cardPoint = 0;
    playing = false;
    setTimeout(function () {
        newGame(socket, callback)
    }, timeout - new Date().getTime() + 1000)
}

function newGame(socket, callback) {
    console.log('')
    console.log('')
    console.log('new Game')
    playing = true;
    currentPlayer = '';
    tableAlive = [0, 0, 0, 0, 0]
    if (playingCards.length < 15) {
        for (let i = 0; i < baseCard.length; i++) {
            playingCards[i] = baseCard[i];
        }
    }
    console.log('there are', table, 'players')
    shuffleArray(playingCards)
    distributeCard(socket)
    distributeCard(socket)
    console.log('dealer card ->', dealer.cards)
    selectedPlayer = ''
    let i = 0
    for (; i < table.length; i++) {
        if (table[i] != '') {
            break;
        }
    }
    tableAlive[i] = new Date().getTime()
    if (i < table.length) {
        tableAlive[i] += 5000
        console.log('now is', table[i], 'turn')
        io.emit('myTurn', {
            dealerCard: dealer.cards[0],
            timeout: tableAlive[i],
            id: table[i]
        })
    }
    playerTimeOut(i, socket, callback);
}

function playerTimeOut(i, socket, callback) {
    if (i < table.length) {
        setTimeout(function () {
            for (; i < table.length; i++) {
                if (table[i] != '') {
                    if (Math.abs(tableAlive[i] - new Date().getTime()) > 100) {
                        tableAlive[i] = new Date().getTime()
                        i -= 1
                        playerTimeOut(i + 1, socket, callback)
                    } else {
                        let j = i + 1
                        for (; j < table.length - 1; j++) {
                            if (table[j] != '') {
                                timeout = new Date().getTime() + 5000
                                tableAlive[j] = timeout
                                console.log('now is', table[j], 'turn')
                                io.emit('myTurn', {
                                    dealerCard: dealer.cards[0],
                                    timeout: timeout,
                                    id: table[j]
                                })
                                playerTimeOut(j, socket, callback)
                                return;
                            }
                        }
                        timeout = new Date().getTime() + 5000
                        tableAlive[j + 1] = timeout
                        playerTimeOut(j + 1, socket, callback)
                    }
                    return;
                }
            }
        }, tableAlive[i] - new Date().getTime())
    }
    if (i >= table.length) {
        dealerTurn(socket, callback)
    }
}

function distributeCard(socket) {
    let numberOfPlayer = 0
    for (let i = 0; i < table.length; i++) {
        if (table[i] != '') {
            numberOfPlayer += 1
        }
    }
    const removeCards = playingCards.splice(0, ((numberOfPlayer + 1)))
    const dealerCards = removeCards.splice(0, 1);
    dealer.cards = dealer.cards.concat(dealerCards[0]);
    dealer.cardPoint += points[cards.indexOf(dealerCards[0].substring(0, dealerCards[0].length - 1))];
    for (let i = 0; i < table.length; i++) {
        if (table[i] != '') {
            dealCard(socket, removeCards.splice(0, 1), table[i]);
        }
    }
}

io.on('connection', socket => {
    let previousId;
    const safeJoin = currentId => {
        socket.leave(previousId);
        socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
        previousId = currentId;
    }

    socket.on("join", (callback) => {
        let j = -1
        numOfClient = -1
        if (playing == false) {
            const clientsArray = Object.keys(io.engine.clients);
            numOfClient = clientsArray.length
            for (let i = 0; i < clientsArray.length; i++) {
                if (!table.includes(clientsArray[i])) {
                    for (j = 0; j < table.length; j++) {
                        if (table[j] == '') {
                            table[j] = clientsArray[i];
                            break;
                        }
                    }
                }
            }
        }
        callback({
            position: j,
            newGame: !playing,
            numOfPlayer: numOfClient,
            players: table
        });
        if (playing == false) {
            newGame(socket, callback)
        }
    });

    socket.on('getClientList', (callback) => {
        const clientsArray = Object.keys(io.engine.clients);
        for (let i = 0; i < clientsArray.length; i++) {
            if (!table.includes(client)) {
                for (let j = 0; j < table.length; j++) {
                    if (table[j] == '') {
                        table[j] = client;
                        break;
                    }
                }
            }
        }
        callback({
            clients: table
        })
    })

    socket.on('getId', (callback) => {
        callback({
            socketId: socket.client.id
        })
    })

    socket.on('deal', (data) => {
        if (table.indexOf(data.id) != -1) {
            deal(socket, data)
        }
    });

    socket.on('forceDisconnect', () => {
        socket.disconnect();
    });

    console.log(`Socket ${socket.id} has connected`);
});

http.listen(4444, () => {
    console.log('Listening on port 4444');
});