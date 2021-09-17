import { Source, Sink, SourceFactory } from '../types'


export function connect<T>(sink: Sink<T>): SourceFactory<T>
export function connect<T>(source: Source<T>, sink: Sink<T>): Source<T>
export function connect<T>(source: Source<T> | Sink<T>, sink?: Sink<T>): Source<T> | SourceFactory<T> {
  if (sink) {
    (source as Source<T>).connect(sink)

    return source as Source<T>
  } else {
    return (src: Source<T>) => {
      src.connect(source as Sink<T>)

      return src
    }
  }
}
