import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements ControlValueAccessor {

  @Input() startWithAnimation: boolean;

  @Output() change = new EventEmitter();

  value: any;
  constructor() { }

  ngOnInit(): void {
  }

  valueChanged(...value: any) {
    this.onChange(value);
    this.onTouched();
    this.value = value;
    this.change.emit(this.value);
  }

  // CVA implementation

  public onChange = (_: any) => { };
  public onTouched = () => { };

  // register onChange which we will call when the selected value is changed
  // so that the value is passed back to the form model
  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // sets the selected value based on the corresponding form model value
  public writeValue(value: any): void {
    this.value = value;
  }
}

