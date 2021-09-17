import { of } from '../sources/of'
import { Source, Sink, isSource, Handler } from '../types'


export class CustomSource<T> implements Source<T> {
  constructor(private handler: Handler<Sink<T>>) {}

  connect(sink: Sink<T>) {
    return this.handler(sink)
  }
}


export function source<T>(handler: Handler<Sink<T>>): Source<T>
export function source<T>(src: Source<T>): Source<T>
export function source<T>(t: T): Source<T>
export function source<T>(src: Handler<Sink<T>> | Source<T> | T): Source<T> {
  if (typeof src === 'function') {
    return new CustomSource(src as Handler<Sink<T>>)
  } else if (isSource(src)) {
    return src
  } else {
    return of(src)
  }
}
