import { Component, input, output, EventEmitter, Signal } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [NgIf],
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss'],
})
export class UiInputComponent {
  type = input<string>('text');
  placeholder = input<string>('');
  label = input<string | undefined>(undefined);
  value = input<string>('');
  valueChange = output<string>();

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
