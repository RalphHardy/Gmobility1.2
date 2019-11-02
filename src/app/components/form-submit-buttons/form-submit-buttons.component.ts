import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-form-submit-buttons',
  templateUrl: './form-submit-buttons.component.html',
  styleUrls: ['./form-submit-buttons.component.scss']
})
export class FormSubmitButtonsComponent implements OnInit {
  @Input() submitBtnLabel: string;
  @Input() okToPressSubmit: boolean;
  @Input() onCancel;

  constructor() { }

  ngOnInit() {
  }

}
