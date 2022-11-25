import { Source, Sink } from './base'
import { Sourceable } from './expr'


export type Handler<T> = (t: T) => void
export type Condition<T> = (t: T) => boolean
export type Equals<T, U=T> = (t: T, u: U) => boolean
export type Accumulator<I, O = I> = (acc: O, value: I) => O
export type TypeCondition<T, W extends T> = (t: T) => t is W
export type Mapping<I, O> = (i: I) => O
export type SourceMapping<I, O> = Mapping<Source<I>, Source<O>>
export type SourceableMapping<I, O> = Mapping<Sourceable<I>, Source<O>>
export type USourceFactory = <T>(source: Source<T>) => Source<T>
export type USourceableFactory = <T>(source: Sourceable<T>) => Source<T>
export type SourceFactory<T, S extends Source<T> = Source<T>> = (source: Source<T>) => S
export type SourceableFactory<T, S extends Source<T> = Source<T>> = (source: Sourceable<T>) => S
export type SinkFactory<T, S extends Sink<T> = Sink<T>> = (source: Source<T>) => S
