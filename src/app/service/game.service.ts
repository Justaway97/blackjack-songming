import { Injectable } from '@angular/core';
import { cloneDeep, shuffle } from 'lodash';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  point = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
  numOfPlayer = 0;

  constructor(protected socket: Socket) {
  }

}
