type PointPosition = {
  x: number;
  y: number;
};

export class AnnotationModel {
  pageNumber: number;

  position: PointPosition;

  width: number;

  height: number;

  text: string;

  constructor(item: {
    pageNumber: number;
    position: PointPosition;
    width: number;
    height: number;
    text?: string;
  }) {
    this.pageNumber = item.pageNumber;
    this.position = item.position;
    this.width = item.width;
    this.height = item.height;
    this.text = item.text ?? '';
  }
}
