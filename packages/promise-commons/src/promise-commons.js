'use strict'

/**
 * @param {number} ms
 * @param {() => any} errFactory
 * @returns {Promise<void>}
 */
export async function failAfter(ms, errFactory) {
  await delay(ms)

  throw errFactory()
}

/**
 * @template T
 * @template TErr
 * @param {Promise<T>} promise
 * @returns {Promise<[err: TErr | undefined, value: T | undefined]>}
 */
export function presult(promise) {
  return promise.then(
    (v) => [undefined, v],
    (err) => [err, undefined],
  )
}

/**
 * @template T
 * @template TErr
 * @param {Promise<[err: TErr | undefined, value: T | undefined]>} presultPromise
 * @returns {Promise<T | Promise<never>>}
 */
export function unwrapPresult(presultPromise) {
  const ret = presultPromise.then(([err, v]) =>
    err != null ? Promise.reject(err) : /** @type {NonNullable<T>} */ (v),
  )

  return ret
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

/**
 * @template T, V
 * @param {Promise<T> | ((abortSignal: AbortSignal) => Promise<T>)} promiseOrPromiseFunc
 * @param {number} timeout
 * @param {V} value
 * @returns {Promise<T | V>}
 */
export function ptimeoutWithValue(promiseOrPromiseFunc, timeout, value) {
  return ptimeoutWithFunction(promiseOrPromiseFunc, timeout, () => Promise.resolve(value))
}

/**
 * @template T
 * @template TErr
 * @param {Promise<T> | ((abortSignal: AbortSignal) => Promise<T>)} promiseOrPromiseFunc
 * @param {number} timeout
 * @param {TErr} error
 * @returns {Promise<T | never>}
 */
export function ptimeoutWithError(promiseOrPromiseFunc, timeout, error) {
  return ptimeoutWithFunction(promiseOrPromiseFunc, timeout, () => Promise.reject(error))
}

/**
 * @template T, V
 * @param {Promise<T> | ((abortSignal: AbortSignal) => Promise<T>)} promiseOrPromiseFunc
 * @param {number} timeout
 * @param {() => Promise<V>} func
 * @returns {Promise<T | V>}
 */
export async function ptimeoutWithFunction(promiseOrPromiseFunc, timeout, func) {
  const abortController = new AbortController()

  const promise =
    'then' in promiseOrPromiseFunc
      ? promiseOrPromiseFunc
      : promiseOrPromiseFunc(abortController.signal)

  /** @type {NodeJS.Timeout | undefined} */
  let cancel
  const v = await Promise.race([
    promise.then(
      (v) => {
        abortController.abort()
        cancel && clearTimeout(cancel)
        cancel = undefined
        return v
      },
      (err) => {
        abortController.abort()
        cancel && clearTimeout(cancel)
        cancel = undefined
        return Promise.reject(err)
      },
    ),
    new Promise(
      (res) =>
        (cancel = setTimeout(() => {
          if (!cancel) res(undefined)
          else {
            cancel = undefined
            abortController.abort()
            res(func())
          }
        }, timeout)),
    ),
  ])

  return v
}

const resolveSymbol = Symbol('resolve-promise')
const rejectSymbol = Symbol('reject-promise')

/**
 * @template T
 * @returns {Promise<T>}
 */
export function makeResolveablePromise() {
  let exteriorResolve
  let exteriorReject
  const promise = new Promise(
    (resolve, reject) => ([exteriorResolve, exteriorReject] = [resolve, reject]),
  )

  //@ts-expect-error
  promise[resolveSymbol] = exteriorResolve
  //@ts-expect-error
  promise[rejectSymbol] = exteriorReject

  return promise
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {T} value
 * @returns {void}
 */
export function resolveResolveablePromise(promise, value) {
  //@ts-expect-error
  promise[resolveSymbol](value)
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {Error} err
 * @returns {void}
 */
export function rejectResolveablePromise(promise, err) {
  //@ts-expect-error
  promise[rejectSymbol](err)
}

/**
 * @template T, U
 * @param {Promise<T>} promise
 * @param {(error: any) => boolean} filterFunc
 * @param {(error: any) => Promise<U>} whatToDo
 * @returns {Promise<T | U>}
 */
export function filterOutError(promise, filterFunc, whatToDo) {
  return promise.catch((error) => (filterFunc(error) ? whatToDo(error) : Promise.reject(error)))
}

/**
 * @template T
 * @param {(() => Promise<T>)[]} promiseFuncs
 * @returns {Promise<T[]>}
 */
export async function promiseAllSerial(promiseFuncs) {
  const ret = []

  for (const promiseFunc of promiseFuncs) {
    ret.push(await promiseFunc())
  }

  return ret
}
