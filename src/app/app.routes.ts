import { Routes } from '@angular/router';

import { DocsViewerComponent } from './components/viewer';
import { DocsListComponent } from './components/docs-list/component';

export const routes: Routes = [
  { path: '', component: DocsListComponent },
  { path: 'doc/:id', component: DocsViewerComponent },
];
