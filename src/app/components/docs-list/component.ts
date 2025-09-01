import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DocsApiService } from '../../docs-api.service';

@Component({
  selector: 'docs-list',
  imports: [RouterLink],
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsListComponent implements OnInit {
  private docsService = inject(DocsApiService);

  private docsResource = resource({
    loader: () => firstValueFrom(this.docsService.getDocsList()),
  });

  protected docs = computed(() => this.docsResource.value() ?? null);

  ngOnInit() {}
}
