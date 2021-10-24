import { Source, SourceMapping, isSource } from '../types'


export function transform<T, U, Args extends unknown[]>(
  fn: (src: Source<T>, ...args: Args) => Source<U>,
  minargs = 1,
) {
  function F(...args: Args): SourceMapping<T, U>
  function F(src: Source<T>, ...args: Args): Source<U>
  function F(...args: any[]) {
    if (args.length >= minargs && isSource(args[0])) {
      return (fn as any)(...args)
    } else {
      return (src: Source<T>) => (fn as any)(src, ...args)
    }
  }

  return F
}
