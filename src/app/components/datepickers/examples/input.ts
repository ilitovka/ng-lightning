import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-demo-datepickers-input',
  templateUrl: './input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoDatepickersInput {

  value = '2010/09/30';

}
