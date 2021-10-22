import { Source, Sink, Dispose } from '../types'


class IntervalTalkback extends Dispose {
  count = 0
  interval: NodeJS.Timer | undefined
  leftover: NodeJS.Timer | undefined
  runFlag = -1
  startFlag = -1
  remainder = 0
  step: () => void

  // TODO: I'm unhappy that we need this. we shouldn't need this.
  stopped = true

  constructor(
    private sink: Sink<number>,
    private period: number,
  ) {
    super()
    this.step = () => this.sink.receive(this.count++)
  }

  start() {
    this.stopped = false
    this.startFlag = new Date().getTime()

    if (this.remainder > 0) {
      this.leftover = setTimeout(() => {
        this.step()
        this._run()
      }, this.remainder)
    } else {
      this._run()
    }
  }

  _run() {
    if (!this.stopped) {
      this.runFlag = new Date().getTime()
      this.leftover = undefined
      if (this.interval === undefined) {
        this.interval = setInterval(() => {
          this.step()
        }, this.period)
      }
    }
  }


  stop() {
    this.stopped = true

    if (this.interval !== undefined) {
      clearInterval(this.interval)
      this.interval = undefined
      this.remainder = (this.period - ((new Date().getTime() - this.runFlag) % this.period)) % this.period
    }

    if (this.leftover !== undefined) {
      clearTimeout(this.leftover)
      this.leftover = undefined
      this.remainder -= new Date().getTime() - this.startFlag
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
