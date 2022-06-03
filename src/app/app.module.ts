import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { FormComponent } from './form/form.component';
import { BaseComponent } from './base/base.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './input/input.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonComponent } from './button/button.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { RoomComponent } from './room/room.component';

// const config: SocketIoConfig = { url: 'https://blackjack-songming.herokuapp.com/:'.concat(process.env['PORT'] || '4444'), options: {} };
// const config: SocketIoConfig = { url: 'http://localhost/:'.concat(process.env['PORT'] || '4444'), options: {} };

let hostname = window.location.hostname;
let url = (hostname === 'localhost') ? `${window.location.protocol}//${hostname}:8080` : undefined;
const config: SocketIoConfig = { url: url as any, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    FormComponent,
    BaseComponent,
    InputComponent,
    ButtonComponent,
    RoomComponent,
  ],
  imports: [
    SocketIoModule.forRoot(config),
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
