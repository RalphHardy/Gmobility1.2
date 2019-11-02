import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WoSubscriptionService {
  
  triggerSaveNextWo = new Subject<number>();

  execTriggerSaveNextWo(Idx: number, waitTime?: number) {
    //console.log('FIRING observer .next with mtIdx =>', mtIdx)
      //console.log('**REMOVE: TRIGGERED SAVE NEXT W/O idx=', Idx,' timeout ms: ');
      this.triggerSaveNextWo.next(Idx);
  }

  triggerSaveNextImage = new Subject<number>();

  execTriggerSaveNextImage(attIdx: number, waitTime?: number) {
    //console.log('FIRING observer .next with mtIdx =>', mtIdx)
      this.triggerSaveNextImage.next(attIdx);
  }
}
