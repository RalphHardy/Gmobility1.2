import { Injectable, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

//Data
import { environment } from '../../environments/environment';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Injectable({
  providedIn: 'root'
})
export class UtilitiesSvc {

  constructor(private datePipe: DatePipe) { }
  //-------------------------------------------------------------------
  // NUMBERS (Hours)
  roundHrsClosest(numHrs: number, fraction:number):number { // e.g., fraction = .25 of hour (1/4 hours)
    const fracNum = fraction*100;
    var numRndUp = 100*(numHrs+(fraction/2))/fracNum;
    const numStr: string = numRndUp.toString();
    const num2: number = parseInt(numStr) * fracNum;
    const num3: number = num2/100;
    //console.log('>>NUMS: ', numHrs, numRndUp, fraction, num2);
    return num3
  }
  roundHrsUp(numHrs: number, fraction:number):number { // e.g., fraction = .25 of hour (1/4 hours)
    const fracNum = fraction*100;
    var numRndUp = 100*(numHrs+(fraction))/fracNum;
    const numStr: string = numRndUp.toString();
    const num2: number = parseInt(numStr) * fracNum;
    const num3: number = num2/100;
    //console.log('>>NUMS: ', numHrs, numRndUp, fraction, num2);
    return num3
  }


  inputRoundHrsDec25(hrs: number, rndUp: boolean): number {
    var rtnHrs = -1;
    const validDecVals=".0/.00/.25/.5/.50/.75/";
    const hrsStr = hrs.toString();
    const decptIdx = hrsStr.indexOf(".");
    const lenHrsStr = hrsStr.length;
    //console.log('decptIdx, lenHrsStr', decptIdx, lenHrsStr);
    if (decptIdx >-1 && (lenHrsStr - decptIdx > 1) ) {
      const decStr = hrsStr.substring(decptIdx+1);
      //console.log('decptIdx, lenHrsStr, decStr', decptIdx, lenHrsStr, decStr);
      if (validDecVals.indexOf(decStr+'/')==-1) {
        if (rndUp) rtnHrs = this.roundHrsUp(hrs, .25);
        else  rtnHrs = this.roundHrsClosest(hrs, .25);
      }  
    }
    return rtnHrs;
  }

  inputRoundHrsDec01(hrs: number, rndUp: boolean): number {
    var rtnHrs = -1;
    //const validDecVals=".0/.00/.25/.5/.50/.75/";
    const hrsStr = hrs.toString();
    const decptIdx = hrsStr.indexOf(".");
    const lenHrsStr = hrsStr.length;
    //console.log('decptIdx, lenHrsStr', decptIdx, lenHrsStr);
    if (decptIdx >-1 && (lenHrsStr - decptIdx > 3) ) {
      const decStr = hrsStr.substring(decptIdx+3);
      console.log('decptIdx, lenHrsStr, decStr', decptIdx, lenHrsStr, decStr);
      if (rndUp) rtnHrs = this.roundHrsUp(hrs, .01);
      else  rtnHrs = this.roundHrsClosest(hrs, .01);
    }
    return rtnHrs;
  }
  // return Array<number>
  getNums (T: string): number[] {
    const L=T.length;
    let R: number[] = [];
    let S = '';
    for (var i = 0; i < L; i++) {
     // //console.log('getNums - iteration', i, T[i], R); 
      if (T[i] == '.') {
        R.push(Number(S));
        S = '';
      } else {
        S=S+T[i];
      }
    }
    if (S == '') {
      R.push(0);
    } else {      
      R.push(Number(S));
    }
   // //console.log('GET NUMS FROM VERSIONS ==>', T, R);
    return R;
  }

  //-------------------------------------------------------------------
  // DATES & TIMES
  
  getCurrDateStr(): string {
    const currDate = new Date();
    const tmpDateStr = this.datePipe.transform(currDate, 'yyyy-MM-dd'); 
    //let tmpDateStr = this.moment.format('YYYY-MM-DD');
    ////console.log('**CURR DATE STR ***', tmpDateStr);
    return tmpDateStr; 
  }  

  currDateOnly(): Date {
    return new Date(this.getCurrDateStr());
  }

  addDays2CurrDateRtnStr(deltaDays): string {
    const currDate = new Date();
    var oldestDate = new Date();
    oldestDate.setDate(currDate.getDate() + deltaDays);
    const tmpDateStr = this.datePipe.transform(oldestDate, 'yyyy-MM-dd'); 
    //console.log('**REMOVE - addDays2CurrDateRtnStr =>',tmpDateStr);
    return tmpDateStr;
  }

  getTimeDeltaMinutes(newerDT: Date, olderDT: Date) {
    const delta = newerDT.getTime() - olderDT.getTime();
    const deltaMins = delta/60000; // #ms / (#ms/min)
    //console.log('getTimeDeltaMinutes', newerDT.getTime(), olderDT.getTime(), delta, deltaMins);
    return deltaMins;
  }

  getSmallTimeStr(bigTime: Date): string {
	  return bigTime.toTimeString().substr(0,5);
  }
  myFormatDate(dateStr: string): string {
		const dateStr2 = this.fixSqlIso8601DateTimeStr(dateStr);
		return dateStr2.substr(5,2)+"-"+dateStr2.substr(8,2)+"-"+dateStr2.substr(0,4)
  }
  //SqlServer gives us format YYYY-MM-DDTH:MM:SS where H is either 1 or 2 chars; JS needs it to be zero-filled char(2)
  fixSqlIso8601DateTimeStr(inStr: string): string {
    //YYYY:MM:DDTh:mm:ss
    //0123456789-12345678
    if (!inStr || inStr == "") {
      return '';
    }
    else { 
      //console.log('fixSqlIso8601DateTimeStr1 ==>', inStr);
      let rslt = inStr;
      if ( inStr.length > 0 ) {
        const ch = inStr.substr(12,1);
        if (ch == ":") {
          rslt = inStr.substr(0,11)+"0"+inStr.substr(11);
        }
      }
      //console.log('fixSQLIso', ch, rslt);
      //console.log('fixSqlIso8601DateTimeStr2 ==>', inStr, rslt);
      return rslt;
    }
  }

  validateDaysOfMonth(dtStr: string): boolean { //ISO date string
    //YYYY:MM:DDThh:mm:ssZ
    var validDayOfMonth = false;
    if (dtStr && dtStr.length >= 9) { 
      var yrNum: number = Number(dtStr.substr(0,4));
      var monNum: number = Number(dtStr.substr(5,2));
      var dayNum: number = Number(dtStr.substr(8,2)); 
      //console.log('Mon: Day: <'+dtStr+'>', dtStr.substr(5,2), monNum, dtStr.substr(8,2), dayNum);
      switch (monNum) {
        case 2: {
          if (dayNum <= 28) {validDayOfMonth = true; break; }
          if (dayNum > 29 ) {validDayOfMonth = false; break; }
          // else check if 29th is in a leap year...
          const rmndr = (yrNum - 1960) % 4;
          validDayOfMonth = rmndr == 0;
          console.log('Feb leap year??', rmndr);
          break;
        }
        case 4: 
        case 6: 
        case 9:
        case 11:  
        {
          validDayOfMonth = dayNum <= 30;
          //console.log('validate Day of 30-day Month: ', dtStr, monNum, dayNum);
          break;
        }
        default: { // months with 31 days
          validDayOfMonth = dayNum <= 31;
          //console.log('validate Day of 31-day Month: ', dtStr, monNum, dayNum);
        }
      }      
    }
    //console.log('Date is valid: ', validDayOfMonth);
    return validDayOfMonth;
  }

  fixDateFromPicker(dtStr): string {
    const endIdx = dtStr.indexOf('-00:00');
    if (endIdx > -1) 
      return dtStr.substring(0, endIdx);
    else
      return dtStr;
  }
  // remove "Z" off the end
  unFixSqlIso8601DateTimeStr(inStr: string): string {
    //YYYY:MM:DDThh:mm:ssZ --> YYYY:MM:DD hh:mm:ss
    //0123456789-12345678
    if (!inStr) { inStr = ''}
    let rslt = inStr;
    const len = inStr.length;

    if (rslt.substr(len-1,1) == "Z") {
      const tmpCh = rslt.substr(len-1,1);
      rslt = inStr.substr(0,len-1); // doesn't include the "Z" at the end
      console.log("unFixSqlIso8601DateTimeStr, removed Z:", len, tmpCh, rslt);
    }
    //console.log('unFixSqlIso8601DateTimeStr', len, rslt);
    return rslt;
  }


  getSmallDateStr(bigDate: Date): string {
	  return bigDate.toDateString().substr(0,10);
  }
  
  getSmallDateFromDTstr(dtStr: string): string {
	  return dtStr.substr(0,10);
  }
  
  getCurrDateTimeStr(): string {
    const currDate = new Date();
    const tmpDateStr = this.datePipe.transform(currDate, 'yyyy-MM-dd hh:mm:ss'); 
    //let tmpDateStr = this.moment.format('YYYY-MM-DD');
    console.log('**CURR DATE-TIME STR ***', tmpDateStr);
    return tmpDateStr; 
  }
  
  //-------------------------------------------------------------------
  // STRINGS 
  cmpVersionStrings(v1: string, v2: string): boolean {
    // true if V2 >= V1
    const minVersion = this.getNums(v1);
    let currVersion = this.getNums(v2);

    //console.log('checkVersion:', currVersion, minVersion);
    for (var i = 0; i < minVersion.length; i++) {
      // e.g., minVer=3.1.3 currVer=3.1.3.2 or =3.1.4 then OK
      if (i >= currVersion.length) return true; // has been so far but minVersion (erroroneously) has more components than currVersion
      if (currVersion[i] < minVersion[i]) {
        //console.log('checkVersion Failed', currVersion, minVersion);
        return false;
      }
    }
    return true;			
  }
  // Check if the 3rd element of the version no. (or 1st or 2nd) has changed (used to determine change to LSO)
  // fn returns True if a difference is found
  cmpVersion3rdElement(v1: string, v2: string): boolean { // currAppVersion vs. prev
    const currAppVersion = this.getNums(v1);
    let prevAppVersion = this.getNums(v2);
    //console.log('cmpVersion3rdElement: ', v1, v2, currAppVersion, prevAppVersion,
      //(currAppVersion[0] !== prevAppVersion[0]),  (currAppVersion[2] !== prevAppVersion[2]), (currAppVersion[1] !== prevAppVersion[1]) );

    return ( (currAppVersion[2] !== prevAppVersion[2])
        || (currAppVersion[1] !== prevAppVersion[1]) 
        || (currAppVersion[0] !== prevAppVersion[0]) );			
  }

  getLastChars(S:string, N:number): string {
    S = this.removeLeadingTrailingSpaces(S);
    const L=S.length;
    var rtnVal: string = "";
    if ( L >= N ) {
      const Idx = L - N;
      rtnVal = S.substring(Idx);
      ////console.log("Last "+N, S, Idx, rtnVal);
    }
    return rtnVal;
  }
  removeLeadingTrailingSpaces(S:string): string {
    let lastIdx = S.length-1;
    let endOfStr = lastIdx;
    for (let i=lastIdx; i>-1; i--) {
      if (S[i]==" ") endOfStr = i-1;
      else break; 
    }
    //console.log('end of str & last idx =', endOfStr, lastIdx);
    if (endOfStr < lastIdx) S=S.substring(0,endOfStr+1);
    lastIdx = endOfStr;
    let begOfStr = 0;
    for (let i=0; i<lastIdx && S[i]==" "; i++) begOfStr = i+1;

    if (S.length == 1 && S[0] == " ") S=""
    else S=S.substring(begOfStr);
    return S;
  }
  encodeSpecialChars2Hex(tokenStr: string): string {
    const okChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-*_';
    var resultStr: string = '';
    tokenStr = this.removeLeadingTrailingSpaces(tokenStr);
    const lastIdx = tokenStr.length - 1;
    for (let i=0; i<=lastIdx; i++) {
      const chVal = tokenStr[i];
      const chAscii = tokenStr.charCodeAt(i);
      if (chVal == ' ') resultStr = resultStr + '+' // <space> is replaced by "+"
      else if (okChars.indexOf(chVal) > -1) resultStr = resultStr + chVal // these aren't special chars
      else resultStr = resultStr + '%'+chAscii.toString(16); // convert special chars to "%"HH (hexadecimal)
      //console.log('special chars:', tokenStr[i], chAscii, chAscii.toString(16), resultStr);
      /*The alphanumeric characters "a" through "z", "A" through "Z" and "0" through "9" remain the same.
      The special characters ".", "-", "*", and "_" remain the same.
      The space character " " is converted into a plus sign "+".
      All other characters are unsafe and are first converted into one or more bytes using some encoding scheme.
      Then each byte is represented by the 3-character string "%xy", where xy is the two-digit
      hexadecimal representation of the byte. The recommended encoding scheme to use is UTF-8.
      */
    }

    return resultStr;
  } 
  parseOutToken(targetStr: string, separator: string): string {
    var rtnStr = '';
    const lastIdx = targetStr.length-1;
    for (let i=0; i<lastIdx && targetStr[i] !== separator; i++) {
      rtnStr = rtnStr + targetStr[i];
    }
    return rtnStr;
  }
  copyPropertiesObj2Obj(srcObj: any, trgtObj: any) {
    const srcKeys = Object.keys(srcObj);
    const trgtKeys = Object.keys(trgtObj);

    //console.log('copyPropertiesObj2Obj, lengths=',srcKeys.length, trgtKeys.length);
    for (var key in srcObj) {
      //console.log('copyPropertiesObj2Obj-1, key=',key);
      if (trgtKeys.indexOf(key) >= 0) { // only do if src.Key is in Trgt obj
        //console.log('copyPropertiesObj2Obj-2, key=',key);
        if ( typeof trgtObj[key] === "object" ) {

          if ( Array.isArray(trgtObj[key]) ) {
            trgtObj[key].length = 0;
            const srcArr = srcObj[key];
            const arrLenIdx = srcArr.length-1;
            for (let i=0; i<=arrLenIdx; i++) { 
              trgtObj[key].push(srcArr[i]);
              //console.log('copyPropertiesObj2Obj-3, isArray!!!', key, srcArr[i],trgtObj[key]);
            }
          }
          else
            //console.log ('*** IS SUB-OBJECT');
            this.copyPropertiesObj2Obj(srcObj[key], trgtObj[key]);
        }
        else {//only do if src.Key is in Trgt obj
          //console.log('copyPropertiesObj2Obj-4, key=',srcObj[key],trgtObj[key]);
          trgtObj[key] = srcObj[key];

        }
      }
    }
  }
  getLastToken(src: string, tokenChar: string): string {
    const idx = src.lastIndexOf(tokenChar)+1;
    return src.substr(idx);
  }
  /*
  const  = environment.DebugMode;
  const currDebugMode  = environment.CurrDevDebug; */
  debugAlert(on: boolean, caption: string, s?:string) {
    if (debugMode && on ) 
      alert('Gdb-'+caption+': '+s);
  }
  debugReq(ReqNo: number) {
    const OK=(environment.DebugMode && environment.DebugReqNum > 0 && ReqNo > 0 && ReqNo == environment.DebugReqNum);
    if (OK) console.log('[debugReq# ',ReqNo.toString()+']');
    //if (environment.DebugMode) console.log('debugReq:',OK, environment.DebugReqNum > 0 , ReqNo > 0, ReqNo == environment.DebugReqNum);
    return OK;
  }
  debugIssue(IssueNum: string) {
    const timeNum = Number(new Date()) %10000
    const OK=(environment.DebugMode && environment.DebugIssueNum !== ""  && 
      (IssueNum == environment.DebugIssueNum || IssueNum === "*") );
    if (OK) console.log('[debugIssue# ',IssueNum+']', ' Time:', timeNum);
    //if (environment.DebugMode) console.log('debugIssue:',OK, environment.DebugIssueNum, IssueNum == environment.DebugIssueNum);
    return OK;
  }
}
