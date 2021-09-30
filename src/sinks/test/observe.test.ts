/* eslint-disable no-unused-expressions */

import { expect } from 'chai'
import { fake, useFakeTimers } from 'sinon'

import { of, interval } from '../../sources'
import { pipe, source, talkback } from '../../util'
import { tap } from '../tap'
import { observe, observeLater } from '../observe'
import { iterate } from '../iterate'


describe('observe()', () => {
  it('should listen on listenable sources.', () => {
    const cb = fake()

    pipe(
      of(1, 2, 3),
      tap(cb),
      observe,
    )

    cb.should.have.been.calledThrice
    cb.getCall(1).args.should.deep.equal([2])
  })

  it('should not pull the source on its own.', () => {
    const request = fake()
    const src = source(sink => sink.greet(talkback({ request })))

    iterate(src)
    request.should.have.been.calledOnce

    request.resetHistory()
    observe(src)
    request.should.not.have.been.called
  })

  it('should return an observation that can be stopped mid-flight.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = pipe(interval(2), tap(cb))
    const obs = observe(src)

    clock.tick(4)
    obs.stop()
    cb.should.have.been.calledTwice

    clock.tick(8)
    cb.should.have.been.calledTwice
  })

  it('should return an observation that will pass requests to source.', () => {
    const request = fake()
    const src = source(sink => sink.greet(talkback({ request })))

    observe(src).request()
    request.should.have.been.calledOnce
  })

  it('should return an observation that can be resumed if the source supports it.', () => {
    const cb = fake()
    const clock = useFakeTimers()

    const src = pipe(interval(2), tap(cb))
    const obs = observe(src)

    clock.tick(4)
    obs.stop()
    cb.should.have.been.calledTwice

    clock.tick(8)
    cb.should.have.been.calledTwice
    obs.start()

    clock.tick(4)
    cb.callCount.should.equal(4)
    obs.stop()
  })

  it('should handle redundant greets.', () => {
    const s1 = fake()
    const s2 = fake()
    const t1 = talkback({ start: s1 })
    const t2 = talkback({ start: s2 })

    const src = source(sink => { sink.greet(t1); sink.greet(t2) })
    observe(src)

    s1.should.have.been.calledOnce
    s2.should.not.have.been.called
  })

  it('should handle a bogus talkback.', () => {
    const src = source(sink => sink.greet(undefined as any))
    const obs = observe(src)

    expect(() => {
      obs.start()
      obs.request()
      obs.stop()
    }).to.not.throw()
  })
})

describe('observeLater()', () => {
  it('should return a delayed observation.', () => {
    const cb = fake()
    const src = pipe(of(1, 2, 3), tap(cb))
    const obs = observeLater(src)

    cb.should.not.have.been.called
    obs.start()
    cb.should.have.been.calledThrice
  })

  it('should auto start when request is called.', () => {
    const start = fake()
    const src = source(sink => sink.greet(talkback({ start })))
    const obs = observeLater(src)

    start.should.not.have.been.called
    obs.request()
    start.should.have.been.calledOnce
  })
})
