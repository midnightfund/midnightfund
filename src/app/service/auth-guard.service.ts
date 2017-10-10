import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';
@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(public router: Router, public auth: AuthService) {

  }

  canActivate() {

    if(this.auth.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/']);
      this.auth.login();
      return false;
    }
  }
}
