import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  inputBinding,
  output,
  outputBinding,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { DocPage } from '../../docs-api.service';
import { AnnotationComponent } from '../annotation/component';
import { AnnotationModel } from '../annotation/model';

@Component({
  selector: 'doc-page',
  imports: [],
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocPageComponent {
  size = input(100);

  addAnnotation = input(false);

  page = input.required<DocPage>();

  annotationAdditionCompleted = output<void>();

  private loaded = signal(false);

  protected width = computed(() => {
    if (!this.loaded() || !this.img) return null;

    return (this.size() / 100) * this.img.nativeElement.naturalWidth;
  });

  protected height = computed(() => {
    if (!this.loaded() || !this.img) return null;

    return (this.size() / 100) * this.img.nativeElement.naturalHeight;
  });

  protected elementRef = inject(ElementRef);

  protected init(): void {
    this.loaded.set(true);
  }

  public selectedOnPage = output<boolean>();

  private annotations = new Set<ComponentRef<AnnotationComponent>>();

  @ViewChild('img', { read: ElementRef })
  private img!: ElementRef<HTMLImageElement>;

  @ViewChild('container', { read: ViewContainerRef })
  protected annotationContainerRef!: ViewContainerRef;

  @HostListener('mousedown', ['$event'])
  mousedown(event: MouseEvent): void {
    if (this.addAnnotation()) {
      this.generateAnnotation(
        new AnnotationModel({
          pageNumber: this.page().number,
          position: {
            x: (event.offsetX / this.size()) * 100,
            y: (event.offsetY / this.size()) * 100,
          },
          width: 100,
          height: 60,
        })
      );
      this.annotationAdditionCompleted.emit();
    }
  }

  private generateAnnotation(annotationModel: AnnotationModel): void {
    const componentRef = this.annotationContainerRef.createComponent(AnnotationComponent, {
      bindings: [
        inputBinding('zoom', this.size),
        inputBinding('pageElement', () => this.elementRef),
        inputBinding('annotationModel', () => annotationModel),
        outputBinding('selectEvent', () => this.updateSelectedState()),
      ],
    });
    this.annotations.add(componentRef);
  }

  private clearAllAnnotations(): void {
    Array.from(this.annotations).forEach((componentRef) => this.deleteAnnotation(componentRef));
  }

  private deleteAnnotation(componentRef: ComponentRef<AnnotationComponent>): void {
    this.annotations.delete(componentRef);
    componentRef.destroy();
  }

  public deleteSelected(): void {
    Array.from(this.annotations).forEach((componentRef) => {
      if (componentRef.instance.selected()) {
        this.deleteAnnotation(componentRef);
      }
    });

    this.updateSelectedState();
  }

  public updateSelectedState(): void {
    this.selectedOnPage.emit(Array.from(this.annotations).some((ref) => ref.instance.selected()));
  }

  public getAnnotationsOnPage(): AnnotationModel[] {
    return Array.from(this.annotations).map((componentRef) =>
      componentRef.instance.getUpdatedAnnotationModel()
    );
  }

  public addAnnotations(annotations: AnnotationModel[]): void {
    this.clearAllAnnotations();
    annotations
      .filter((item) => item.pageNumber === this.page().number)
      .forEach((item) => this.generateAnnotation(item));
  }
}
