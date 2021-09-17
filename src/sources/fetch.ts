import { Sink, Source, Talkback } from '../types'


class FetchTalkback implements Talkback {
  private controller = new AbortController()

  constructor(
    private source: FetchSource,
    private sink: Sink<Response>,
  ) {}

  start() {
    this.fetch()
  }

  request() {
    this.controller.abort()
    this.fetch()
  }

  fetch() {
    fetch(this.source.url, {
      ...this.source.options,
      signal: this.controller.signal,
    }).then(response => {
      this.sink.receive(response)
      this.sink.end()
    }).catch(error => this.sink.end(error))
  }

  stop() {
    this.controller.abort()
  }
}


export class FetchSource implements Source<Response> {
  constructor(
    readonly url: string | Request,
    readonly options: RequestInit = {}
  ) {}

  connect(sink: Sink<Response>) {
    sink.greet(new FetchTalkback(this, sink))
  }
}


export function fetch$(url: string | Request, options: RequestInit = {}): FetchSource {
  return new FetchSource(url, options)
}
