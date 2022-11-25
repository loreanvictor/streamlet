import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { Subject, of, interval, iterable } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { notify } from '../notify'


describe('notify', () => {
  it('should receive one value from source.', () => {
    const cb = fake()
    notify(of(1, 2, 3), cb)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(1)
  })

  it('should handle pullables and async sources as well.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    notify(iterable([3, 2, 1]), cb)

    cb.should.have.been.calledOnce
    cb.should.have.been.calledWith(3)

    pipe(interval(100), notify(cb))
    clock.tick(300)

    cb.should.have.been.calledTwice
    cb.lastCall.should.have.been.calledWith(0)

    clock.restore()
  })

  it('should be possible to stop the notification before values come in.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const notif = notify(interval(100), cb)

    clock.tick(50)
    notif.stop()

    clock.tick(50)
    cb.should.not.have.been.called

    clock.restore()
  })

  it('should be possible to request the source through the notification.', () => {
    const request = fake()
    const src = source(sink => sink.greet(talkback({ request })))

    const notif = notify(src, () => {})
    notif.request()

    request.should.have.been.calledTwice
  })

  it('should handle bogus talkbacks.', () => {
    const src = source(sink => {
      sink.greet(undefined as any)
      sink.receive('A')
    })
    const notif = notify(src, () => {})

    expect(() => {
      notif.request()
      notif.stop()
      notif.start()
      notif.request()
    }).to.not.throw()
  })

  it('should be pausable / resumable.', () => {
    const src = new Subject()
    const cb = fake()

    const notif = notify(src, cb)

    notif.stop()
    src.receive('A')
    cb.should.not.have.been.called

    notif.start()
    src.receive('B')
    cb.should.have.been.calledOnceWith('B')
  })

  it('should support expressions.', () => {
    const cb = fake()
    const a = new Subject<number>()

    notify($ => $(a) * 2, cb)

    a.receive(1)
    a.receive(2)
    cb.should.have.been.calledOnceWith(2)
  })
})
