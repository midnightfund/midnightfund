import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

import { ROUTES } from './app.routes';

import { AuthService } from './service/auth.service';
import { AuthGuardService } from './service/auth-guard.service';

import { AppComponent } from './app.component';
import { CallbackComponent } from './callback/callback.component';
import { HomeComponent } from './home/home.component';

import { DashboardComponent } from './dashboard/dashboard.component';

import { CustomFormsModule } from 'ng2-validation';
import { TextMaskModule } from 'angular2-text-mask';
import { ChartsModule } from 'ng2-charts';
import { CurrencyPipe } from '@angular/common';
import { DemoComponent } from './demo/demo.component';

@NgModule({
  declarations: [
    AppComponent,
    CallbackComponent,
    HomeComponent,
    DashboardComponent,
    DemoComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    CustomFormsModule,
    TextMaskModule,
    HttpClientModule,
    ChartsModule,
    RouterModule.forRoot(ROUTES)
  ],
  providers: [AuthService, AuthGuardService, CurrencyPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
