# promise-commons

A library with lots of utility functions around promises. Along with
`@giltayar/functional-commons`, they contain functions
we would have liked to see in a javascript standard library.

This library is JSM-only (does not support `require`-ing it).

## Installation

```sh
npm install @giltayar/promise-commons
```

## Basic use

Given that this package is just a set of functions, just import
the ones you want and you're good to go.

An example of using a function from the package:

```js
import {presult} from '@giltayar/promise-commons'

const [err, value] = await presult(throwAnErrorSometimes())

if (err) {
  console.log('the function threw!')
} else {
  console.log('the function returned the value', value)
}

async function throwAnErrorSometimes() {
  const t = Math.random()
  if (r >= 0.5) {
    throw new Error('wicked zoot!')
  } else {
    return r
  }
}
```

## API

### `presult(promise)`

This function receives a `promise`, and returns another promise that is a tuple
of `[error, value]`, where `error` is the error rejected by the `promise` if it was rejected,
and `value` is the value the `promise` resolved to if it was resolved.

By definition, if `error` is `undefined` then the promise was resolved,
and if it is not `undefined`, then the promise was rejected. Yes, I know, in the weird case
where `undefined` was thrown, we have a problem here. Please don't do that!

Example:

```js
import {presult} from '@giltayar/promise-commons'

const [err, value] = await presult(throwAnErrorSometimes())

if (err) {
  console.log('the function threw!')
} else {
  console.log('the function returned the value', value)
}

async function throwAnErrorSometimes() {
  const r = Math.random()
  if (r >= 0.5) {
    throw new Error('wicked zoot!')
  } else {
    return r
  }
}
```

`presult` is great if you want to "start" a promise, and await it later in the code, because
any such promise must be `catch`-ed (otherwise, your code risks getting an
"unhandled promise rejection" and crashing), and `presult` "catches" the error and converts
it into a return value. `unwrapPresult` (below) is great for later converting the presult back
into a value and an exception.

Example:

```js
import {presult, unwrapPresult, delay} from '@giltayar/promise-commons'

const result = presult(throwAnErrorSometimes()) // no await!

await delay(Math.random() * 1000) // do something else
                                  // while `throwAnErrorSometimes` runs in the background

const value = await unwrapPresult // get back the value (or a throw)

async function throwAnErrorSometimes() {
  const r = Math.random()
  await delay(r * 1000)

  if (r >= 0.5) {
    throw new Error('wicked zoot!')
  } else {
    return r
  }
}
```

### `unwrapPresult(promise)`

The inverse of `presult`. It receives a `promise` that was returned by `presult`, i.e.
that resolves to an `[error, value]`, and returns a promise that is rejected when `error` turns
out to not be `undefined` or is resolved to `value` if `error` is undefined.

This function can be use in conjunction with `presult` f you want to "start" a promise,
and await it later in the code, because any such promise must be `catch`-ed
(otherwise, your code risks getting an "unhandled promise rejection" and crashing),
and `presult` "catches" the error and converts it into a return value.
`unwrapPresult` (below) is great for later converting the presult back
into a value and an exception.

```js
import {presult, unwrapPresult, delay} from '@giltayar/promise-commons'

const result = presult(throwAnErrorSometimes()) // no await!

await delay(Math.random() * 1000) // do something else
                                  // while `throwAnErrorSometimes` runs in the background

const value = await unwrapPresult // get back the value (or a throw)

async function throwAnErrorSometimes() {
  const r = Math.random()
  await delay(r * 1000)

  if (r >= 0.5) {
    throw new Error('wicked zoot!')
  } else {
    return r
  }
}
```

### `delay(ms)`

Returns a promise that resolves after a delay of `ms` milliseconds.

Example:

```js
import {delay} from '@giltayar/promise-commons'

console.log('start...')
await delay(1000)
console.log('done after 1s!')
```

### `failAfter(ms, errorFactory)`

Returns a promise that rejects with the error returned by `errorFactory` after `ms` milliseconds

Example:

```js
import {failAfter} from '@giltayar/promise-commons'

console.log('start...')
try {
  await failAfter(1000, () => new Error('failed miserably!'))
} catch(error) {
  console.error('failed after 1s!', error)
}
```

### `makeResolveablePromise()`

Returns a promise that can be resolved and rejected from outside the promise using
`resolveResolveablePromise` and `rejectResolveablePromise`. Used in very esoteric cases,
but useful nonetheless.

