import { Source, Sink, Dispose } from '../types'


class IntervalTalkback extends Dispose {
  count = 0;
  interval: NodeJS.Timer | undefined;

  constructor(
    private sink: Sink<number>,
    private period: number,
  ) {
    super()
  }

  start() {
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.sink.receive(this.count++)
      }, this.period)
    }
  }

  end() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}


export class Interval implements Source<number> {
  constructor(
    private period: number
  ) { }

  connect(sink: Sink<number>) {
    sink.greet(new IntervalTalkback(sink, this.period))
  }
}


export function interval(period: number): Source<number> {
  return new Interval(period)
}
