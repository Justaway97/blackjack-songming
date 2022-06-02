import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  username: String = '';
  score: number = 0;
  cardPoint: number = 0;
  socketId: String = '';
  card: any[] = [];
  isReady: Boolean = false;
  myTurn: Boolean = false;

  constructor() { }
}
