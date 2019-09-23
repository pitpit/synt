import tingle from 'tingle.js';

export default class Modal {
  modal: tingle.modal;

  constructor() {
    // eslint-disable-next-line new-cap
    this.modal = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'escape'],
    });
    this.modal.addFooterBtn('Save', 'tingle-btn tingle-btn--primary tingle-btn--pull-right', () => {
      this.modal.close();
    });
    this.modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--pull-right', () => {
      this.modal.close();
    });
    this.modal.setContent('<h1>Title</h1><p>ok</p>');
  }

  open(): void {
    this.modal.open();
  }
}
