import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import {
  IonicModule,
  IonicRouteStrategy
   } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';

/* My App additions... */
import { ReactiveFormsModule } from '@angular/forms';

/* Other imports */
import { HttpClientModule } from '@angular/common/http';

/* Plugins */
import { Network } from '@ionic-native/network/ngx';
import { Device } from '@ionic-native/device/ngx';
import { DatePipe } from '@angular/common';

import { Camera } from '@ionic-native/camera/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { DocumentViewer } from '@ionic-native/document-viewer/ngx';

import { FileTransfer } from '@ionic-native/file-transfer/ngx';

import { FileOpener } from '@ionic-native/file-opener/ngx';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

//import { NativeStorageOriginal } from '@ionic-native/native-storage';
import { IonicStorageModule } from '@ionic/storage';


import { Keyboard } from '@ionic-native/keyboard/ngx';

/* PWA Components */
import { ComponentsModule } from './components/components.module';

/* Application Pages */
import { AppComponent } from './app.component';

/* Application Services */
import { UtilitiesSvc } from './services/utilities.svc';
import { ConnectionSvc } from './services/connection.svc';
import { ApplicVarsSvc } from './services/applic-vars.svc';
import { MasterTableDataSvc } from './services/master-table-data.svc';
import { WorkorderDataSvc } from './services/workorder-data.svc';

import { LoginGuardSvc } from './pages/tabs/login-guard.svc';
import { LoginGuardDeactivateSvc } from './pages/tabs/login-guard-deactivate.svc';
import { LsoRequestsService } from './services/lso-requests.service';

import { LoadingService } from './services/loading.service';

//Sidemenu Module
import { WoNotesPageModule } from './pages/workorders/wo-notes/wo-notes/wo-notes.module';
import { WoAttachPageModule } from './pages/workorders/wo-attach/wo-attach.module';
import { WoNoteEditPageModule } from './pages/workorders/wo-notes/wo-note-edit/wo-note-edit.module';
import { ResetLsoPageModule } from './pages/maint/reset-lso/reset-lso.module';
import { DisplayLsoPageModule } from './pages/maint/display-lso/display-lso.module';
import { CheckWoLsoPageModule } from './pages/maint/check-wo-lso/check-wo-lso.module';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    ComponentsModule,
    AppRoutingModule,
    WoNotesPageModule,
    WoNoteEditPageModule,
    WoAttachPageModule,
    ResetLsoPageModule,
    DisplayLsoPageModule,
    CheckWoLsoPageModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot()
  ],
    
  providers: [
    StatusBar,
    SplashScreen,
   // NativeStorageOriginal,
    Network,
    Device,
    DatePipe,
    Camera,
    File,
    FileTransfer,
    Base64,
    DocumentViewer,
    FileOpener,
    PhotoViewer,
    BarcodeScanner,
    WebView,
    Keyboard,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    UtilitiesSvc,
    ConnectionSvc,
    ApplicVarsSvc,
    MasterTableDataSvc,
    WorkorderDataSvc,
    LoginGuardSvc,
    LsoRequestsService,
    LoadingService,
    AngularFireAuth
    //LoginGuardDeactivateSvc
     /*
    WorkorderDataSvc, */
  ],
  bootstrap: [AppComponent],
  entryComponents: [ 
    
  ]
})
export class AppModule {}
