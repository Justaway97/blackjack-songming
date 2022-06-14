import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { FormComponent } from '../form/form.component';
import { PlayerService } from '../service/player.service';
import { roomUrl } from '../url';
import { result } from './login.component.constant';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends FormComponent {

  override result = result;

  constructor(
    protected override fb: FormBuilder,
    protected playerService: PlayerService,
    private router: Router,
  ) {
    super(fb);
  }

  override postFind(): void {
    const data = {
      username: '',
    }
    this.result = data;
    super.postFind();
  }

  login() {
    if (this.form.value.username !== undefined && this.form.value.username !== '') {
      this.playerService.players[2].username = this.form.value.username;
      this.playerService.players[2].score = 100;
      console.log(this.playerService.players[2]);
      this.router.navigateByUrl(roomUrl);
    }
  }
}
