import { Component, OnDestroy } from '@angular/core';

import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ConnectionSvc } from './services/connection.svc';
import { LsoRequestsService } from './services/lso-requests.service';
import { WorkorderDataSvc } from './services/workorder-data.svc';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  // https://www.youtube.com/watch?v=srTt7AVof-U
  public sideMenuPages = [
    {
      title: 'Notes',
      url: '/notes',
      icon: 'md-paper'     
    }, 
    {
      title: 'Attachments',
      url: '/attachments',
      icon: 'attach'    
    }, 
    {
      title: 'Settings',
      url: '/settings',
      icon: 'settings'    
    }
  ];

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private connectionSvc: ConnectionSvc,
    private lsoRequestsSvc: LsoRequestsService,
    private workorderDataSvc: WorkorderDataSvc
  ) {
    this.initializeApp();
  }
  titleSuffix(pageTitle: string): string {
    if (pageTitle == 'Notes') {
      const numNotes = this.workorderDataSvc.getCurrWoNumNotes();
      if (numNotes == 0) return '';
      else return '('+numNotes.toString()+')';
    }      
    if (pageTitle == 'Attachments') {
      const numAtts = this.workorderDataSvc.getCurrWoNumAttachments();
      if (numAtts == 0) return '';
      else return '('+numAtts.toString()+')';
    }      
    else return '';
  }
  //public deviceHdwId: string;
  initializeApp() {
    this.platform.ready().then((readySource) => {
      this.platform.backButton.subscribe(async (event)=>  {
        if ( location.pathname === '/tabs/login') navigator['app'].exitApp();
        else {          
          //alert('Hdw BackButton Intercept');
          //this.navCtrl.goBack();
          return function (event){this.navCtrl.goBack();};
        }
      });

      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.connectionSvc.setDeviceHdwId(); // populate public property deviceHdwId (string, default is A1B2C3D4 for web-browser)
      this.lsoRequestsSvc.createListOfLSObjects(); // populate public property localStorageTables (array of object names)
    });
  }
  
  ngOnDestroy() {
    this.platform.backButton.unsubscribe();
  }
}
