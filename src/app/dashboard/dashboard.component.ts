import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AUTH_CONFIG } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import { CurrencyPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  coins: any = [];
  filteredCoins: Observable<string[]>;
  addCoinObject: FormGroup;
  access_token: string;
  profile: object = {};
  assets: Array<object> = [];
  validCoin: boolean = false;
  portfolioValue: any;
  loading: boolean = true;
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
  public doughnutChartLabels:string[] = [];
  public doughnutChartData:number[] = [];
  public doughnutChartType:string = 'doughnut';
  public options = {
    legend: {
      display: false
    },
    maintainAspectRatio: true,
    responsive: true,
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          return data.labels[tooltipItem.index] + ' ' + this.currencyPipe.transform(data.datasets[0].data[tooltipItem.index], 'USD', true);
        }
      }
    }
  }

  constructor(public http: HttpClient, fb: FormBuilder, private currencyPipe: CurrencyPipe) {
    this.addCoinObject = fb.group({
      'coin': [null],
      'amount': [null]
    });
    this.profile = JSON.parse(localStorage.getItem('profile'));
  }

  ngOnInit() {
    this.getCoins();
  }

  getCoins() {
    this.http.get('https://api.coinmarketcap.com/v1/ticker/').subscribe(data => {
      this.coins = data;
      console.log(this.coins);
      this.filteredCoins = this.addCoinObject.get('coin').valueChanges
        .startWith(null)
        .map(coinInput => coinInput ? this.filterCoins(coinInput) : this.coins.slice());
        this.getAccessToken();
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
        this.assetMath();
      }
    });
  }

  assetMath() {

    setTimeout(() => {
      if(this.chart) {
        this.chart.chart.data.datasets[0].data = [];
        this.chart.chart.data.labels = [];
        this.chart.chart.update();
      }
    });

    this.assets.forEach((asset) => {
      let price = this.coins.filter((coin) => {
        return asset['coin'] === coin.name
      });

      asset['value'] = parseFloat(price[0].price_usd) * asset['amount'];

      setTimeout(() => {
        this.chart.chart.data.datasets[0].data.push(asset['value']);
        this.chart.chart.data.labels.push(asset['coin']);
        this.chart.chart.update();
      });
    });

    this.portfolioValue = this.assets.reduce((total, coin) => {
      return total + coin['value'];
    }, 0);

    this.loading = false;
  }

  coinChange(coinInput) {
    if(coinInput) {
      let searchCoin = this.coins.filter((coin) => {
        return coin.name.toLowerCase() === coinInput.toLowerCase();
      });
      if(searchCoin.length === 1) {
        this.validCoin = true;
      } else {
        this.validCoin = false;
      }
    }
  }

  filterCoins(coinInput: string): string[] {
    return this.coins.filter((coin) => {
      return coin.name.toLowerCase().indexOf(coinInput.toLowerCase()) === 0;
    });
  }

  deleteCoin(asset: object) {
    this.assets.splice(this.assets.indexOf(asset), 1);
    this.updateCoins();
  }

  addCoin() {

    // check if asset exists
    if(this.assets.filter((asset) => { return asset['coin'] === this.addCoinObject.value.coin }).length) {
      // find asset in array add to amount
      this.assets[this.assets.map(function(asset) { return asset['coin']; }).indexOf(this.addCoinObject.value.coin)]['amount'] +=  parseFloat(this.addCoinObject.value.amount.replace(/,/g, ''));
    } else {
      let addCoinObject = {
        coin: this.addCoinObject.value.coin,
        amount: parseFloat(this.addCoinObject.value.amount.replace(/,/g, '')),
      }
      this.assets.push(addCoinObject);
    }

    this.updateCoins();
  }

  updateCoins() {
    this.http.patch(`https://${AUTH_CONFIG.domain}/api/v2/users/${this.profile['sub']}`, { user_metadata: { assets: this.assets } }, {
      headers: new HttpHeaders().set('content-type', 'application/json').set('authorization', `Bearer ${this.access_token}`)
    }).subscribe((data) => {
      this.assets = data['user_metadata'].assets;
      this.validCoin = false;
      this.addCoinObject.reset();
      this.assetMath();
      console.log(data);
    });
  }
}
