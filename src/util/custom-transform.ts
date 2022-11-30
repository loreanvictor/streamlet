import { from } from '../sources'
import { Source, Sourceable, SourceableMapping, isSourceable, USourceableFactory } from '../types'


export function transform<T, U, Args extends unknown[]>(
  fn: (src: Source<T>, ...args: Args) => Sourceable<U>,
  minargs = fn.length,
) {
  function F(...args: Args): SourceableMapping<T, U>
  function F(src: Sourceable<T>, ...args: Args): Source<U>
  function F(...args: any[]) {
    if (args.length >= minargs && isSourceable(args[0])) {
      return from(fn(from(args[0]), ...args.slice(1) as Args))
    } else {
      return (src: Sourceable<T>) => from(fn(from(src), ...args as Args))
    }
  }

  return F
}

export type UTransform<Args extends unknown[]> = {
  <T>(src: Sourceable<T>, ...args: Args): Source<T>
  (...args: Args): USourceableFactory
}

