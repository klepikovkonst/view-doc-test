import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnnotationModel } from './model';

@Component({
  selector: 'annotation',
  imports: [FormsModule],
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationComponent {
  zoom = input.required<number>();

  pageElement = input.required<ElementRef>();

  annotationModel = input.required<AnnotationModel>();

  selectEvent = output<boolean>();

  protected top = linkedSignal({
    source: this.annotationModel,
    computation: (source) => {
      if (this.normalizeZoomValue(this.pageHeight()) < source.position.y + source.height) {
        return this.normalizeZoomValue(this.pageHeight()) - source.height;
      }

      return source.position.y;
    },
  });

  protected left = linkedSignal({
    source: this.annotationModel,
    computation: (source) => {
      if (this.normalizeZoomValue(this.pageWidth()) < source.position.x + source.width) {
        return this.normalizeZoomValue(this.pageWidth()) - source.width;
      }

      return source.position.x;
    },
  });

  private width = linkedSignal(() => this.annotationModel().width);

  private height = linkedSignal(() => this.annotationModel().height);

  protected calculatedWidth = computed(() => this.updateValueWithZoom(this.width()) + 'px');

  protected calculatedHeight = computed(() => this.updateValueWithZoom(this.height()) + 'px');

  private pageWidth = computed(() => {
    if (!this.zoom()) return null;

    return this.pageElement().nativeElement.clientWidth;
  });

  private pageHeight = computed(() => {
    if (!this.zoom()) return null;

    return this.pageElement().nativeElement.clientHeight;
  });

  public selected = signal(false);

  private elementRef = inject(ElementRef);

  protected resizeMode = signal(false);

  protected dragMode = signal(false);

  protected text = signal('');

  private dragPoint?: { x: number; y: number };

  private minWidth = computed(() => this.updateValueWithZoom(50));

  private minHeight = computed(() => this.updateValueWithZoom(25));

  @HostBinding('style.top')
  protected get topPosition(): string {
    const topPosition = this.updateValueWithZoom(this.top());

    return topPosition + 'px';
  }

  @HostBinding('style.left')
  protected get leftPosition(): string {
    const leftPosition = this.updateValueWithZoom(this.left());

    return leftPosition + 'px';
  }

  @HostListener('document:mousemove', ['$event'])
  protected mouseMove(event: MouseEvent): void {
    if (this.dragMode()) {
      this.setTopOffset(
        this.top() + this.normalizeZoomValue(event.pageY - (this.dragPoint?.y || 0))
      );
      this.setLeftOffset(
        this.left() + this.normalizeZoomValue(event.pageX - (this.dragPoint?.x || 0))
      );
      this.dragPoint = { x: event.pageX, y: event.pageY };
    }
    if (this.resizeMode()) {
      this.setHeight(
        this.height() + this.normalizeZoomValue(event.pageY - (this.dragPoint?.y || 0))
      );
      this.setWidth(this.width() + this.normalizeZoomValue(event.pageX - (this.dragPoint?.x || 0)));
      this.dragPoint = { x: event.pageX, y: event.pageY };
    }
  }

  private setHeight(height: number): void {
    if (height <= this.minHeight()) return;
    if (this.top() + height >= this.normalizeZoomValue(this.pageHeight())) return;

    this.height.set(height);
  }

  private setWidth(width: number): void {
    if (width <= this.minWidth()) return;
    if (this.left() + width >= this.normalizeZoomValue(this.pageWidth())) return;

    this.width.set(width);
  }

  private setTopOffset(top: number): void {
    if (top <= 0) return;
    if (top >= this.normalizeZoomValue(this.pageHeight()) - this.height()) return;

    this.top.set(top);
  }

  private setLeftOffset(left: number): void {
    if (left <= 0) return;
    if (left >= this.normalizeZoomValue(this.pageWidth()) - this.width()) return;

    this.left.set(left);
  }

  @HostListener('document:click', ['$event'])
  protected onClick(event: Event): void {
    const selected = this.elementRef.nativeElement.contains(event.target);

    if (this.selected() !== selected) {
      this.selected.set(selected);
      this.selectEvent.emit(selected);
    }
  }

  @HostListener('document:mouseup')
  protected mouseUp(): void {
    this.dragMode.set(false);
    this.resizeMode.set(false);
  }

  private updateValueWithZoom(value: number): number {
    return (value * this.zoom()) / 100;
  }

  private normalizeZoomValue(value: number): number {
    return (value * 100) / this.zoom();
  }

  protected dragStart(event: MouseEvent): void {
    this.dragMode.set(true);
    this.dragPoint = { x: event.pageX, y: event.pageY };
  }

  protected resizeStart(event: MouseEvent): void {
    this.resizeMode.set(true);
    this.dragPoint = { x: event.pageX, y: event.pageY };
  }

  protected updateText($event: Event): void {
    const target = $event.target as HTMLElement;
    this.text.set(target.innerHTML);
  }

  public getUpdatedAnnotationModel(): AnnotationModel {
    return new AnnotationModel({
      pageNumber: this.annotationModel().pageNumber,
      position: { x: this.left(), y: this.top() },
      width: this.width(),
      height: this.height(),
      text: this.text(),
    });
  }
}
