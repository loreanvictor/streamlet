import { Source } from './base'


export const SKIP = Symbol('SKIP')


export type TrackFunc = {
  <T>(source: Sourceable<T>): T
  n<T>(source: Sourceable<T>): T | undefined
  on(...sources: Source<unknown>[]): void
}
export type ExprFunc<R = unknown> = ($: TrackFunc, _: TrackFunc) => R | typeof SKIP | Promise<R | typeof SKIP>
export type Sourceable<T> = Source<T> | ExprFunc<T>
