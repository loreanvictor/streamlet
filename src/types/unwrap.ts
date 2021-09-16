import { Sink, Source } from './base'


export type UnwrapSource<T extends Source<any>> = T extends Source<infer R> ? R : never
export type UnwrapSink<T extends Sink<any>> = T extends Sink<infer R> ? R : never
