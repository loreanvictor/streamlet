/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { interval, batch, memo, pipe, tap, map, observe } from '../src'


const a = interval(500)
const b = interval(1000)


pipe(
  memo($ => $(a) + $(b)),
  batch(),
  tap(x => console.log(x)),
  observe
)

