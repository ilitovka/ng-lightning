import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-demo-datepickers-format',
  templateUrl: './format.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoDatepickersFormat {

  value1 = '30/9/2010'; // little-endian

  value2 = '08-11-2013'; // middle-endian with "-"

  value3 = '2014.9.23'; // yyyy.MM.dd

}
