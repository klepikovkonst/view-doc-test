import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AnnotationModel } from './components/annotation/model';

export interface Doc {
  id: number;
  name: string;
}

export interface DocItem {
  name: string;
  pages: DocPage[];
}

export interface DocPage {
  number: number;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class DocsApiService {
  private http = inject(HttpClient);

  getDocsList(): Observable<Doc[]> {
    return this.http.get<Doc[]>('resources/docs.json');
  }

  getDoc(id: number): Observable<DocItem | null> {
    if (!id) return of(null);

    const url = `resources/${id}.json`;

    return this.http.get<DocItem>(url);
  }

  saveAnnotationToDoc(docId: number, annotations: AnnotationModel[]): void {
    localStorage.setItem(`doc${docId}Annotations`, JSON.stringify(annotations));
  }

  getAnnotationsFromDoc(docId: number): Observable<AnnotationModel[]> {
    try {
      const data = JSON.parse(String(localStorage.getItem(`doc${docId}Annotations`)));

      return of(data.map((item: any) => new AnnotationModel(item)));
    } catch {
      throw Error();
    }
  }
}
