import { Injectable } from '@angular/core';

export interface player {
  username: String,
  score: number,
  cardPoint: number,
  socketId: String,
  card: any[],
  myTurn: Boolean,
  images: any[],
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  players: player[] = [
    this.initPlayer(),
    this.initPlayer(),
    this.initPlayer(),
    this.initPlayer(),
    this.initPlayer()
  ];

  point: any = {
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
    'K': 10,
  }

  playerIndexMapping: any = {}

  constructor() {
  }

  initPlayer(): player {
    return {
      username: '',
      score: 0,
      cardPoint: 0,
      socketId: '',
      card: [],
      myTurn: false,
      images: [],
    }
  }

  resetMyself(): player {
    return {
      username: this.players[2].username,
      score: this.players[2].score,
      cardPoint: 0,
      socketId: this.players[2].socketId,
      card: [],
      myTurn: false,
      images: [],
    }
  }

  resetPlayer() {
    for (let i = 0; i < this.players.length; i++) {
      if (i !== 2) {
        this.players[i] = this.initPlayer();
      } else {
        this.players[2] = this.resetMyself();
      }
    }
  }

  getPlayerIndex(id: any) {
    return this.players.findIndex(player => player.socketId === id);
  }

  resetPlayerTurn() {
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].myTurn = false;
    }
  }

  calculatePlayerPoint(index: any, cardIndex: any) {
    if (this.players[index].cardPoint < 12) {
      for (let i = cardIndex; i < this.players[index].card.length; i++) {
        if (this.players[index].card[cardIndex].startsWith('A')) {
          if (this.players[index].cardPoint + 10 <= 21) {
            this.players[index].cardPoint += 10;
          }
        }
      }
    }
  }

  calculateScore(dealer: any, index: any): number {
    const oldScore = this.players[index].score
    if (dealer.dealerCard.length === 5 && this.players[index].card.length < 5) {
      if (dealer.dealerPoint <= 21) {
        this.players[index].score -= 15;
      } else if (dealer.dealerPoint > 21) {
        this.players[index].score += 15;
      }
      return oldScore;
    } else if (this.players[index].card.length === 5 && dealer.dealerCard.length < 5) {
      if (this.players[index].cardPoint > 21) {
        this.players[index].score -= 15;
      } else if (this.players[index].cardPoint <= 21) {
        this.players[index].score += 15;
      }
      return oldScore;
    } else if (this.players[index].card.length === 5 && dealer.dealerCard.length === 5) {
      if (this.players[index].cardPoint > 21 && dealer.dealerPoint > 21) {
        return oldScore;
      } else if (this.players[index].cardPoint > dealer.dealerPoint) {
        this.players[index].score += 15;
      } else if (this.players[index].cardPoint < dealer.dealerPoint) {
        this.players[index].score -= 15;
      }
      return oldScore;
    }
    if (dealer.dealerPoint <= 21 && this.players[index].cardPoint <= 21) {
      if (this.players[index].cardPoint < dealer.dealerPoint) {
        this.players[index].score -= 10;
      } else if (this.players[index].cardPoint > dealer.dealerPoint) {
        this.players[index].score += 10;
      }
    } else if (this.players[index].cardPoint > 21 && dealer.dealerPoint <= 21) {
      this.players[index].score -= 10;
    } else if (this.players[index].cardPoint <= 21 && dealer.dealerPoint > 21) {
      this.players[index].score += 10;
    }

    if (dealer.dealerCard.length === 2 && dealer.dealerPoint === 21) {
      if (this.players[index].cardPoint !== 21) {
        this.players[index].score -= 5;
      } else if (this.players[index].card.length > 2 && this.players[index].cardPoint === 21) {
        this.players[index].score -= 15;
      }
    } else if (this.players[index].card.length === 2 && this.players[index].cardPoint === 21) {
      if (dealer.dealerPoint !== 21) {
        this.players[index].score += 5;
      } else if (dealer.dealerCard.length > 2 && dealer.dealerPoint === 21) {
        this.players[index].score += 15;
      }
    }
    return oldScore;
  }

}
