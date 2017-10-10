import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AUTH_CONFIG } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  coins: any = [];
  filteredCoins: Observable<string[]>;
  addCoinObject: FormGroup;
  access_token: string;
  profile: Object;
  assets: Array<Object> = [];
  numberMask = createNumberMask({
    prefix: '',
    includeThousandsSeparator: true,
    allowDecimal: true,
    decimalLimit: null
  });
  dollarMask = createNumberMask({
    prefix: '',
    includeThousandsSeparator: true,
    allowDecimal: true
  });

  constructor(public http: HttpClient, fb: FormBuilder) {
    this.addCoinObject = fb.group({
      'coin': [null, Validators.required],
      'amount': [null, Validators.required],
      'cost': [null, Validators.required],
    });
    this.profile = JSON.parse(localStorage.getItem('profile'));
  }

  ngOnInit() {
    console.log(this.profile);
    this.getCoins();
    this.getAccessToken();
  }

  getCoins() {
    this.http.get('https://api.coinmarketcap.com/v1/ticker/').subscribe(data => {
      this.coins = data;
      console.log(this.coins);
      this.filteredCoins = this.addCoinObject.get('coin').valueChanges
        .startWith(null)
        .map(val => val ? this.filterCoins(val) : this.coins.slice());
    });
  }

  getAccessToken() {
    this.http.post(`https://${AUTH_CONFIG.domain}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: 'OfDUv5RjfRqIOZ5tdvxCoHi0rMhIRnvc',
      client_secret: 'epoeo7UuBwGvNf7I7vzL0qvp_Ud139V4khhIdvB8WmFsIQF9DvAVNqNVhaSEv-vF',
      audience: `https://${AUTH_CONFIG.domain}/api/v2/`
    }, {
      headers: new HttpHeaders().set('content-type', 'application/json'),
    }).subscribe((data) => {
      console.log(data);
      this.access_token = data['access_token'];

      this.getAssets();
    });
  }

  getAssets() {
    this.http.get(`https://${AUTH_CONFIG.domain}/api/v2/users/${this.profile['sub']}?fields=user_metadata`, {
      headers: new HttpHeaders().set('content-type', 'application/json').set('authorization', `Bearer ${this.access_token}`)
    }).subscribe((data) => {
      console.log(data);
      if(data['user_metadata'].assets) {
        this.assets = data['user_metadata'].assets;
      }
    });
  }

  filterCoins(val: string): string[] {
    return this.coins.filter(option =>
      option.name.toLowerCase().indexOf(val.toLowerCase()) === 0);
  }

  addCoin() {
    console.log(this.addCoinObject.value);
    this.assets.push(this.addCoinObject.value)

    this.http.patch(`https://${AUTH_CONFIG.domain}/api/v2/users/${this.profile['sub']}`, { user_metadata: { assets: this.assets } }, {
      headers: new HttpHeaders().set('content-type', 'application/json').set('authorization', `Bearer ${this.access_token}`)
    }).subscribe((data) => {
      this.addCoinObject.reset();
      this.addCoinObject.updateValueAndValidity();
      console.log(data);
    });
  }
}
