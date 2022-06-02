import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  form: FormGroup;

  result: any;
  initResult: any;
  innerWidth: any;
  innerHeight: any;
  data: any;

  constructor(protected fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
    })
    this.find();
  }

  find() {
    this.invokeFind();
    this.postFind();
    this.createForm();
  }

  invokeFind() {
    // to be override by child component
  }

  createForm() {
    let resultKeys = Object.keys(this.result);
    for (const key of resultKeys) {
      this.form.addControl(key, new FormControl(this.result[key]));
    }
  }

  postFind() {
    this.initResult = cloneDeep(this.result)
    // override by child component
  }

  reset() {
    this.form.reset(this.initResult);
  }
}
