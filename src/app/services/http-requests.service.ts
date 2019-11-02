import { Injectable } from '@angular/core';
//import { Http, Headers } from '@angular/http';
import { HttpClient, 
  HttpParams, 
  HttpHeaders, 
  HttpResponse, 
  HttpErrorResponse } from '@angular/common/http';
  import { File, FileEntry } from '@ionic-native/File/ngx';  
  import { FileTransfer, 
    FileUploadOptions, 
    FileTransferObject } from '@ionic-native/file-transfer/ngx';


import { tap, map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { WorkorderModel } from '../models/workorder-model';
import { WorkRequestModel } from '../models/work-request-model';

// services
import { UtilitiesSvc } from './utilities.svc';

//data
import { environment } from '../../environments/environment';
import { HttpParamsOptions } from '@angular/common/http/src/params';
import { Http, Headers } from '@angular/http';
const gmobilityUrl = environment.GmobilityUrl;


//const params = new HttpParams().set('apiKey', apiKey);
//const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1IiwiZW1haWwiOiJUZXN0UkNTeW5jIiwiZGV2TUFDQWRkciI6IkExQjJDM0Q0IiwianRpIjoiYWNlNjk3MDctZmNhYS00ZTRkLWJiOGUtZjMzYzkwOTdlYjFjIiwiZXhwIjoxNTQ0MjE2NTk3LCJpc3MiOiJodHRwOi8vcmVtb3RlMS5jaXJjbGVnc29mdHdhcmUuY29tLyIsImF1ZCI6Imh0dHA6Ly9yZW1vdGUxLmNpcmNsZWdzb2Z0d2FyZS5jb20vIn0.iqmuRdJeD8qjSy7t07_GlBbx5C_3Ii6DVIVVxJvBc2c';

@Injectable({
  providedIn: 'root'
})
export class HttpRequestsService {

  constructor(
    private http: HttpClient,
    private file: File, 
    private transfer: FileTransfer,
    private utilitiesSvc: UtilitiesSvc) {  
      console.log('^^^^^^ HTTP REQUESTS SERVICE CONSTRUCTOR');
  }
  private siteServerUrl: string = gmobilityUrl; // reset by ApplicVars 
  public connected2Server: boolean = false;
  private bearerToken = '';

  setSiteServerUrl (url: string) {
    //console.log('setSiteServerUrl. was: ['+this.siteServerUrl+'], now set to: ['+url+']')
    this.siteServerUrl = url;
  }
  getSiteServerUrl (): string {
    return this.siteServerUrl;
  }

  setBearerToken(tokenStr) {
    this.bearerToken = tokenStr;
  }

  getSiteServerConnectionData(siteCode: string, siteKey: string) {  
    const url = gmobilityUrl+'GetSite/'+siteCode+'/'+this.utilitiesSvc.encodeSpecialChars2Hex(siteKey);
    //if (environment.DebugMode) console.log('URL ==>', url);
    return this.http.get(url, { headers: this.createHttpHeader(false) })
    .pipe(map(
        (data: Response) => { 
          const rtnResult = data;
          return rtnResult;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP GET REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }

  getApiVersion() {
    return this.http.get(this.getSiteServerUrl()+'testconnection')
    .pipe (map(
      (data) => { return data },
      (err) => { return null}    
    ))  
  }

  testServerConnection(useSyncDb?: boolean) {
    const url=this.getSiteServerUrl()+'testconnection';
    console.log('httprequest.testServerConnection(): BEFORE Http', url, this.connected2Server);
    this.connected2Server = false;
    return this.http.get(url)
    .pipe (map(
      (data) => { 
        this.connected2Server = true;
        console.log('httprequest.testServerConnection():  AFTER Http', url, this.connected2Server, data);
        //console.log('AFTER handleGetRequest', new Date());
        //console.log('GET REQUEST RESULT: ', rtnResult);
        },
        (err) => {console.log('httprequest.testServerConnection(): ERROR waiting on HTTP request for TestConnection', err)}    
    ) )  
  }

  handleGetRequest(url: string, withToken: boolean) {  
    //const url = gmobilityUrl+'GetSite/'+siteCode+'/'+this.utilitiesSvc.encodeSpecialChars2Hex(siteKey);
    //if (environment.DebugMode) console.log('handleGetRequest: ', url, this.createHttpHeader(withToken));
    //console.log('BEFORE handleGetRequest', new Date());
    return this.http.get(url, { headers: this.createHttpHeader(withToken) })
    .pipe(map(
        (data: Response) => { 
          //console.log('AFTER handleGetRequest', new Date());
          const rtnResult = data;
          //console.log('GET REQUEST RESULT: ', rtnResult);
          return rtnResult;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP GET REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }
/*
  createHttpParams(dataStr: string): HttpParams { 
    var params: HttpParams;
    
    params = new HttpParams({ 'body': dataStr});
   
    //console.log('header ==>', headers);
    return params;
  } */

  createHttpHeader(withToken: boolean): HttpHeaders { 
    var headers: HttpHeaders;
    if (withToken && this.bearerToken !== '') {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'Authorization': 'Bearer ' + this.bearerToken }) ;
      //console.log('##2-03 http-requests createHttpHeader - end of (TOKEN) ->', this.bearerToken.substr(this.bearerToken.length - 24));
    }
    else { // no Bearer Token
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 
      'Accept': 'application/json'})
    }
    //console.log('header ==>', headers);
    return headers;
  }
  createHttpHeaderText(): HttpHeaders { 
    var headers: HttpHeaders;
      headers = new HttpHeaders({ 'Content-Type': 'text/plain', 
        'Authorization': 'Bearer ' + this.bearerToken }) ;
    //console.log('header ==>', headers);
    return headers;
  }

  handlePostDataRequest(url: string, dataJson: {Data: string}) {   
    return this.http.post(`${this.getSiteServerUrl()}${url}`,
    dataJson, { headers: this.createHttpHeader(true) } )    
    .pipe(map(
        (data: Response) => { 
          const rtnResult = data;
          return rtnResult;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP Post REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }
  
  handlePostWorkRequest(WorkRequest: WorkRequestModel) {   
    return this.http.post(`${this.getSiteServerUrl()}${'CreateWorkRequest'}`, 
    WorkRequest, { headers: this.createHttpHeader(true) })
    .pipe(map(
        (data: Response) => { 
          //const rtnResult = data;
          return data;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP Post REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }

  handlePostWorkorder(Workorder: WorkorderModel) {  
    console.log('handlePostWorkorder URL==>'+`${this.getSiteServerUrl()}`+'syncworkorder');
    return this.http.post(`${this.getSiteServerUrl()}`+'syncworkorder', 
    Workorder, { headers: this.createHttpHeader(true) })
    .pipe(map(
        (data: Response) => { 
          //const rtnResult = data;
          return data;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP Post REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }

  handlePostRequest(url: string, withToken: boolean) {   
    return this.http.post(`${this.getSiteServerUrl()}${url}`, { headers: this.createHttpHeader(withToken) })
    .pipe(map(
        (data: Response) => { 
          const rtnResult = data;
          return rtnResult;
          }
        ))   
    .pipe(catchError( (err: HttpErrorResponse) => {
      console.log('HTTP Post REQUEST ERR ->', err);
      return throwError(err);
      })
    )  
  }

  DownloadImageFromServer(woNum: string, fileName: string){
    //let loader = this.loadingCtrl.create({spinner:"dots"});
      //loader.present();
    const fileTransfer: FileTransferObject = this.transfer.create();
    const url = 'http://remote1.circlegsoftware.com/api/getwoattachmenttemp/BD11276/4/TestRCSync';
    const mobileFileRootPath = this.file.externalRootDirectory;
    const targetPathFilename = mobileFileRootPath+woNum+'/'+fileName;
    alert('targetPathFilename: '+targetPathFilename);
    /*
    fileTransfer.download(url, targetPathFilename)
      //{ headers: this.createHttpHeader(true) })
    .then((entry) => {
        //loader.dismiss();
        alert('Download complete');
      }, (error) => {
        //loader.dismiss();
        alert('Error: '+JSON.stringify(error));    // handle error
      });
      */
  }


}