Example:

```js
import {
  makeResolveablePromise,
  resolveResolveablePromise,
  rejectResolveablePromise,
  presult,
  unwrapPresult} from '@giltayar/promise-commons'

const abortController = new AbortController()
const signal = abortController.signal

const promise = presult(makeResolveablePromise())
signal.onabort = () => rejectResolveablePromise(promise, new Error('aborted!'))

const r = Math.random()
if (r >= 0.5) {
  abortController.abort()
} else {
  resolveResolveablePromise(42)
}

const value = await unwrapPresult(promise) // will either return 42 or throw an "aborted" exception
```

### `ptimeoutWithError(promiseOrAsyncFunc, timeout, error)`

Returns a promise that either resolves if `promiseOrAsyncFunc` resolves before
`timeout` milliseconds or rejects with `error` if `timeout` milliseconds pass.

* `promiseOrPromiseFunc` can be a promise, or a function that is called to get a promise.
* If `promiseOrPromiseFunc` is a function, it will also receive an `AbortSignal` that can be used
  to know if an abort happened due to the timeout.

Example:

```js
import {ptimeoutWithError} from '@giltayar/promise-commons'
import {fetchAsJson} from '@giltayar/http-commons'

try {
  const person = await ptimeoutWitError((signal) =>
    fetchAsJson('https://swapi.dev/api/people/1/', {signal}), 100, new Error('timed out'))

  console.log('made it in 100 ms!', person.name) // Luke Skywalker
} catch (error) {
  console.error('didnt make it after 100 ms', error)
}
```

### `ptimeoutWithValue(promiseOrAsyncFunc, timeout, valueOnTimeout)`

Returns a promise that either resolves with the value if `promiseOrAsyncFunc` resolves before
`timeout` milliseconds or resolves with `valueOnTimeout` if `timeout` milliseconds pass.

* `promiseOrPromiseFunc` can be a promise, or a function that is called to get a promise.
* If `promiseOrPromiseFunc` is a function, it will also receive an `AbortSignal` that can be used
  to know if an abort happened due to the timeout.

Example:

```js
import {ptimeoutWithValue} from '@giltayar/promise-commons'
import {fetchAsJson} from '@giltayar/http-commons'

const person = await ptimeoutWitError((signal) =>
  fetchAsJson('https://swapi.dev/api/people/1/', {signal}), 100, undefined)

console.log(person?.name) // Luke Skywalker (or undefined)
```

### `ptimeoutWithFunction(promiseOrAsyncFunc, timeout, functionCalledOnTimeout)`

Returns a promise that either resolves with the value if `promiseOrAsyncFunc` resolves before
`timeout` milliseconds or resolves with the value of calling `functionCalledOnTimeout`
if `timeout` milliseconds pass.

* `promiseOrPromiseFunc` can be a promise, or a function that is called to get a promise.
* If `promiseOrPromiseFunc` is a function, it will also receive an `AbortSignal` that can be used
  to know if an abort happened due to the timeout.

Example:

```js
import {ptimeoutWithFunction} from '@giltayar/promise-commons'
import {fetchAsJson} from '@giltayar/http-commons'

const person = await ptimeoutWitError((signal) =>
  fetchAsJson('https://swapi.dev/api/people/1/', {signal}), 100, () => Math.random())

console.log(typeof person === 'object' ? person.name : person) // Luke Skywalker (or some random number)
```

### `filterOutError(promise, filterFunc, whatToDo)`

Deals with a specific error out of all errors

Example:

```js
import {filterOutError} from '@giltayar/promise-commons'
import {fetchAsJson} from '@giltayar/http-commons'

await filterOutError(fetchAsJson('https://swapi.dev/api/people/sduf934857oo/'),
  (e) => e.status === 404,
  () => ({})
)
```

The above example will return a `{}` in case of a 404. Other errors will still reject the promise.

### `promiseAllSerial`

Same as `Promise.all`, except that it accepts an array of functions, and will do them serially
(one after the other).

Example:

```js
import {promiseAllSerial} from '@giltayar/promise-commons'

console.log(await promiseAllSerial([1, 2, 3].map((x) => () => Promise.resolve(x * 2)))) // [2, 4, 6])
```


## Contributing

See the documentation on contributing code to packages in this monorepo
[here](../../CONTRIBUTING.md).

### License

MIT
