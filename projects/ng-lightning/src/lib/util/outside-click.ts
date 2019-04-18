import { Observable, fromEvent } from 'rxjs';
import { filter, flatMap, map, takeUntil } from 'rxjs/operators';

const isHTMLElementContainedIn = (element: HTMLElement, array?: HTMLElement[]) =>
  array ? array.some(item => item.contains(element)) : false;

const shouldCloseOnClick = (event: MouseEvent | TouchEvent, insideElements: HTMLElement[]) => {
  const element = event.target as HTMLElement;
  if ((event instanceof MouseEvent && event.button === 2)) {
    return false;
  }
  return !isHTMLElementContainedIn(element, insideElements);
};

export function listenOutsideClicks(document: any, element: HTMLElement | HTMLElement[], condition: Observable<boolean>): Observable<boolean> {
  const listenEnd = condition.pipe(filter(value => !value));
  const listenClick = fromEvent(document, 'mousedown');
  const listenStart = condition.pipe(filter(value => !!value));
  const elements: HTMLElement[] = Array.isArray(element) ? element : [element];

  return listenStart.pipe(flatMap((md) => {
    return listenClick.pipe(
      map((m: MouseEvent) => {
        return shouldCloseOnClick(m, elements);
      }),
      takeUntil(listenEnd),
    );
  }));
}
