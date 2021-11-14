import { fake, useFakeTimers } from 'sinon'
import { expect } from 'chai'
import network from 'fetch-mock'

import { fetch$ } from '../fetch'
import { Talkback } from '../../types'
import { pipe, sink, connect } from '../../util'
import { tap, observe, finalize, observeLater } from '../../sinks'


describe('fetch()', () => {
  it('should fetch given URL', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    network.get('http://example.com/', 200)

    pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    network.called('http://example.com/').should.be.true
    await clock.nextAsync()
    cb.should.have.been.calledOnce

    network.restore()
    clock.restore()
  })

  it('should send the request again on data requests.', async () => {
    const cb = fake()
    const clock = useFakeTimers()

    network.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    await clock.nextAsync()
    obs.request()
    await clock.nextAsync()
    cb.should.have.been.calledTwice

    network.restore()
    clock.restore()
  })

  it('should pass down the error.', async () => {
    const cb = fake()
    const cb2 = fake()
    const clock = useFakeTimers()

    network.get('http://example.com/', {throws: new Error('test')})

    pipe(
      fetch$('http://example.com/'),
      tap(cb),
      finalize(cb2),
      observe
    )

    await clock.nextAsync()
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce

    network.restore()
    clock.restore()
  })

  it('should be pausable / resumable', async () => {
    const cb = fake()
    const clock = useFakeTimers()
    network.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    obs.stop()
    await clock.nextAsync()
    cb.should.not.have.been.called

    obs.start()
    await clock.nextAsync()
    cb.should.have.been.calledOnce

    network.restore()
    clock.restore()
  })

  it('should requesst again when not mid-flight.', async () => {
    const cb = fake()
    const clock = useFakeTimers()
    network.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/', { headers: { 'X-Test': 'test' } }),
      tap(cb),
      observe
    )

    obs.request()
    network.calls('http://example.com/').should.have.length(1)

    await clock.nextAsync()
    obs.request()
    network.calls('http://example.com/').should.have.length(2)

    network.restore()
    clock.restore()
  })

  it('should handle bogus interrupts.', async () => {
    const cb = fake()
    const clock = useFakeTimers()
    network.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observeLater
    )

    obs.stop()
    await clock.nextAsync()
    cb.should.not.have.been.called

    network.restore()
    clock.restore()
  })

  it('should be cool with redundant stops after it has ended.', async () => {
    const cb = fake()
    const clock = useFakeTimers()
    network.get('http://example.com/', {throws: new Error('test')})

    const naggy = () => {
      let tb: Talkback

      return sink({
        greet: t => (tb = t).start(),
        end: () => {
          try {
            tb.stop()
          } catch {
            cb()
          }
        }
      })
    }

    const src = fetch$('http://example.com/')
    await expect((async () => {
      connect(src, naggy())
      await clock.nextAsync()
    })()).eventually.to.not.be.rejected

    cb.should.not.have.been.called

    network.restore()
    clock.restore()
  })
})
