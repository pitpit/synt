import tingle from 'tingle.js';
import EventEmitter from 'eventemitter3';

export default class Modal {
  modal: tingle.modal;

  readonly events: EventEmitter = new EventEmitter();

  constructor() {
    this.modal = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'escape'],
    });
    this.modal.addFooterBtn('Save', 'tingle-btn tingle-btn--primary tingle-btn--pull-right', () => {
      this.events.emit('save');
      this.modal.close();
    });
    this.modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--pull-right', () => {
      this.modal.close();
    });
  }

  setContent(html: string): void {
    this.modal.setContent(html);
  }

  open(): void {
    this.modal.open();
  }
}
