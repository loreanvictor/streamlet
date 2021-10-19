<div align="center">

<img src="./misc/logo-cutout.svg" width="128px"/>
  
# Streamlets

</div>
  
```bash
npm i streamlets
```

[![tests](https://img.shields.io/github/workflow/status/loreanvictor/streamlet/Test%20and%20Report%20Coverage?label=tests&logo=mocha&logoColor=green)](https://github.com/loreanvictor/streamlet/actions?query=workflow%3A%22Test+and+Report+Coverage%22)
[![security](https://img.shields.io/github/workflow/status/loreanvictor/streamlet/CodeQL?label=security)](https://github.com/loreanvictor/streamlet/actions?query=workflow%3A%22CodeQL%22)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/loreanvictor/streamlet.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/loreanvictor/streamlet/context:javascript)
[![coverage](https://app.codacy.com/project/badge/Coverage/95822ae988d14ef3957704b31372d24e)](https://www.codacy.com/gh/loreanvictor/streamlet/dashboard?utm_source=github.com&utm_medium=referral&utm_content=loreanvictor/streamlet&utm_campaign=Badge_Coverage)
[![version](https://img.shields.io/npm/v/streamlets?logo=npm)](https://www.npmjs.com/package/streamlets)
[![docs](https://img.shields.io/badge/%20-docs-blue?logo=read%20the%20docs&logoColor=white)](https://github.com/loreanvictor/streamlet/wiki)
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
// ... paused for two seconds, no logs ...
// > 2
// > 3
// > ...
```

👉 Check out [the wiki](https://github.com/loreanvictor/streamlet/wiki) for installation and usage guides.

<br><br>

# Prior Work

If you find this useful, you most probably want to use [RxJS](https://rxjs.dev/). This is an experimental work.
If you are into these kinds of experiments, checkout [the callbag standard](https://github.com/callbag/callbag) as well.
The main differences between streamlets and aforementioned libraries are:

- Streamlets and callbags handle both pullables and listenables, and anything in between. RxJS does not.
- Streamlets support pausing / resuming by default. This [can be added](https://github.com/erikras/callbag-pausable) to callbags as well, not supported by the standard itself. RxJS does not support this.
- Streamlets and callbags are pretty light-weight. RxJS operators and utilities are way heavier than both.
- Streamlets are [as fast (in some cases marginally faster)](https://github.com/loreanvictor/streamlet/blob/main/docs/performance.md) than Callbags, and [noticably faster](https://github.com/loreanvictor/streamlet/blob/main/docs/performance.md) than RxJS.
- Streamlets [use less memory](https://github.com/loreanvictor/streamlet/blob/main/docs/memory.md) than both Callbags and RxJS.

<br><br>

# Acknowledgement

The streamlet protocol is heavily influenced by [the callbag standard](https://github.com/callbag/callbag). A lot of code and utilities built around callbags were directly adopted into utilities for streamlets, including (but not limited to):
- [callbag-from-iter](https://github.com/staltz/callbag-from-iter), [callbag-flatten](https://github.com/staltz/callbag-flatten), and lots of other callbag related utilities by [@staltz](https://github.com/staltz)
- [callbag-of](https://github.com/Andarist/callbag-of) and [callbag-retry](https://github.com/Andarist/callbag-retry) by [@Andarist](https://github.com/Andarist)
- [callbag-start-with](https://github.com/krawaller/callbag-start-with) by [@krawaller](https://github.com/krawaller)
- [callbag-debounce](https://github.com/atomrc/callbag-debounce) by [@atomrc](https://github.com/atomrc)
