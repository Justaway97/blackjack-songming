import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent extends BaseComponent {

  @Input() color: any;
  @Input() buttonType: any;
  @Input() text: any;
  @Input() rotate = 0;
  @Input() height = '20px';
  @Input() tooltip: any;
  @Input() fontSize = '20px';
  @Input() top = '0%';
  @Input() left = '0%';
  @Input() backgroundColor = 'white';
  @Input() padding = '0%';

  @Output() onClick = new EventEmitter();

  rotateDeg: string;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    this.rotateDeg = 'rotate('.concat(this.rotate.toString(), 'deg)');
  }

  btnClick() {
    this.onClick.emit(this.text);
  }

}
