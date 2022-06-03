import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { GameService } from '../service/game.service';
import { PlayerService } from '../service/player.service';
import { loginUrl } from '../url';
import { cardUrl } from './room.component.constant';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  dealerText = '';
  clientIds: any[] = [];
  playerNames: any[] = ['', '', '', '', ''];
  status: any;
  result: any[] = [];
  position: number = -1;
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
    // 'P11': cardUrl.original,
    // 'P12': cardUrl.original,
    // 'P21': cardUrl.original,
    // 'P22': cardUrl.original,
    // 'P31': cardUrl.original,
    // 'P32': cardUrl.original,
    // 'P41': cardUrl.original,
    // 'P42': cardUrl.original,
    // 'P51': cardUrl.original,
    // 'P52': cardUrl.original,
    // 'D1': cardUrl.original,
    // 'D2': cardUrl.original,
  }

  constructor(
    protected player: PlayerService,
    protected gameService: GameService,
    protected socket: Socket,
    protected router: Router,
  ) {
    if (this.player.username === '') {
      this.router.navigateByUrl(loginUrl);
    }
    this.socket.emit('getId', (response: any) => {
      this.player.socketId = response.socketId;
      console.log('You socket Id are', response.socketId);
    })
  }

  ngOnInit(): void {
    this.socket.on('dealCard', (result: any) => {
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
          this.dealer.card = this.dealer.card.concat(result.dealerCard)
          this.image.D1 = cardUrl[this.dealer.card[0]]
          this.image.D2 = cardUrl.original
        }
        this.updatePlayer();
      } else {
        const index = this.clientIds.indexOf(result.id);

      }
    })
    this.socket.on('myTurn', (result: any) => {
      this.timeout = result.timeout;
      const time = this.timeout - new Date().getTime()
      this.timeLeft = Math.floor((time % (1000 * 60)) / 1000);
      if (this.player.socketId === result.id) {
        this.player.myTurn = true;
      } else {
        this.player.myTurn = false;
      }
      this.updatePlayer();
    })
    this.socket.on('endGame', (response: any) => {
      this.dealerText = '';
      this.player.myTurn = false
      this.result = response.players
      const table = response.table
      console.log('clientIds', this.clientIds, cloneDeep(this.image), cloneDeep(table), cloneDeep(this.result))
      for (let i = 0; i < 5; i++) {
        if (this.result[i] && this.result[i][0] && this.clientIds.indexOf(table[i]) !== 2) {
          console.log(('P'.concat((this.clientIds.indexOf(table[i]) + 1).toString(), '1')), table.indexOf(this.clientIds[i]), this.result)
          this.image[('P'.concat((this.clientIds.indexOf(table[i]) + 1).toString(), '1'))] = cardUrl[this.result[i][0]]
          this.image[('P'.concat((this.clientIds.indexOf(table[i]) + 1).toString(), '2'))] = cardUrl[this.result[i][1]]
        }
        // if (this.clientIds.indexOf(response.id) + 1 !== 3) {
        //   this.image['P'.concat((this.clientIds.indexOf(response.id) + 1).toString(), '1')] = cardUrl.original;
        //   this.image['P'.concat((this.clientIds.indexOf(response.id) + 1).toString(), '2')] = cardUrl.original;
        // }
      }
      console.log(this.image, this.result)
      this.dealer.card = response.dealerCard
      this.dealer.card.forEach((c, index) => {
        this.image[('D'.concat((index + 1).toString()))] = cardUrl[c]
      })
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
    this.socket.on('checkNumberOfPlayer', () => {
      console.log('try to join');
      this.tryToJoin();
    })
    this.socket.on('playerUpdate', (response: any) => {
      console.log('songming', this.playerNames, response, this.clientIds, this.clientIds.indexOf(response.id));
      if (response.myTurn === true) {
        this.dealerText = 'Now is '.concat(response.username).concat(' turn')
        console.log(this.dealerText);
      }
      if (this.clientIds.indexOf(response.id) + 1 !== 3) {
        this.playerNames[this.clientIds.indexOf(response.id)] = response.username[0]
        this.image['P'.concat((this.clientIds.indexOf(response.id) + 1).toString(), '1')] = cardUrl.original;
        this.image['P'.concat((this.clientIds.indexOf(response.id) + 1).toString(), '2')] = cardUrl.original;
      }
    })
  }

  resetGame() {
    this.player.card = []
    this.player.cardPoint = 0;
    this.numberOfRemoveCard = 2;
    this.dealer.card = [];
    this.dealer.cardPoint = 0;
    this.position = -1;
    this.status = null;
    this.clientIds = [];
    this.playerNames = ['', '', '', '', ''];
    this.image = {
      // 'P11': cardUrl.original,
      // 'P12': cardUrl.original,
      // 'P21': cardUrl.original,
      // 'P22': cardUrl.original,
      // 'P31': cardUrl.original,
      // 'P32': cardUrl.original,
      // 'P41': cardUrl.original,
      // 'P42': cardUrl.original,
      // 'P51': cardUrl.original,
      // 'P52': cardUrl.original,
      // 'D1': cardUrl.original,
      // 'D2': cardUrl.original,
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
      this.position = response.position;
      console.log('position =', this.position)
      if (response.position < 2) {
        for (let i = response.position + 3; i < 5; i++) {
          this.clientIds.push(response.players[i])
        }
        this.clientIds.push(...response.players)
      } else if (response.position > 2) {
        for (let i = response.position - 3; i < 5; i++) {
          this.clientIds.push(response.players[i])
        }
        for (let i = 0; i < response.position; i++) {
          this.clientIds.push(response.players[i])
        }
      } else if (response.position === 2) {
        this.clientIds.push(...response.players)
      }
      console.log(cloneDeep(this.clientIds))
      if (this.gameService.numOfPlayer !== -1 && this.gameService.numOfPlayer !== response.numOfPlayer) {
        this.gameService.numOfPlayer = response.numOfPlayer;
      }
      if (this.position !== -1) {
        this.updatePlayer()
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

  updatePlayer() {
    this.socket.emit('updatePlayer', this.player.username, this.player.socketId, this.isMyTurn());
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
