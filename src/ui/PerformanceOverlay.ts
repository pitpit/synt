import Rack from '../core/Rack';

interface OverlayElements {
  root: HTMLDivElement;
  badge: HTMLButtonElement;
  details: HTMLDivElement;
}

export default class PerformanceOverlay {
  private static readonly SAMPLE_INTERVAL_MS = 500;

  private readonly rack: Rack;

  private readonly elements: OverlayElements;

  private lastFrameTs = 0;

  private sampleStartTs = 0;

  private sampleFrames = 0;

  private fps = 0;

  private frameMs = 0;

  private rafId: number | null = null;

  private detailsVisible = false;

  constructor(rack: Rack) {
    this.rack = rack;
    this.elements = this.createElements();
    this.bindEvents();
    this.start();
  }

  private createElements(): OverlayElements {
    const root = document.createElement('div');
    root.id = 'perf-overlay';

    const badge = document.createElement('button');
    badge.id = 'perf-overlay-badge';
    badge.type = 'button';
    badge.textContent = 'FPS --';
    badge.setAttribute('aria-label', 'Toggle performance overlay details');

    const details = document.createElement('div');
    details.id = 'perf-overlay-details';
    details.hidden = true;

    root.appendChild(badge);
    root.appendChild(details);
    document.body.appendChild(root);

    return { root, badge, details };
  }

  private bindEvents(): void {
    this.elements.badge.addEventListener('click', () => {
      this.detailsVisible = !this.detailsVisible;
      this.elements.details.hidden = !this.detailsVisible;
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'd') return;
      this.detailsVisible = !this.detailsVisible;
      this.elements.details.hidden = !this.detailsVisible;
    });
  }

  private start(): void {
    this.lastFrameTs = performance.now();
    this.sampleStartTs = this.lastFrameTs;

    const tick = (timestamp: number): void => {
      const delta = timestamp - this.lastFrameTs;
      this.lastFrameTs = timestamp;
      this.frameMs = delta;
      this.sampleFrames += 1;

      const sampleElapsed = timestamp - this.sampleStartTs;
      if (sampleElapsed >= PerformanceOverlay.SAMPLE_INTERVAL_MS) {
        this.fps = Math.round((this.sampleFrames * 1000) / sampleElapsed);
        this.sampleFrames = 0;
        this.sampleStartTs = timestamp;
        this.render();
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private render(): void {
    this.elements.badge.textContent = `FPS ${String(this.fps)}`;

    if (!this.detailsVisible) return;

    const scale = this.rack.stage.scaleX();
    const x = this.rack.stage.x();
    const y = this.rack.stage.y();
    const layers = this.rack.stage.getLayers().length;
    const libraryStatus = this.rack.library === null ? 'absent' : 'ready';

    this.elements.details.textContent = [
      `Frame ${this.frameMs.toFixed(1)} ms`,
      `Stage scale ${scale.toFixed(2)}`,
      `Stage pos ${x.toFixed(0)}, ${y.toFixed(0)}`,
      `Layers ${String(layers)} | Mods ${String(this.rack.mods.length)} | Notes ${String(this.rack.annotations.length)}`,
      `Library ${libraryStatus}`,
    ].join('\n');
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.elements.root.remove();
  }
}
