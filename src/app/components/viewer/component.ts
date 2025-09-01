import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  QueryList,
  resource,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';

import { DocPage, DocsApiService } from '../../docs-api.service';
import { DocPageComponent } from '../doc-page/component';
import { AnnotationModel } from '../annotation/model';

@Component({
  selector: 'doc-viewer',
  imports: [RouterLink, DocPageComponent],
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsViewerComponent {
  private readonly zoomStages = [50, 75, 100, 125, 150, 200];

  protected zoom = signal(100);

  private docsService = inject(DocsApiService);

  private route = inject(ActivatedRoute);

  private docId = toSignal<number>(this.route.params.pipe(map((params: Params) => +params['id'])));

  private docResource = resource({
    params: () => ({ id: this.docId() }),
    loader: ({ params }) => firstValueFrom(this.docsService.getDoc(params.id || 0)),
  });

  protected margin = computed(() => (20 * this.zoom()) / 100);

  protected doc = computed(() => this.docResource.value() ?? null);

  protected pages = computed(() => this.doc()?.pages ?? null);

  protected hasNextZoomStage = computed(
    () => this.zoom() < this.zoomStages[this.zoomStages.length - 1]
  );

  protected hasPrevZoomStage = computed(() => this.zoom() > this.zoomStages[0]);

  protected hasActiveAnnotation = signal(false);

  protected annotations = signal<AnnotationModel[]>([]);

  protected addAnnotationMode = signal(false);

  private pagesState = new Map<number, boolean>();

  @ViewChild('content', { read: ElementRef })
  content!: ElementRef;

  @ViewChildren('page', { read: DocPageComponent })
  pagesElements!: QueryList<DocPageComponent>;

  zoomUp(): void {
    const currentZoomIndex = this.zoomStages.indexOf(this.zoom());

    if (currentZoomIndex < this.zoomStages.length - 1) {
      this.zoom.set(this.zoomStages[currentZoomIndex + 1]);
    }
  }

  zoomDown(): void {
    const currentZoomIndex = this.zoomStages.indexOf(this.zoom());

    if (currentZoomIndex > 0) {
      this.zoom.set(this.zoomStages[currentZoomIndex - 1]);
    }
  }

  addAnnotation(): void {
    this.addAnnotationMode.set(true);
  }

  annotationAdditionCompleted(): void {
    this.addAnnotationMode.set(false);
  }

  updateSelectedState(page: DocPage, selected: boolean): void {
    this.pagesState.set(page.number, selected);
    this.hasActiveAnnotation.set(
      Array.from(this.pagesState).some(([pageNumber, selectedValue]) => selectedValue)
    );
  }

  deleteSelected(): void {
    this.pagesElements.toArray().forEach((page) => page.deleteSelected());
  }

  saveAnnotations(): void {
    if (!this.docId()) return;

    const data = this.pagesElements.toArray().flatMap((page) => page.getAnnotationsOnPage());
    this.docsService.saveAnnotationToDoc(this.docId() as number, data);
  }

  async loadAnnotations(): Promise<void> {
    if (!this.docId()) return;

    const annotations = await firstValueFrom(
      this.docsService.getAnnotationsFromDoc(this.docId() as number)
    );
    this.pagesElements.forEach((item) => item.addAnnotations(annotations));
  }
}
