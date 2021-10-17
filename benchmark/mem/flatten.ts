import { benchmark } from './util/benchmark'

import { pipe, Subject, map, filter, flatten, of, observe } from '../../src'
import { Subject as RxSub, switchMap, filter as rxfilter, of as rxof } from 'rxjs'
import { of as cbof, map as cbmap, flatten as cbflatten, filter as cbfilter, subscribe as cbsubscribe } from 'callbag-common'
import subject from 'callbag-subject'


benchmark('flatten', {

  RxJS: () => {
    const srcs = [...Array(10_000).keys()].map(() => new RxSub<number>())
    const subs = srcs.map(s =>
      s.pipe(
        switchMap(x => rxof(x, x, x * 2, x * 3).pipe(rxfilter(y => y % 2 === 0))),
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
        cbmap(x => pipe(
          cbof(x, x, x * 2, x * 3),
          cbfilter(y => y % 2 === 0),
        )),
        cbflatten,
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
        map(x => pipe(
          of(x, x, x * 2, x * 3),
          filter(y => y % 2 === 0),
        )),
        flatten,
        observe
      )
    );

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(x => {
      srcs.forEach(s => s.receive(x))
    })

    return () => subs.forEach(s => s.stop())
  },

})
