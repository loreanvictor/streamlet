<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlets

</div>
  
```bash
npm i streamlets
```

[![tests](https://img.shields.io/github/workflow/status/loreanvictor/streamlet/Test%20and%20Report%20Coverage?label=tests&logo=mocha&logoColor=green)](https://github.com/loreanvictor/streamlet/actions?query=workflow%3A%22Test+and+Report+Coverage%22)
[![coverage](https://app.codacy.com/project/badge/Coverage/95822ae988d14ef3957704b31372d24e)](https://www.codacy.com/gh/loreanvictor/streamlet/dashboard?utm_source=github.com&utm_medium=referral&utm_content=loreanvictor/streamlet&utm_campaign=Badge_Coverage)
[![version](https://img.shields.io/npm/v/streamlets?logo=npm)](https://www.npmjs.com/package/streamlets)
<!--
[![coverage](https://img.shields.io/codecov/c/github/loreanvictor/streamlet?logo=codecov)](https://codecov.io/gh/loreanvictor/streamlet)
-->

Streamlet is [a protocol](https://github.com/loreanvictor/streamlet/blob/main/docs/protocol.md) for handling streams of data.

- ↕️ It allows for handling pullables (i.e. iterables), listenables (i.e. observables) and anything in between.
- ⛓️ It allows for handling synchronous and asynchronous data sources.
- ⏯️ It enables pausing / resuming streams.
- 📦 It allows pretty light-weight primitives and tools.

<br>

The `streamlets` package includes typings and tools built around this protocol.

```js
import { pipe, interval, tap, observe } from 'streamlets'

const obs = 
  pipe(
    interval(1000),
    tap(console.log),
    observe,
  )


setTimeout(() => obs.stop(), 2000)
setTimeout(() => obs.start(), 4000)

// > 0
// > 1
// ... pausde for two seconds, no logs ...
// > 2
// > 3
// > ...
```

<br><br>

# Prior Work

If you find this useful, you most probably want to use [RxJS](https://rxjs.dev/). This is an experimental work.
If you are into these kinds of experiments, checkout [the callbag standard](https://github.com/callbag/callbag) as well.
The main differences between streamlets and aforementioned libraries are:

- Streamlets and callbags handle both pullables and listenables, and anything in between. RxJS does not.
- Streamlets support pausing / resuming by default. This [can be added](https://github.com/erikras/callbag-pausable) to callbags as well, not supported by the standard itself. RxJS does not support this.
- Streamlets and callbags are pretty light-weight. RxJS operators and utilities are way heavier than both.

<div align="center">

primitive / utility        | Streamlet | Callbag | RxJS
-------------------------- | --------- | ------- | ------
`interval()`               | 366B      | 200B    | 4.6kB
`merge()`                  | 535B      | 336B    | 5.9kB
`map()`                    | 390B      | 198B    | 3.5kB
`flatten()` / `switchMap()`| 532B      | 288B    | 5.0kB

</div>

- I am hoping streamlets are at least as fast and consume much less memory than both RxJS observables and callbags. I need some benchmarking to make sure of this though.

<br><br>

# Acknowledgement

The streamlet protocol is heavily influenced by [the callbag standard](https://github.com/callbag/callbag). A lot of code and utilities built around callbags were directly adopted into utilities for streamlets, including (but not limited to):
- [callbag-from-iter](https://github.com/staltz/callbag-from-iter), [callbag-flatten](https://github.com/staltz/callbag-flatten), and lots of other callbag related utilities by [@staltz](https://github.com/staltz)
- [callbag-of](https://github.com/Andarist/callbag-of) and [callbag-retry](https://github.com/Andarist/callbag-retry) by [@Andarist](https://github.com/Andarist)
- [callbag-start-with](https://github.com/krawaller/callbag-start-with) by [@krawaller](https://github.com/krawaller)
- [callbag-debounce](https://github.com/atomrc/callbag-debounce) by [@atomrc](https://github.com/atomrc)
