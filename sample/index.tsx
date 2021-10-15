/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe, iterable, share, iterate, tap, map, retry } from '../src'

pipe(
  iterable([1, 2, 3]),
  share,
  map(x => {
    if (x === 2) {
      throw new Error('error')
    }

    return x
  }),
  retry,
  tap(console.log),
  iterate,
)


