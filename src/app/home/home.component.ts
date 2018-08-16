import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  fundLoading: boolean = false;
  tradingAiLoading: boolean = false;
  fundJoined: boolean = false;
  tradingAiJoined: boolean = false;
  waitingListForm: FormGroup;
  emailRegex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  constructor(public auth: AuthService, fb: FormBuilder, public http: HttpClient) {
    auth.handleAuthentication();
    this.waitingListForm = fb.group({
      'email': [null, Validators.compose([Validators.required, Validators.pattern(this.emailRegex)])]
    });
  }

  ngOnInit() {
  }

  joinWaitingList(list) {

    if(list === '2549986') this.tradingAiLoading = true;
    if(list === '2549987') this.fundLoading = true;

    this.http.post('', {
      email: this.waitingListForm.value.email,
      list: list
    }).subscribe((data) => {
      if(list === 'trading-ai') {
        this.tradingAiLoading = false;
        this.tradingAiJoined = true;
      }
      if(list === 'fund') {
        this.fundLoading = false;
        this.fundJoined = true;
      }
    }, (error) => {
      console.log(error);
      if(list === 'trading-ai') this.tradingAiLoading = false;
      if(list === 'fund') this.fundLoading = false;
    });
  }

}
