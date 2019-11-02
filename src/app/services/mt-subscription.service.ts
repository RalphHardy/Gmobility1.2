import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MtSubscriptionService {
  
  triggerGetStoreNextLargeMT = new Subject<number>();

  execTriggerGetStoreNextLargeMT(mtIdx: number, waitTime?: number) {
    //console.log('FIRING observer .next with mtIdx =>', mtIdx)
    if (mtIdx == 0) this.triggerGetStoreNextLargeMT.next(mtIdx);
    else {
      if (!waitTime) waitTime = 1000;
      setTimeout( ()=> 
        this.triggerGetStoreNextLargeMT.next(mtIdx),
        waitTime);
    }
  }

  triggerGetStoreNextSmallMT = new Subject<number>();
  execTriggerGetStoreNextSmallMT(mtIdx: number, waitTime?: number) {
    //console.log('FIRING observer .next with mtIdx =>', mtIdx)
    if (!waitTime) waitTime = 50;
    setTimeout( ()=> 
      this.triggerGetStoreNextSmallMT.next(mtIdx),
      waitTime);
  }

  triggerSetMTobjToLSOdata = new Subject<number>();

  execTriggerSetMTobjToLSOdata(mtIdx: number, waitTime?: number) {
    //console.log('FIRING observer .next with mtIdx =>', mtIdx)
    if (!waitTime) waitTime = 50;
    setTimeout( ()=> 
      this.triggerSetMTobjToLSOdata.next(mtIdx),
      waitTime);
  }
}
