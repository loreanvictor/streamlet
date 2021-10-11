import { Source, Sink, SinkFactory } from '../types'


export function connect<T, S extends Sink<T>>(sink: S): SinkFactory<T, S>
export function connect<T, S extends Sink<T>>(source: Source<T>, sink: S): S
export function connect<T, S extends Sink<T>>(source: Source<T> | S, sink?: S): S | SinkFactory<T, S> {
  if (sink) {
    (source as Source<T>).connect(sink)

    return sink
  } else {
    return (src: Source<T>) => connect(src, source as S)
  }
}
