import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { GameService } from '../service/game.service';
import { PlayerService } from '../service/player.service';
import { cardUrl } from './room.component.constant';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  clientIds: any[] = [];
  status: any;
  result: any[] = [];
  position: number = -1;
  isJoin = false;
  timeout = 0;
  dealer: { username: string, cardPoint: Number, card: any[] } = {
    username: 'dealer',
    cardPoint: 0,
    card: [],
  }
  numberOfRemoveCard = 2;
  timeLeft: number = 0;
  canJoin = true;
  image: any = {
    'P11': cardUrl.original,
    'P12': cardUrl.original,
    'P21': cardUrl.original,
    'P22': cardUrl.original,
    'P31': cardUrl.original,
    'P32': cardUrl.original,
    'P41': cardUrl.original,
    'P42': cardUrl.original,
    'P51': cardUrl.original,
    'P52': cardUrl.original,
    'D1': cardUrl.original,
    'D2': cardUrl.original,
  }

  // const socket = io("ws://localhost:3000");

  constructor(
    protected player: PlayerService,
    protected gameService: GameService,
    protected socket: Socket,
  ) {
    this.socket.emit('getId', (response: any) => {
      this.player.socketId = response.socketId;
      console.log('You socket Id are', response.socketId);
    })
  }

  ngOnInit(): void {
    this.socket.on('dealCard', (result: any) => {
      // console.log('dealCard', result, this.player.socketId)
      if (this.player.socketId === result.id) {
        this.timeout = result.timeout;
        const time = this.timeout - new Date().getTime()
        this.timeLeft = Math.floor((time % (1000 * 60)) / 1000);
        this.player.card = this.player.card.concat(result.card[0]);
        this.image['P3'.concat(this.player.card.length.toString())] = cardUrl[this.player.card[this.player.card.length - 1]]
        this.player.cardPoint = 0;
        this.player.card.forEach(card => {
          this.player.cardPoint += this.gameService.point[this.gameService.cards.indexOf(card.substring(0, card.length - 1))]
        })
        if (result.dealerCard != undefined && result.dealerCard != '') {
          // console.log(result.dealerCard)
          this.dealer.card = this.dealer.card.concat(result.dealerCard)
          this.image.D1 = cardUrl[this.dealer.card[0]]
        }
      }
    })
    this.socket.on('myTurn', (result: any) => {
      // console.log('myTurn', result, this.player.socketId)
      this.timeout = result.timeout;
      const time = this.timeout - new Date().getTime()
      this.timeLeft = Math.floor((time % (1000 * 60)) / 1000);
      if (this.player.socketId === result.id) {
        this.player.myTurn = true;
      } else {
        this.player.myTurn = false;
      }
    })
    this.socket.on('endGame', (response: any) => {
      this.player.myTurn = false
      // console.log('endGame', response)
      this.result = response.players
      this.result.push(...this.result)
      for (let i = this.position - 2; this.position != -1 && i < this.position + 3; i++) {
        if (this.result[i] && this.result[i][0]) {
          this.image[('P'.concat((i - this.position + 3).toString(), '1'))] = cardUrl[this.result[i][0]]
          this.image[('P'.concat((i - this.position + 3).toString(), '2'))] = cardUrl[this.result[i][1]]
        }
      }
      if (response.dealerCard.length > 3) console.log(this.image)
      this.dealer.card = response.dealerCard
      this.dealer.card.forEach((c, index) => {
        this.image[('D'.concat((index + 1).toString()))] = cardUrl[c]
      })
      if (response.dealerCard.length > 3) console.log('songming here', this.image)
      this.dealer.cardPoint = response.dealerPoint
      this.timeout = response.timeout;
      const time = this.timeout - new Date().getTime()
      this.timeLeft = Math.floor((time % (1000 * 60)) / 1000);
      if (this.player.card.length >= 2 && this.dealer.card.length >= 2) {
        this.calculatePlayerPoint();
        const oldScore: number = this.calculateScore(response);
        if (oldScore > this.player.score) {
          this.status = 'You Lose!'
        } else if (oldScore === this.player.score) {
          this.status = 'Draw!'
        } else {
          this.status = 'You Win!'
        }
      }
      setTimeout(() => {
        this.resetGame()
      }, this.timeout - new Date().getTime())
    })
    // this.checkAlive();
  }

  resetGame() {
    this.player.card = []
    this.player.cardPoint = 0;
    this.numberOfRemoveCard = 2;
    this.dealer.card = [];
    this.dealer.cardPoint = 0;
    this.position = -1;
    this.status = null;
    this.image = {
      'P11': cardUrl.original,
      'P12': cardUrl.original,
      'P21': cardUrl.original,
      'P22': cardUrl.original,
      'P31': cardUrl.original,
      'P32': cardUrl.original,
      'P41': cardUrl.original,
      'P42': cardUrl.original,
      'P51': cardUrl.original,
      'P52': cardUrl.original,
      'D1': cardUrl.original,
      'D2': cardUrl.original,
    }
  }

  draw() {
    if (this.isMyTurn() && this.canDraw()) {
      const data: any = {
        id: this.player.socketId
      }
      this.socket.emit('deal', data);
      this.numberOfRemoveCard += 1;
    }
  }

  ngAfterViewInit() {
    setInterval(() => {
      this.timeLeft -= 1;
      if (this.isJoin === false && this.player.card.length === 0 && this.dealer.card.length === 0) {
        this.tryToJoin();
        this.isJoin = true;
      }
    }, 1000)
  }

  calculatePlayerPoint() {
    this.player.myTurn = false;
    if (this.player.cardPoint < 12) {
      this.player.card.forEach(c => {
        if (c.startsWith('A')) {
          if (this.player.cardPoint + 10 <= 21) {
            this.player.cardPoint += 10;
          }
        }
      })
    }
  }

  isMyTurn() {
    return this.player.card.length >= 2 && this.dealer.card.length >= 1 && this.player.myTurn;
  }

  endTurn() {
    if (this.player.myTurn === true) {
      this.player.myTurn = false;
    }
  }

  tryToJoin() {
    this.socket.emit('join', (response: any) => {
      // console.log('there are', response.numOfPlayer, 'in the room');
      // console.log('response1', response);
      this.clientIds = response.players
      this.clientIds.push(...this.clientIds)
      if (this.gameService.numOfPlayer !== -1 && this.gameService.numOfPlayer !== response.numOfPlayer) {
        this.gameService.numOfPlayer = response.numOfPlayer;
      }
      if (this.gameService.numOfPlayer > 5) {
        this.socket.emit('forceDisconnect')
      }
      this.position = response.position + 5
    })
  }

  canDraw() {
    if (this.player.card.length === 5) {
      return false;
    }
    if (this.player.cardPoint >= 21) {
      return false;
    }
    return true;
  }

  calculateScore(dealer: any): number {
    const oldScore = this.player.score
    if (dealer.dealerCard.length === 5 && this.player.card.length < 5) {
      if (dealer.dealerPoint <= 21) {
        this.player.score -= 15;
      } else if (dealer.dealerPoint > 21) {
        this.player.score += 15;
      }
      return oldScore;
    } else if (this.player.card.length === 5 && dealer.dealerCard.length < 5) {
      if (this.player.cardPoint > 21) {
        this.player.score -= 15;
      } else if (this.player.cardPoint <= 21) {
        this.player.score += 15;
      }
      return oldScore;
    } else if (this.player.card.length === 5 && dealer.dealerCard.length === 5) {
      if (this.player.cardPoint > 21 && dealer.dealerPoint > 21) {
        return oldScore;
      } else if (this.player.cardPoint > dealer.dealerPoint) {
        this.player.score += 15;
      } else if (this.player.cardPoint < dealer.dealerPoint) {
        this.player.score -= 15;
      }
      return oldScore;
    }
    if (dealer.dealerPoint <= 21 && this.player.cardPoint <= 21) {
      if (this.player.cardPoint < dealer.dealerPoint) {
        this.player.score -= 10;
      } else if (this.player.cardPoint > dealer.dealerPoint) {
        this.player.score += 10;
      }
    } else if (this.player.cardPoint > 21 && dealer.dealerPoint <= 21) {
      this.player.score -= 10;
    } else if (this.player.cardPoint <= 21 && dealer.dealerPoint > 21) {
      this.player.score += 10;
    }

    if (dealer.dealerCard.length === 2 && dealer.dealerPoint === 21 && this.player.cardPoint !== 21) {
      this.player.score -= 5;
    } else if (this.player.card.length === 2 && this.player.cardPoint === 21 && dealer.dealerPoint !== 21) {
      this.player.score += 5;
    }
    return oldScore;
  }

  getUsername() {
    return this.player.username;
  }

  getScore() {
    return this.player.score;
  }

  getCard() {
    let card = ''
    this.player.card.forEach((c, index) => {
      card += c
      if (index < this.player.card.length - 1) {
        card += ', '
      }
    })
    return card
  }

  getCardPoint() {
    return this.player.cardPoint;
  }

  getDealerCardPoint() {
    return this.dealer.cardPoint;
  }

  getDealerCard() {
    let card = ''
    this.dealer.card.forEach((c, index) => {
      card += c
      if (index < this.dealer.card.length - 1) {
        card += ', '
      }
    })
    return card
  }

}
