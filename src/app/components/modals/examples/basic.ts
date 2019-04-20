import { Component } from '@angular/core';

@Component({
  selector: 'app-demo-modals-basic',
  templateUrl: './basic.html',
})
export class DemoModalsBasic {

  opened = false;
  size = '';
  value = '2010/09/30';

  noHeader = false;
  hasTagline = false;
  noFooter = false;
  directional = false;

  open() {
    this.opened = !this.opened;
  }

  cancel() {
    this.opened = false;
  }
}
