import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-menu-no-side',
  templateUrl: './menu-no-side.component.html',
  styleUrls: ['./menu-no-side.component.scss']
})
export class MenuNoSideComponent implements OnInit {
  @Input() PageTitle
  @Input() goBack
  
  constructor() { }

  ngOnInit() {
  }

}
