import { benchmark } from './util/benchmark'

import { pipe, Subject, map, filter, observe } from '../../src'
import { Subject as RxSub, map as rxmap, filter as rxfilter } from 'rxjs'
import { map as cbmap, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'
import subject from 'callbag-subject'


benchmark('simple', {

  RxJS: () => {
    const srcs = [...Array(10_000).keys()].map(() => new RxSub<number>())
    const subs = srcs.map(s =>
      s.pipe(
        rxmap(x => x * 3),
        rxfilter(x => x % 2 === 0)
      )
        .subscribe()
    );

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
      srcs.forEach(s => s.next(x))
    })

    return () => subs.forEach(s => s.unsubscribe())
  },

  Callbags: () => {
    const srcs = [...Array(10_000).keys()].map(() => subject<number>())
    const subs = srcs.map(s =>
      pipe(
        s,
        cbmap(x => x * 3),
        cbfilter(x => x % 2 === 0),
        cbsubscribe(() => {})
      )
    );

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
      srcs.forEach(s => s(1, x))
    })

    return () => subs.forEach(s => s())
  },

  Streamlets: () => {
    const srcs = [...Array(10_000).keys()].map(() => new Subject<number>())
    const subs = srcs.map(s =>
      pipe(
        s,
        map(x => x * 3),
        filter(x => x % 2 === 0),
        observe
      )
    );

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
      srcs.forEach(s => s.receive(x))
    })

    return () => subs.forEach(s => s.stop())
  },

})
