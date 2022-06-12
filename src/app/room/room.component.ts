import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { PlayerService } from '../service/player.service';
import { loginUrl } from '../url';
import { cardUrl, pokemon } from './room.component.constant';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  imageClass = pokemon;
  dealerText = '';
  status: any;
  isPlaying = false;
  dealer: {
    username: string,
    cardPoint: Number,
    card: any[],
    images: any[],
    displayAll: Boolean
  } = {
      username: 'dealer',
      cardPoint: 0,
      card: [],
      images: [],
      displayAll: false,
    }
  timeLeft: number = 0;

  constructor(
    protected player: PlayerService,
    protected socket: Socket,
    protected router: Router,
  ) {
    if (this.player.players[2].username === undefined || this.player.players[2].username === '') {
      this.router.navigateByUrl(loginUrl);
    }
  }

  ngOnInit(): void {
    this.socket.on('getId', (result: any) => {
      this.player.players[2].socketId = result.id
      console.log('Your socket id is', this.player.players[2].socketId)
    })
    this.socket.on('dealCard', (result: any) => {
      const index = this.player.getPlayerIndex(result.id);
      if (index === 2 && result.dealerCard != undefined && result.dealerCard != '') {
        this.dealer.card = this.dealer.card.concat(result.dealerCard)
        this.dealer.images.push(cardUrl[this.dealer.card[0]])
      }
      this.timeLeft = this.getTimeLeft(result.timeout);
      this.player.players[index].card = this.player.players[index].card.concat(result.card[0]);
      this.player.players[index].images.push(cardUrl[this.player.players[index].card[this.player.players[index].card.length - 1]]);
      const card = this.player.players[index].card[this.player.players[index].card.length - 1]
      this.player.players[index].cardPoint += this.player.point[card.substring(0, card.length - 1)]
    })
    this.socket.on('myTurn', (result: any) => {
      this.timeLeft = this.getTimeLeft(result.timeout);
      const index = this.player.getPlayerIndex(result.id);
      if (index !== -1) {
        this.player.players[index].myTurn = true;
        this.dealerText = 'Now is '.concat(this.player.players[index].username as string).concat(' turn')
        setTimeout(() => {
          this.player.players[index].myTurn = false;
        }, result.timeout - new Date().getTime())
      }
    })
    this.socket.on('endGame', (response: any) => {
      if (this.isPlaying === true) {
        this.dealerText = '';
        this.player.resetPlayerTurn();
        this.dealer.card = response.dealerCard
        this.dealer.images = []
        this.dealer.card.forEach((c) => {
          this.dealer.images.push(cardUrl[c])
        })
        this.dealer.displayAll = true;
        this.dealer.cardPoint = response.dealerPoint
        this.timeLeft = this.getTimeLeft(response.timeout);
        this.player.calculatePlayerPoint(2, 0);
        const oldScore: number = this.player.calculateScore(response, 2);
        let status = ''
        if (oldScore > this.player.players[2].score) {
          status = 'You Lose!'
        } else if (oldScore === this.player.players[2].score) {
          status = 'Draw!'
        } else {
          status = 'You Win!'
        }
        setTimeout(() => {
          this.status = status
        }, 1000)
        setTimeout(() => {
          this.resetGame()
        }, response.timeout - new Date().getTime() - 1500)
      }
    })
    this.socket.on('checkNumberOfPlayer', () => {
      console.log('try to join');
      this.tryToJoin();
    })
  }

  resetGame() {
    this.player.resetPlayer();
    this.dealer.card = [];
    this.dealer.cardPoint = 0;
    this.dealer.images = [];
    this.dealer.displayAll = false;
    this.status = null;
    this.isPlaying = false;
  }

  draw() {
    if (this.isMyTurn() && this.canDraw()) {
      const data: any = {
        id: this.player.players[2].socketId
      }
      this.socket.emit('deal', data);
    }
  }

  ngAfterViewInit() {
    setInterval(() => {
      this.timeLeft -= 1;
    }, 1000)
  }

  isMyTurn() {
    return this.player.players[2].card.length >= 2 && this.dealer.card.length >= 2 && this.player.players[2].myTurn;
  }

  endTurn() {
    if (this.player.players[2].myTurn === true) {
      this.player.players[2].myTurn = false;
    }
  }

  tryToJoin() {
    this.socket.emit('join', this.player.players[2], (response: any) => {
      if (response.position !== -1) {
        this.isPlaying = true;
        for (let index = 0, i = 3, serverPlayerIndex = response.position + 1; index < 4; index++, i++, serverPlayerIndex++) {
          if (serverPlayerIndex > 4) {
            serverPlayerIndex = 0;
          }
          if (i > 4) {
            i = 0;
          }
          if (Object.keys(response.players[serverPlayerIndex]).length !== 0 && response.players[serverPlayerIndex] !== undefined) {
            this.player.players[i].username = response.players[serverPlayerIndex].username;
            this.player.players[i].socketId = response.players[serverPlayerIndex].id;
          }
        }
      }

      //   1 -> 3 , 2 -> 4, 3 -> 5, 4 -> 1, 5 -> 2
      // last 2 move to front
      //   2 -> 3 , 3 -> 4, 4 -> 5, 5 -> 1, 1 -> 2
      // last 1 move to front
      //   3 -> 3 , 4 -> 4, 5 -> 5, 1 -> 1, 2 -> 2
      // no move
      //   4 -> 3 , 5 -> 4, 1 -> 5, 2 -> 1, 3 -> 2
      // first 1 move to back
      //   5 -> 3 , 1 -> 4, 2 -> 5, 3 -> 1, 4 -> 2
      // first 2 move to back
    })
  }

  canDraw() {
    if (this.player.players[2].card.length === 5) {
      return false;
    }
    if (this.player.players[2].cardPoint >= 21) {
      return false;
    }
    return true;
  }

  getUsername() {
    return this.player.players[2].username;
  }

  getScore() {
    return this.player.players[2].score;
  }

  getCard() {
    let card = ''
    this.player.players[2].card.forEach((c, index) => {
      card += c
      if (index < this.player.players[2].card.length - 1) {
        card += ', '
      }
    })
    return card
  }

  getCardPoint() {
    return this.player.players[2].cardPoint;
  }

  getDealerCardPoint() {
    return this.dealer.cardPoint;
  }

  getDealerImage(index: any) {
    if (this.dealer.images.length > index) {
      if (index === 1 && !this.dealer.displayAll) {
        return cardUrl.original;
      }
      return this.dealer.images[index];
    }
    return null;
  }

  getPlayerImage(playerIndex: any, cardIndex: any) {
    if (this.player.players[playerIndex].images[cardIndex]) {
      if (playerIndex !== 2 && !this.dealer.displayAll) {
        return cardUrl.original;
      }
      return this.player.players[playerIndex].images[cardIndex];
    }
    return null;
  }

  getTimeLeft(timeout: any) {
    return Math.floor(((timeout - new Date().getTime()) % (1000 * 60)) / 1000);
  }

  getPlayerName(index: any) {
    return this.player.players[index].username;
  }

}
