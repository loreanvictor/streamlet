/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import { pipe, Subject, interval, tap, map, connect, observe } from '../src'

const subject = new Subject()

pipe(
  interval(1000),
  map((x) => x * 2),
  tap(console.log),
  connect(subject)
)

pipe(
  subject,
  tap((x) => console.log('Also: ' + x)),
  observe
)

subject.receive('Before timer')
