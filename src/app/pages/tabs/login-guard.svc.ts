import {
    Router,
    CanActivate,
    ActivatedRoute,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { ConnectionSvc } from '../../services/connection.svc';

const isLoggedIn = false;


@Injectable()
export class LoginGuardSvc implements CanActivate {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private connectionSvc: ConnectionSvc) {
    }

    canActivate(route: ActivatedRouteSnapshot,
                state: RouterStateSnapshot): 
                    Observable<boolean> | Promise<boolean> | boolean {
        if (this.connectionSvc.isLoggedIn()) {
            const pRoute = state.url;
            this.connectionSvc.setParentRoot(pRoute);
            return true;
        }
        else {
            //this.router.navigate(['/']);
            return false;
        }
    }           
}