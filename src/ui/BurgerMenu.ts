import Rack from '../core/Rack';
import { exportRack, importRack } from '../core/RackSerializer';
import tingle from 'tingle.js';

export default class BurgerMenu {
  private rack: Rack;

  private wrapper: HTMLDivElement;

  private menu: HTMLUListElement;

  private fileInput: HTMLInputElement;

  private isOpen = false;

  constructor(rack: Rack) {
    this.rack = rack;

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'burger-menu';

    const btn = document.createElement('button');
    btn.id = 'burger-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰';

    this.menu = document.createElement('ul');
    this.menu.id = 'burger-items';
    this.menu.setAttribute('role', 'menu');
    this.menu.hidden = true;

    const importItem = document.createElement('li');
    importItem.setAttribute('role', 'menuitem');
    importItem.tabIndex = 0;
    importItem.textContent = 'Import Rack';

    const exportItem = document.createElement('li');
    exportItem.setAttribute('role', 'menuitem');
    exportItem.tabIndex = 0;
    exportItem.textContent = 'Export Rack';

    this.menu.appendChild(importItem);
    this.menu.appendChild(exportItem);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.yaml,.yml';
    this.fileInput.style.display = 'none';
    this.fileInput.setAttribute('aria-hidden', 'true');

    this.wrapper.appendChild(btn);
    this.wrapper.appendChild(this.menu);
    this.wrapper.appendChild(this.fileInput);

    // Toggle menu
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
      this.menu.hidden = !this.isOpen;
      btn.setAttribute('aria-expanded', String(this.isOpen));
    });

    // Import
    importItem.addEventListener('click', () => { this.triggerImport(); });
    importItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this.triggerImport();
    });

    // Export
    exportItem.addEventListener('click', () => { this.triggerExport(); });
    exportItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this.triggerExport();
    });

    // File selected
    this.fileInput.addEventListener('change', () => { this.handleFileSelected(); });

    // Close on outside click
    document.addEventListener('click', () => {
      if (this.isOpen) {
        this.isOpen = false;
        this.menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.body.appendChild(this.wrapper);
  }

  private closeMenu(): void {
    this.isOpen = false;
    this.menu.hidden = true;
    const btn = this.wrapper.querySelector('#burger-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  private triggerImport(): void {
    this.closeMenu();
    this.fileInput.value = '';
    this.fileInput.click();
  }

  private triggerExport(): void {
    this.closeMenu();
    const content = exportRack(this.rack);
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rack.synt.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }

  private handleFileSelected(): void {
    const file = this.fileInput.files?.[0];
    if (!file) return;

    if (!/\.(yaml|yml)$/i.test(file.name)) {
      const modal = new tingle.modal({
        footer: true,
        closeMethods: ['overlay', 'escape'],
      });
      modal.addFooterBtn('Close', 'tingle-btn tingle-btn--pull-right', () => { modal.close(); });
      modal.setContent(
        '<p style="padding:16px">Invalid file type. Please select a <code>.yaml</code> or <code>.yml</code> file.</p>',
      );
      modal.open();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        importRack(content, this.rack);
      }
    };
    reader.readAsText(file);
  }
}
