import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-demo-datepickers-validation',
  templateUrl: './validation.html',
})
export class DemoDatepickersValidation {

  ctrl = new FormControl('', [Validators.required, (control: FormControl) => {
    if (!control.value) {
      return null;
    }

    const [, month, day] = control.value.split('/').map(Number);

    if (month !== 1 || day !== 10) {
      return { noMatch: true };
    }

    return null;
  }]);

}
