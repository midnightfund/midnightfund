import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AUTH_CONFIG } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import { CurrencyPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';
import * as moment from 'moment';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('doughnutChart') doughnutChart: BaseChartDirective;
  @ViewChild('lineChart') lineChart: BaseChartDirective;
  coins: any = [];
  points: any = [];
  filteredCoins: Observable<string[]>;
  addCoinObject: FormGroup;
  access_token: string;
  profile: object = {};
  assets: Array<object> = [];
  validCoin: boolean = false;
  portfolioValue: any;
  pageLoading: boolean = true;
  coinLoading: boolean = false;
  refreshLoading: boolean = false;
  index: number = 0;
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

  public lineChartData:Array<any> = [{data: [], label: ''}];
  public lineChartLabels:Array<any> = [];
  public lineChartOptions:any = {
    responsive: true,
    maintainAspectRatio: true,
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          return data.datasets[tooltipItem.datasetIndex].label + ' ' + this.currencyPipe.transform(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index], 'USD', true);
        }
      }
    },
    scales: {
      yAxes: [
        {
          ticks: {
            callback: (label, index, labels) => {
              return this.currencyPipe.transform(label, 'USD', true, '1.0-0');
            }
          }
        }
      ]
    }
  };
  public lineChartLegend:boolean = false;
  public lineChartType:string = 'line';

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
    this.http.get('https://api.coinmarketcap.com/v1/ticker/?limit=2000').subscribe(data => {
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

      if(!data['user_metadata'] || !data['user_metadata'].assets || !data['user_metadata'].assets.length) {
        this.pageLoading = false;
      } else {
        this.assets = data['user_metadata'].assets;
        this.assetMath();
        this.assetGraph();
      }
    });
  }

  assetGraph() {

    this.index = 0;

    setTimeout(() => {
      if(this.lineChart) {
        this.lineChart.chart.data.datasets = [];
        this.lineChart.chart.data.labels = [];
        this.lineChart.chart.update();
      }
    });

    if(this.assets.length) {
      this.assetDraw();
    }
  }

  assetDraw() {
    var asset = this.assets[this.index];
    let days = [];
    let prices = [];
    this.http.get(`https://cors-anywhere.herokuapp.com/https://graphs.coinmarketcap.com/currencies/${asset['coin'].replace(/ /g, '-')}/`).subscribe((data) => {

      console.log(data);

      // single coin graph?
      // all coins graph?
      // portfolio value graph?

      this.points = data['price_usd'].reverse();

      for(let point of this.points)  {
        if(!days.includes(moment(point[0]).format('dddd'))) {
          days.push(moment(point[0]).format('dddd'));
          prices.push(point[1]);
        }
        if(days.length === 7) {
          break
        }
      }

      days = days.reverse();
      prices = prices.reverse();

      this.lineChart.chart.data.datasets.push({
        backgroundColor: 'transparent',
        borderColor: asset['color'],
        data: [],
        label: asset['coin'],
        pointBackgroundColor: asset['color'],
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: asset['color']
      });
      this.lineChart.chart.update();

      days.forEach((day, index) => {
        this.lineChart.chart.data.datasets[this.index].data.push(prices[index]);
        if(this.lineChart.chart.data.labels.length < 7) {
          this.lineChart.chart.data.labels.push(day);
        }

        this.lineChart.chart.update();
      });

      this.index++;

      if(this.index < this.assets.length) {
        this.assetDraw();
      } else {
        this.pageLoading = false;
        this.coinLoading = false;
        this.refreshLoading = false;
      }
    });
  }

  assetMath() {

    setTimeout(() => {
      if(this.doughnutChart) {
        this.doughnutChart.chart.data.datasets[0].data = [];
        this.doughnutChart.chart.data.labels = [];
        this.doughnutChart.chart.data.datasets[0].backgroundColor = [];
        this.doughnutChart.chart.update();
      }
    });

    this.assets.forEach((asset, index) => {
      let price = this.coins.filter((coin) => {
        return asset['coin'] === coin.name
      });

      asset['value'] = parseFloat(price[0].price_usd) * asset['amount'];

      setTimeout(() => {
        this.doughnutChart.chart.data.datasets[0].data.push(asset['value']);
        this.doughnutChart.chart.data.labels.push(asset['coin']);
        this.doughnutChart.chart.data.datasets[0].backgroundColor.push(asset['color']);
        this.doughnutChart.chart.update();
      });
    });

    this.portfolioValue = this.assets.reduce((total, coin) => {
      return total + coin['value'];
    }, 0);
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
    this.coinLoading = true;
    // check if asset exists
    if(this.assets.filter((asset) => { return asset['coin'] === this.addCoinObject.value.coin }).length) {
      // find asset in array add to amount
      this.assets[this.assets.map(function(asset) { return asset['coin']; }).indexOf(this.addCoinObject.value.coin)]['amount'] +=  parseFloat(this.addCoinObject.value.amount.replace(/,/g, ''));
    } else {
      let addCoinObject = {
        coin: this.addCoinObject.value.coin,
        amount: parseFloat(this.addCoinObject.value.amount.replace(/,/g, '')),
        color: "#"+((1<<24)*Math.random()|0).toString(16)
      }
      this.assets.push(addCoinObject);
    }

    this.updateCoins();
  }

  refreshCoins() {
    this.refreshLoading = true;
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
      this.assetGraph();
      console.log(data);
    });
  }
}
