import { Observable, fromEvent } from 'rxjs';
import { filter, flatMap, map, takeUntil, tap, switchMap } from 'rxjs/operators';

const isHTMLElementContainedIn = (element: HTMLElement, array?: HTMLElement[]) =>
  array ? array.some(item => item.contains(element)) : false;

const shouldCloseOnClick = (event: MouseEvent | TouchEvent, insideElements: HTMLElement[]) => {
  const element = event.target as HTMLElement;
  console.log('targer', element);
  if ((event instanceof MouseEvent && event.button === 2)) {
    return false;
  }
  return !isHTMLElementContainedIn(element, insideElements);
};

export function listenOutsideClicks(document: any, element: HTMLElement | HTMLElement[], condition: Observable<boolean>): Observable<boolean> {
  const elements: HTMLElement[] = Array.isArray(element) ? element : [element];

  const listenClick = fromEvent(document, 'mousedown');
  const listenStart = condition.pipe(filter(value => !!value));
  const listenEnd = condition.pipe(filter(value => !value), tap(() => console.log('stop')));

  return listenStart.pipe(switchMap(() => {
    console.log('i start looknig');
    return listenClick.pipe(
      map((m: MouseEvent) => {
        return shouldCloseOnClick(m, elements);
      }),
      takeUntil(listenEnd),
    );
  }));
}
