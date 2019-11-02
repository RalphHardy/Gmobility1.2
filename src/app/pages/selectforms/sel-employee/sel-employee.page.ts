import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";
import { IonicModule, MenuController,
   ModalController, AlertController } from '@ionic/angular';

//Services
import { UtilitiesSvc } from '../../../services/utilities.svc';
import { ConnectionSvc } from '../../../services/connection.svc';
import { ApplicVarsSvc } from '../../../services/applic-vars.svc';
import { MasterTableDataSvc } from '../../../services/master-table-data.svc';
import { WorkorderDataSvc } from '../../../services/workorder-data.svc';

//Models
import { EmployeeSearchModel } from '../../../models/master-employee-model';

//Data
import { environment } from '../../../../environments/environment';
import { toDate } from '@angular/common/src/i18n/format_date';
const debugMode = environment.DebugMode;
const currDebugMode  = environment.CurrDevDebug;

@Component({
  selector: 'app-sel-employee',
  templateUrl: './sel-employee.page.html',
  styleUrls: ['./sel-employee.page.scss'],
})
export class SelEmployeePage implements OnInit {

  constructor(
    private menuCtrl: MenuController,
    private viewCtrl: ModalController,
    private utilitiesSvc: UtilitiesSvc,
    private connectionSvc: ConnectionSvc,
    private applicVarsSvc: ApplicVarsSvc,
    private masterTableDataSvc: MasterTableDataSvc) { }

  //component data
  private PageTitle: string = 'Select Employee';

  //presentation data
  //private pageFormGroup: FormGroup;

  //processing data
  searchResult: EmployeeSearchModel[] = [];
  private currItemSelected = new EmployeeSearchModel('','',0);

  /*
  setUpperCase(val: string) {
    let vStr = this.pageFormGroup.get(val).value;
    //console.log('vStr =', vStr, value);
    this.pageFormGroup.get(val).setValue(vStr.toUpperCase());
  }*/

  closePage() {
    this.currItemSelected.EmpNum = '';
    this.currItemSelected.EmpName = '';
    this.viewCtrl.dismiss(this.currItemSelected);
  }

 private loadItems(form: NgForm) {
  this.searchResult = this.masterTableDataSvc.loadSearchEmployeeArray(form.value.empNum, form.value.empName);
}

needSearchStrings(form: NgForm): boolean {
  return (form.value.empNum || form.value.empName)
}

onClickItem(form: NgForm, index: number) {
  this.currItemSelected.EmpNum = this.searchResult[index].EmpNum;
  this.currItemSelected.EmpName = this.searchResult[index].EmpName;
  //console.log('Clicked', index);
  form.setValue({empNum: this.searchResult[index].EmpNum,
    empName: this.searchResult[index].EmpName} );

  this.viewCtrl.dismiss(this.currItemSelected);
  //console.log('Clicked', index, this.searchResult[index].EmpName);
}

  ngOnInit() {
/*
    this.pageFormGroup.get('XXX').valueChanges
    .subscribe( (value )=> {
      console.log('XXX changed', value)
    } );
*/
  }

}
