import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreCollection
   } from '@angular/fire/firestore';

//Services
import { UtilitiesSvc } from './../services/utilities.svc';
import { ConnectionSvc } from './../services/connection.svc';

//Models
import { SiteAccessInfo, CreateSiteAccessObject } from '../models/app-vars-model';

@Injectable({
  providedIn: 'root'
})


export class FirebaseSvc {

  private siteCollection: AngularFirestoreCollection<SiteAccessInfo>;
  public FbSiteAccessData: SiteAccessInfo; 

  constructor(private afs: AngularFirestore,
            private utilitiesSvc: UtilitiesSvc,
            private connectionSvc: ConnectionSvc
            ) {
    this.FbSiteAccessData = CreateSiteAccessObject();
  }

  doLogin(value){
    console.log('doLogin: ', value);
    return new Promise<any>((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(value.email, value.password)
      .then(
       res => {console.log('Login Succeessful', firebase.auth().currentUser.uid, firebase.auth().currentUser.email); 
       resolve(res)},
       err => {console.log('Login Failed', err); alert('Login FAILED! \n'+JSON.stringify(err)); reject(err)})
    })
   }

  readSiteAccessInfo(accessSiteCode: string, accessSiteKey: string) {
    return new Promise((resolve, reject)=> {
      if (!this.connectionSvc.deviceIsOnline()) {
        console.log('**REMOVE deviceIsOnline(): Device is NOT online');
        return reject(false);
      }

      const userData = {email: accessSiteCode+'@g-mobility.com',password: accessSiteKey};
      this.siteCollection = this.afs.collection<SiteAccessInfo>('sites');
      //const userData = {email: 'ralphtestrc@g-mobility.com',password: 'R123H123'};
      firebase.auth().signInWithEmailAndPassword(userData.email, userData.password)
      .then(
       res => {
         console.log('Login Succeessful', firebase.auth().currentUser.uid, firebase.auth().currentUser.email); 
         let currentUser = firebase.auth().currentUser;
            
         this.siteCollection.doc(accessSiteCode).ref.get().then((doc)=> {
         if (doc.exists) {
           this.utilitiesSvc.copyPropertiesObj2Obj(doc.data(), this.FbSiteAccessData);
           console.log("Document data:", doc.data());
           console.log("FbSiteAccessData:", this.FbSiteAccessData, this.FbSiteAccessData.siteConfig);

           //alert('Read OK: '+JSON.stringify(doc.data()));           
           resolve(true);
         } else {
           console.log("No such document!");
           alert('No such document');
           return reject(false);
         }
         
       })
       .catch(error=> {
         console.log("Error getting document:", error);
         alert('Read Failed: '+JSON.stringify(error));
         return reject(false);
       });
       
      
      },
       err => {console.log('Login Failed', err); alert('Login FAILED! \n'+JSON.stringify(err)); reject(err)})
          
      }
    )}
  }
