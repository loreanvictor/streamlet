/* eslint-disable @typescript-eslint/no-unused-vars */

import 'isomorphic-fetch'

import sleep from 'sleep-promise'

import { interval, next, backpress } from '../src'

const f = async () => {
  for await (const x of next(backpress(interval(500)))) {
    console.log(x)
    await sleep(250)
  }
}

f()
