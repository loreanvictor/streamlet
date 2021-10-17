import { benchmark } from './util/benchmark'

import { pipe, Subject, of, map, flatten, filter, observe } from '../../src'
import { Subject as RxSub, of as rxof, switchMap, filter as rxfilter } from 'rxjs'
import { of as cbof, map as cbmap, flatten as cbflatten, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'
import subject from 'callbag-subject'


benchmark('multicast', {

  RxJS: () => {
    const s = new RxSub<number>()
    const o = s.pipe(
      switchMap(x => rxof(x, x, x * 2, x * 3).pipe(
        rxfilter(y => y % 2 === 0),
      ))
    )

    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()
    o.subscribe()

    for (let i = 0; i < 10; i++) { s.next(i) }
    s.complete()
  },

  Callbags: () => {
    const s = subject<number>()

    const o = pipe(
      s,
      cbmap(x => pipe(
        cbof(x, x, x * 2, x * 3),
        cbfilter(y => y % 2 === 0)
      )),
      cbflatten,
    )

    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)
    cbsubscribe(() => {})(o)

    for (let i = 0; i < 10; i++) { s(1, i) }
    s(2)
  },

  Streamlets: () => {
    const sub = new Subject<number>()

    const o = pipe(
      sub,
      map(x => pipe(
        of(x, x, x * 2, x * 3),
        filter(y => y % 2 === 0),
      )),
      flatten,
    )

    observe(o)
    observe(o)
    observe(o)
    observe(o)
    observe(o)
    observe(o)
    observe(o)
    observe(o)
    observe(o)

    for (let i = 0; i < 10; i++) { sub.receive(i) }
    sub.end()
  },
})
