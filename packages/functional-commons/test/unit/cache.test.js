'use strict'
import {promisify as p} from 'util'
import mocha from 'mocha'
const {describe, it} = mocha
import chai from 'chai'
const {expect} = chai

import {memo, memoAsync} from '../../src/functional-commons.js'

describe('functional-commons [cache] (unit)', function () {
  describe('cacheFunctionSync', async () => {
    it('should cache on same key', async () => {
      const value = {
        a: {},
      }

      let called = 0
      const cache = memo(/** @param {keyof value} x */ (x) => ({value: value[x], called: ++called}))

      const v = cache('a')
      expect(v.value).to.equal(value.a)
      expect(v.called).to.equal(1)

      const v2 = cache('a')
      expect(v2.value).to.equal(value.a)
      expect(v2.called).to.equal(1)
    })

    it('should not cache on different key', async () => {
      const value = {
        a: {},
        b: {},
      }

      let called = 0
      const cache = memo(/** @param {keyof value} x */ (x) => ({value: value[x], called: ++called}))

      const v = cache('a')
      expect(v.value).to.equal(value.a)
      expect(v.called).to.equal(1)

      const v2 = cache('b')
      expect(v2.value).to.equal(value.b)
      expect(v2.called).to.equal(2)
    })

    it('should cache/not cache on same/different keys', async () => {
      const value = {
        ax: {},
        bx: {},
      }

      let called = 0
      // @ts-expect-error
      const cache = memo((x1, x2) => ({value: value[x1 + x2], called: ++called}))

      const v = cache('a', 'x')
      expect(v.value).to.equal(value.ax)
      expect(v.called).to.equal(1)

      expect(cache('a', 'x').called).to.equal(1)

      const v2 = cache('b', 'x')
      expect(v2.value).to.equal(value.bx)
      expect(v2.called).to.equal(2)

      expect(cache('b', 'x').called).to.equal(2)
    })

    it('should throw exception if passed an async function', async () => {
      const cache = memo(async (x) => x)

      expect(() => cache(4)).to.throw()
    })

    it('should work like lazy evaluation if not passed any parameters', async () => {
      let value = 0
      const cache = memo(() => ++value)

      expect(cache()).to.equal(1)
      expect(cache()).to.equal(1)
    })
  })
  describe('cacheFunctionAsync', async () => {
    it('should cache on same key', async () => {
      const value = {
        a: {},
      }

      let called = 0
      const cache = memoAsync(
        /** @param {keyof value} x */ async (x) => ({value: value[x], called: ++called}),
      )

      const v = await cache('a')
      expect(v.value).to.equal(value.a)
      expect(v.called).to.equal(1)

      const v2 = await cache('a')
      expect(v2.value).to.equal(value.a)
      expect(v2.called).to.equal(1)
    })

    it('should not cache on different key', async () => {
      const value = {
        a: {},
        b: {},
      }

      let called = 0
      const cache = memoAsync(
        /** @param {keyof value} x */ async (x) => ({value: value[x], called: ++called}),
      )

      const v = await cache('a')
      expect(v.value).to.equal(value.a)
      expect(v.called).to.equal(1)

      const v2 = await cache('b')
      expect(v2.value).to.equal(value.b)
      expect(v2.called).to.equal(2)
    })

    it('should cache/not cache on same/different keys', async () => {
      const value = {
        ax: {},
        bx: {},
      }

      let called = 0
      const cache = memoAsync(async (x1, x2) => ({
        // @ts-expect-error
        value: value[x1 + x2],
        called: ++called,
      }))

      const v = await cache('a', 'x')
      expect(v.value).to.equal(value.ax)
      expect(v.called).to.equal(1)

      expect((await cache('a', 'x')).called).to.equal(1)

      const v2 = await cache('b', 'x')
      expect(v2.value).to.equal(value.bx)
      expect(v2.called).to.equal(2)

      expect((await cache('b', 'x')).called).to.equal(2)
    })

    it('should work like lazy evaluation if not passed any parameters', async () => {
      let value = 0
      const cache = memoAsync(async () => ++value)

      expect(await cache()).to.equal(1)
      expect(await cache()).to.equal(1)
    })

    it('should not expire if expire time not done', async () => {
      let value = 0
      const cache = memoAsync(async () => ++value, {expireAfterMs: 10000})

      expect(await cache()).to.equal(1)
      expect(await cache()).to.equal(1)
    })

    it('should expire if expire time done', async () => {
      let value = 0
      const cache = memoAsync(async () => ++value, {expireAfterMs: 1})

      expect(await cache()).to.equal(1)
      await p(setTimeout)(5)
      expect(await cache()).to.equal(2)
    })
  })
})
