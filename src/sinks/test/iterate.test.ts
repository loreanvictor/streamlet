import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'

import { iterable, interval } from '../../sources'
import { pullrate } from '../../transforms'
import { tap } from '../tap'
import { pipe, source, talkback } from '../../util'
import { iterate, iterateLater } from '../iterate'


describe('iterate()', () => {
  it('should pull values from a pullable source.', () => {
    const cb = fake()

    const src = pipe(iterable([1, 2, 3]), tap(cb))
    iterate(src)

    cb.should.have.been.calledThrice
    cb.getCall(2).args[0].should.equal(3)
  })

  it('should also listen to listenable sources.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = tap(interval(100), cb)
    iterate(src)

    clock.tick(200)
    cb.should.have.been.calledTwice
    clock.restore()
  })

  it('should return an iteration that can be stopped and restarted.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = pipe(iterable([1, 2, 3, 4]), pullrate(1), tap(cb))
    const iter = iterate(src)

    cb.should.not.have.been.called

    clock.tick(1)
    cb.should.have.been.calledOnce
    clock.tick(1)
    cb.should.have.been.calledTwice

    iter.stop()
    clock.tick(10)
    cb.should.have.been.calledTwice

    iter.start()
    clock.tick(1)
    cb.should.have.been.calledThrice
    clock.tick(1)
    cb.callCount.should.equal(4)
    clock.restore()
  })

  it('should return an observation that can be used to invoke further requests.', () => {
    const request = fake()

    const src = source(sink => sink.greet(talkback({
      request,
      start() { sink.receive('A') }
    })))
    const iter = iterate(src)

    request.should.have.been.calledTwice

    iter.request()
    request.should.have.been.calledThrice
  })

  it('should handle redundant greets.', () => {
    const s1 = fake()
    const s2 = fake()
    const t1 = talkback({ start: s1 })
    const t2 = talkback({ start: s2 })

    const src = source(sink => { sink.greet(t1); sink.greet(t2) })
    iterate(src)

    s1.should.have.been.calledOnce
    s2.should.not.have.been.called
  })

  it('should handle a bogus talkback.', () => {
    const src = source(sink => {
      sink.greet(undefined as any)
      sink.receive('A')
    })
    const iter = iterate(src)

    expect(() => {
      iter.start()
      iter.request()
      iter.stop()
    }).to.not.throw()
  })
})


describe('iterateLater()', () => {
  it('should return a delayed iteration.', () => {
    const cb = fake()

    const src = pipe(iterable([1, 2, 3]), tap(cb))
    const iter = iterateLater(src)

    cb.should.not.have.been.called
    iter.start()
    cb.should.have.been.calledThrice
  })

  it('should auto start when request is called.', () => {
    const start = fake()
    const src = source(sink => sink.greet(talkback({ start })))
    const iter = iterateLater(src)

    start.should.not.have.been.called
    iter.request()
    start.should.have.been.calledOnce
  })
})
