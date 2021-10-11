/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe,
  interval, observe,tap, Subject, connect,
} from '../src'


const sub = new Subject<number>()


pipe(
  interval(1000),
  connect(sub),
  tap(x => console.log(x)),
  observe,
)

pipe(
  sub,
  tap(x => console.log('SUB:: ' + x)),
  observe,
)
