import { Component, Input, ChangeDetectionStrategy, ElementRef, Renderer2, TemplateRef,
         forwardRef, ChangeDetectorRef, HostBinding, Output, EventEmitter, HostListener,
         ViewChild, OnInit, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { uniqueId, trapEvent } from '../../util/util';
import { InputBoolean } from '../../util/convert';
import { HostService } from '../../common/host/host.service';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { DOWN_ARROW, ESCAPE, UP_ARROW } from '@angular/cdk/keycodes';
import { BehaviorSubject } from 'rxjs';
import { NglDatepicker } from '../datepicker';
import { listenOutsideClicks } from '../../util/outside-click';
import { NglDateAdapter } from '../adapters/date-fns-adapter';
import Popper from 'popper.js';

const NGL_DATEPICKER_INPUT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NglDatepickerInput),
  multi: true
};

@Component({
  selector: 'ngl-datepicker-input',
  templateUrl: './datepicker-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NGL_DATEPICKER_INPUT_VALUE_ACCESSOR, HostService],
})
export class NglDatepickerInput implements ControlValueAccessor, OnInit, OnChanges {

  /**
   * Label that appears above the Slider.
   */
  @Input() label: string | TemplateRef<any>;

  @Input() placeholder = '';

  @Input() format = 'big-endian';

  @Input() delimiter = '/';

  /**
   * Whether the slider is disabled.
   */
  @Input() @InputBoolean() disabled: boolean;

  @Input() @InputBoolean() readonlyInput = false;

  @Input() align: 'left' | 'right' = 'left';

  /**
   * Message to display when there is in an error state.
   */
  @Input() @InputBoolean() error: boolean;

  @HostBinding('class.slds-has-error')
  get hasError() {
    return !!this.error || (this.inputEl.nativeElement.value && this.inputEl.nativeElement.value !== this.value);
  }

  @Input() set value(value: string | null) {
    if (value === this._value) {
      return;
    }
    this._value = value || '';

    const date = this.value ? this.dateParse(this.value) : null;
    if (date) {
      this.date = date;
      this.inputEl.nativeElement.value = this.value;
    }
  }
  get value(): string | null {
    return this._value;
  }

  @Output() valueChange = new EventEmitter<string | null>();

  @ViewChild('inputEl') inputEl: ElementRef;

  @ViewChild('popupEl') datepicker: NglDatepicker;

  uid = uniqueId('datepicker-input');

  private popperInstance: Popper;

  private pattern: string;

  /** The class that traps and manages focus within the dialog. */
  private focusTrap: FocusTrap;

  set open(open: boolean) {
    this._open.next(open);
  }
  get open() {
    return this._open.value;
  }

  private _open = new BehaviorSubject(false);

  private _value: string | null = null;

  // Calendar date
  date: Date;

  constructor(private element: ElementRef, private renderer: Renderer2,
              private cd: ChangeDetectorRef, private hostService: HostService,
              private adapter: NglDateAdapter, @Inject(DOCUMENT) private document: any,
              private focusTrapFactory: FocusTrapFactory) {
    this.renderer.addClass(this.element.nativeElement, 'slds-form-element');
    this.renderer.addClass(this.element.nativeElement, 'slds-dropdown-trigger');
    this.renderer.addClass(this.element.nativeElement, 'slds-dropdown-trigger_click');
  }

  onChange: Function | null = null;

  onTouched = () => {};

  writeValue(value: string) {
    this.value = value;
    this.cd.markForCheck();
  }

  registerOnChange(fn: (value: any) => any): void { this.onChange = fn; }

  registerOnTouched(fn: () => any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean) { this.disabled = isDisabled; }

  /** Handles blur events on the input. */
  onBlur() {
    this.onTouched();
  }

  ngOnInit() {
    this._open.subscribe(() => {
      this.setHostClass();
      this.cd.markForCheck();
    });

    listenOutsideClicks(this.document, this.datepicker.element.nativeElement, this._open).subscribe((close: boolean) => {
      if (close) {
        this.closeCalendar(false);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.format || changes.delimiter) {
      this.getPattern();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyboard(evt: KeyboardEvent) {
    const keyCode = evt.keyCode;

    if (keyCode === ESCAPE) {
      this.closeCalendar();
    }
  }

  onKeyboardInput(evt: KeyboardEvent) {
    const keyCode = evt.keyCode;

    if (!this.open && (keyCode === DOWN_ARROW || keyCode === UP_ARROW)) {
      trapEvent(evt);
      this.openCalendar();
    }
  }

  onInput(value: string) {
    const date = this.dateParse(value);
    this.emitSelection(date ? value : null);
  }

  openCalendar() {
    if (this.open) return;

    this.createPopper();

    this.open = true;

    this.focusTrap = this.focusTrapFactory.create(this.datepicker.element.nativeElement);
    this.datepicker.focusActiveDay();
  }

  createPopper() {
    const reference = this.inputEl.nativeElement;
    const popper = this.datepicker.element.nativeElement;
    this.popperInstance = new Popper(reference, popper, {
      placement: this.align === 'left' ? 'bottom-start' : 'bottom-end',
      // eventsEnabled,
      // modifiers,
    });
  }

  closeCalendar(focusInput = true) {
    this.open = false;

    if (this.popperInstance) {
      this.popperInstance.disableEventListeners();
      this.popperInstance.destroy();
      this.popperInstance = null;
    }

    if (this.focusTrap) {
      this.focusTrap.destroy();
    }

    if (focusInput) {
      this.inputEl.nativeElement.focus();
    }
  }

  pickerSelection(date: Date) {
    this.emitSelection(this.dateFormat(date));
    this.closeCalendar();
  }

  private dateParse(value: string) {
    return this.adapter.parse(value, this.getPattern());
  }

  private dateFormat(date: Date) {
    return this.adapter.format(date, this.getPattern());
  }

  private getPattern() {
    if (!this.pattern) {
      this.pattern = this.adapter.pattern(this.format, this.delimiter);
    }
    return this.pattern;
  }

  private emitSelection(value: string) {
    this.valueChange.emit(value);

    if (this.onChange) {
      this.value = value;
      this.onChange(value);
    }
  }

  private setHostClass() {
    this.hostService.updateClass(this.element, {
      [`slds-is-open`]: this.open,
    });
  }
}
