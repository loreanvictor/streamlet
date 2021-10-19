<div align="center">

<img src="/misc/logo-cutout.svg" width="128px"/>
  
# Bundle Size Cost of Streamlets

</div>

<br><br>

Cost of some basic utilities in `streamlets` package, in terms of contribution to bundle size, is compared here to similar
utilities on [Callbags](https://github.com/callbag/callbag) and [RxJS](https://github.com/ReactiveX/rxjs).
Different scenarios mimicking common use-cases are used for this benchmarking.

Overall, Callbags consume the least amount of bundle size, followed by Streamlets and (with a noticeable gap) RxJS Observables and operators.
For benchmarking, simple web apps were created according to each scenario, and bundled with [Parcel](https://parceljs.org)
(using [`@parcel/compressor-gzip`](https://parceljs.org/features/production/#compression) for compression). Additionally, for some
select utilities, simple web-apps importing them were auto-generated and bundled.

<details><summary>Environment Details</summary>

- **Hardware** \
  MacBook Pro 15-inch, Mid 2015 \
  2.2 GHz Quad-Core Intel Core i7 \
  16GB Mem DDR3

- **Runtime** \
  macOS Catalina Version 10.15.5 \
  Node.js v16.9.1

- **Packages** \
  streamlets@0.2.1 \
  rxjs@7.4.0 \
  callbag-common@0.1.8 \
  callbag-retry@1.0.0 \
  callbag-catch-error@1.0.1 \
  parcel@2.0.0 \
  @parcel/core@2.0.0 \
  @parcel/compressor-gzip@2.0.0

</details>

<img width="1209" alt="Screen Shot 2021-10-19 at 4 54 54 PM" src="https://user-images.githubusercontent.com/13572283/137949931-d461e738-3cd5-4e53-82a0-c1e2bef1652d.png">

---

### Scneario: Simple Usage

For this scenario, a simple timer was created, its values mapped, filtered and logged.

<details><summary>Code</summary>

```ts
// Streamlets
import { pipe, interval, map, filter, tap, observe } from 'streamlets'

pipe(
  interval(1000),
  map(x => x + 1),
  filter(x => x % 2 === 0),
  tap(x => console.log(x)),
  observe,
)
```
```ts
// RxJS
import { interval, map, filter } from 'rxjs'

interval(1000).pipe(
  map(x => x + 1),
  filter(x => x % 2 === 0)
).subscribe(x => console.log(x))
```
```ts
// Callbags
import { pipe, interval, map, filter, subscribe } from 'callbag-common'

pipe(
  interval(1000),
  map(x => x + 1),
  filter(x => x % 2 === 0),
  subscribe(x => console.log(x)),
)
```
</details>

| Lib                  | Bundle Size        | Bundle Size (Gzipped) | Build Time |
| -------------------- | ------------------ | --------------------- | ---------- |
| Streamlets           | 2.36KB             | 813B                  | 673ms      |
| Callbags             | 768B               | 448B                  | 657ms      |
| RxJS                 | 11.69KB            | 4.06KB                | 971m       |

---

### Scneario: Pokémon API

For this scenario, a web app is built for searching [PokéAPI](https://pokeapi.co) using Pokémons' names.

<details><summary>Code</summary>

```ts
// Streamlets
import { pipe, fetch, event, map, flatten, observe, tap, debounce,
  filter, promise, retry, finalize } from 'streamlets'

const input = document.querySelector('input')
const pre = document.querySelector('pre')

pipe(
  event(input, 'input'),
  map(() => input.value.toLowerCase()),
  tap((i) => (pre.textContent = !!i ? 'LOADING ...' : '')),
  debounce(500),
  filter((i) => !!i),
  map((i) => fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)),
  flatten,
  map((r) => promise(r.json())),
  flatten,
  map((v) => JSON.stringify(v, null, 2)),
  tap((v) => (pre.textContent = v)),
  finalize(() => (pre.textContent = 'COULD NOT LOAD')),
  retry,
  observe
)

```
```ts
// RxJS
import { from, fromEvent, map, switchMap, tap,
  debounceTime, filter, retry } from 'rxjs'

const input = document.querySelector('input')
const pre = document.querySelector('pre')

fromEvent(input, 'input')
  .pipe(
    map(() => input.value.toLowerCase()),
    tap((i) => (pre.textContent = !!i ? 'LOADING ...' : '')),
    debounceTime(500),
    filter((i) => !!i),
    switchMap((i) => from(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`))),
    switchMap((r) => from(r.json())),
    map((v) => JSON.stringify(v, null, 2)),
    tap({
      next: (v) => (pre.textContent = v),
      error: () => (pre.textContent = 'COULD NOT LOAD')
    }),
    retry()
  )
  .subscribe()

```
```ts
// Callbags
import { pipe, fromEvent, map, flatten, subscribe, tap,
  debounce, filter, fromPromise } from 'callbag-common'
import catchError from 'callbag-catch-error'
import retry from 'callbag-retry'

const input = document.querySelector('input')
const pre = document.querySelector('pre')

pipe(
  fromEvent(input, 'input'),
  map(() => input.value.toLowerCase()),
  tap((i) => (pre.textContent = !!i ? 'LOADING ...' : '')),
  debounce(500),
  filter((i) => !!i),
  map((i) => fromPromise(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`))),
  flatten,
  map((r) => fromPromise(r.json())),
  flatten,
  map((v) => JSON.stringify(v, null, 2)),
  tap((v) => (pre.textContent = v)),
  catchError(() => (pre.textContent = 'COULD NOT LOAD')),
  retry(),
  subscribe(() => {})
)

```
</details>

| Lib                  | Bundle Size        | Bundle Size (Gzipped) | Build Time |
| -------------------- | ------------------ | --------------------- | ---------- |
| Streamlets           | 7.59KB             | 1.99KB                | 769ms      |
| Callbags             | 2.44KB             | 1.09KB                | 1678ms     |
| RxJS                 | 21.76KB            | 7.16KB                | 1212ms     |

---

### Singular Utilities

For each utility, a web-app importing and logging the utility function from its corresponding library was auto-generated and bundled, e.g.

```ts
import { map } from 'rxjs'; console.log(map)
```

| Lib                  | `map()`          | `interval()`     | `flatten() + map()` / `switchMap()` |
| -------------------- | ---------------- | ---------------- | ----------------------------------- |
| Streamlets           | 471B (262B)      | 489B (278B)      | 1.69KB (537KB)                      |
| Callbags             | 203B (176B)      | 205B (174B)      | 549B (322B)                         |
| RxJS                 | 6.94KB (2.69KB)  | 10.71KB (3.77KB) | 13.80KB (4.87KB)                    |

---

<br>

# Replication

```bash
# clone this repo
git clone git@github.com:loreanvictor/streamlet.git
```
```bash
# install dependencies
npm i
```
```bash
# run the bundle benchmark
npm run bench:bundle
```

You can also investigate and modify benchmarking codes by cloning [this reository](https://github.com/loreanvictor/streamlet-bundle-size-benchmark).
