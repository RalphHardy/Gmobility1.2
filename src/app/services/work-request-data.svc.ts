import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { map, max } from 'rxjs/operators';

import { LsoRequestsService } from '../services/lso-requests.service';
import { UtilitiesSvc } from '../services/utilities.svc';
import { LoadingService } from './loading.service';

import { WorkRequestModel } from '../models/work-request-model';
import { AttachFilesLsoModel } from '../models/wo-attach-files-model';


@Injectable({
  providedIn: 'root'
})
export class WorkRequestDataSvc {

  constructor(
    private alertCtrl: AlertController,
    private utilitiesSvc: UtilitiesSvc,
    private lsoRequestsSvc: LsoRequestsService,
    private myLoader1: LoadingService,) { }

  public WRdata: WorkRequestModel[] = [];
  public currWorkRequest: WorkRequestModel;


  createWorkRequestObject(): WorkRequestModel {
    return new WorkRequestModel('','','',0,'', 0,0,'','','',
      0,'','','','',  0,'','','','',// 40
      false,'','', []); //51
  }


  getWRdataObj(): WorkRequestModel[] {
    return this.WRdata;
  }
  insertWorkRequest(addWR: WorkRequestModel) {
    const newWR = this.createWorkRequestObject();
    this.utilitiesSvc.copyPropertiesObj2Obj(addWR, newWR);
    this.WRdata.unshift(newWR);  // put newly created W/O at front of W/O array
    console.log('**REMOVE, insertWoHeader: WRdata=>', this.WRdata);
  }
  
  updateWorkRequest(addWR: WorkRequestModel): number {
    const objIdx = this.findWRInArray(addWR.CreatedDateTime);
  
    this.utilitiesSvc.copyPropertiesObj2Obj(addWR, this.WRdata[objIdx]);
    
    //console.log('**REMOVE, updateWoHeader: WRdata=>', this.WRdata);
    return objIdx;
  }
  findWRInArray(dateTimeStr: string): number {
    const idx = this.WRdata.findIndex((data)=> data.CreatedDateTime  === dateTimeStr);
    return idx;
  }

  getWorkRequestsFromLS() {
    return new Promise((resolve, reject)=>{
      
    //this.myLoader1.present("Previous Work Requests ...");
    this.lsoRequestsSvc.getDataFromLocalStorage(this.lsoRequestsSvc.workRequestsLSOname)
    .then ((data)=> {  
      this.WRdata.length = 0;
      console.log('Reading from LS...', data);
      for ( let WR in data ) {
        this.currWorkRequest = data[WR];
        console.log('Pushing onto array...', this.currWorkRequest);
        this.WRdata.push(this.currWorkRequest);
      }   
      //this.myLoader1.dismiss();
      resolve(this.WRdata); 
      return;
    }
      ,(error)=> {
         //this.myLoader1.dismiss();
         alert('Error retrieving W/O data from Local Storage'); reject([]); }
     ); 
    });
  
  }
  
  
}
