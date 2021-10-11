/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  iterable, iterate, tap, share, pullrate,
} from '../src'


const shared = share(iterable([1, 2, 3, 4]))

pipe(
  shared,
  pullrate(1000),
  tap(console.log),
  iterate
)

pipe(
  shared,
  tap(x => console.log('X:: ' + x)),
  iterate,
)
