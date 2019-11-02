import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

//Models
import { SiteAccessInfo } from '../../models/app-vars-model';

//Services
import { UtilitiesSvc } from '../../services/utilities.svc';
import { HttpRequestsService } from '../../services/http-requests.service';
import { LsoRequestsService } from '../../services/lso-requests.service';
import { ApplicVarsSvc } from '../../services/applic-vars.svc';

@Injectable({
  providedIn: 'root'
})


export class LoginService {
  
  siteAccessInfoChanged = new Subject<SiteAccessInfo>();

  setNewSiteAccessInfo(newSiteAcccessInfo: SiteAccessInfo) {
    //console.log('FIRING observer .next');
    this.siteAccessInfoChanged.next(newSiteAcccessInfo);
  }


}
/*

<ion-footer >
  <ion-button fill="solid" background-color="black" color="white" expand="full"> GMOBILITY {{gmobVersion}} </ion-button>
</ion-footer>
*/