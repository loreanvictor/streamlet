import { fake } from 'sinon'
import server from 'fetch-mock'
import sleep from 'sleep-promise'

import { fetch$ } from '../fetch'
import { pipe } from '../../util'
import { tap, observe, finalize, observeLater } from '../../sinks'


describe('fetch()', () => {
  it('should fetch given URL', async () => {
    const cb = fake()
    server.get('http://example.com/', 200)

    pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    server.called('http://example.com/').should.be.true
    await sleep(1)
    cb.should.have.been.calledOnce
    server.restore()
  })

  it('should send the request again on data requests.', async () => {
    const cb = fake()
    server.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    await sleep(1)
    obs.request()
    await sleep(1)
    cb.should.have.been.calledTwice
    server.restore()
  })

  it('should pass down the error.', async () => {
    const cb = fake()
    const cb2 = fake()

    server.get('http://example.com/', {throws: new Error('test')})

    pipe(
      fetch$('http://example.com/'),
      tap(cb),
      finalize(cb2),
      observe
    )

    await sleep(1)
    cb.should.not.have.been.called
    cb2.should.have.been.calledOnce

    server.restore()
  })

  it('should be pausable / resumable', async () => {
    const cb = fake()
    server.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observe
    )

    obs.stop()
    await sleep(1)
    cb.should.not.have.been.called

    obs.start()
    await sleep(1)
    cb.should.have.been.calledOnce
    server.restore()
  })

  it('should requesst again when not mid-flight.', async () => {
    const cb = fake()
    server.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/', { headers: { 'X-Test': 'test' } }),
      tap(cb),
      observe
    )

    obs.request()
    server.calls('http://example.com/').should.have.length(1)

    await sleep(1)
    obs.request()
    server.calls('http://example.com/').should.have.length(2)
    server.restore()
  })

  it('should handle bogus interrupts.', async () => {
    const cb = fake()
    server.get('http://example.com/', 200)

    const obs = pipe(
      fetch$('http://example.com/'),
      tap(cb),
      observeLater
    )

    obs.stop()
    await sleep(1)
    cb.should.not.have.been.called
  })
})
