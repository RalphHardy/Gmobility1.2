import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  isLoading = false;

  constructor(public loadingController: LoadingController) { }

  async present(msg: string, durationTime?:number) {
    if (!durationTime) durationTime = 5000;
    this.isLoading = true;
    return await this.loadingController.create({
      message: msg,
      spinner: 'crescent',
      duration: durationTime,
    }).then(a => {
      a.present().then(() => {
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async dismiss() {
    this.isLoading = false;
    return await this.loadingController.dismiss(); //.then(() => console.log('dismissed'));
  }
}
