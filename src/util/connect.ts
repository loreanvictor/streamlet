import { from } from '../sources/expr'
import { Sink, Sourceable, SourceableSinkFactory } from '../types'


export function connect<T, S extends Sink<T>>(sink: S): SourceableSinkFactory<T, S>
export function connect<T, S extends Sink<T>>(source: Sourceable<T>, sink: S): S
export function connect<T, S extends Sink<T>>(source: Sourceable<T> | S, sink?: S): S | SourceableSinkFactory<T, S> {
  if (sink) {
    from(source as Sourceable<T>).connect(sink)

    return sink
  } else {
    return (src: Sourceable<T>) => connect(src, source as S)
  }
}
