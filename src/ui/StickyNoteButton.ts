export default class StickyNoteButton {
  constructor() {
    const btn = document.createElement('button');
    btn.id = 'sticky-note-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Add sticky note');
    btn.textContent = '\u2712';

    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('synt:create-sticky-note', { bubbles: true }));
    });

    document.body.appendChild(btn);
  }
}
