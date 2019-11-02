// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
export const environment = {
  production: false,
  AppVersion: "1.2.5.23",// Nov 1 .23  // Oct 26 .22 /Oct 25 .21 Oct 23 .20  Oct 10 .19 Oct 4 .18 Oct 3 .17 Sept 29
  ApiVersion: "1.0.0.42",
  EntDbVersion: 6.8002,
  //GmobilityUrl: "http://remote1.circlegsoftware.com/api/",
  GmobilityUrl: "http://remote1.circlegsoftware.com/api/", // "http://70.78.144.148/api/",
  DebugMode: true,
  DebugIssueNum: '1900-00', // no debug = ""
  DebugReqNum: 0, // no debug = 0
  CurrDevDebug: true,
  MobileDebug: false,
  TestOffline: false,
  ResetMTs: [{mtName: "Employee", resetVersion: "1.2.3.2"}],
  firebase: {
    apiKey: "AIzaSyDrVEpIsVbdCw_fD8_MtOp4nFy6EJaC1z4",
    authDomain: "gmob-access-sites.firebaseapp.com",
    databaseURL: "https://gmob-access-sites.firebaseio.com",
    projectId: "gmob-access-sites",
    storageBucket: "",
    messagingSenderId: "440717809325",
    appId: "1:440717809325:web:64e87ac89a962e27"
  }
};


/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
