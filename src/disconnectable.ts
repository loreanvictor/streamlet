import { Source, Sink } from './types'


export abstract class DisconnectableSource<T> implements Source<T> {
  abstract connect(sink: Sink<T>): void
  abstract disconnect(sink: Sink<T>): void
}
