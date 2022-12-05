import mocha from 'mocha'
const {describe, it} = mocha
import chai from 'chai'
const {expect} = chai

import {
  ptimeoutWithValue,
  ptimeoutWithError,
  ptimeoutWithFunction,
  presult,
  delay,
} from '../../src/promise-commons.js'

describe('ptimeout*', function () {
  describe('ptimeoutWithFunction', () => {
    it('should return promise value if less than timeout', async () => {
      expect(
        await ptimeoutWithFunction(Promise.resolve(32), 2000, () => Promise.resolve(66)),
      ).to.equal(32)
    })

    it('should not call timeout function if less', async () => {
      let timeoutFunctionCalled = false
      await ptimeoutWithFunction(
        Promise.resolve(32),
        200,
        () => ((timeoutFunctionCalled = true), Promise.resolve()),
      )

      await delay(400)

      expect(timeoutFunctionCalled).to.be.false
    })

    it('should return timeout value if more than timeout', async () => {
      const start = Date.now()
      expect(await ptimeoutWithFunction(delay(2000), 20, () => Promise.resolve(66))).to.equal(66)

      expect(Date.now() - start).to.be.lessThan(2000)
    })

    it('should return promise value if less than timeout and not abort function', async () => {
      expect(
        await ptimeoutWithFunction(
          (abortSignal) => (abortSignal.aborted ? Promise.resolve(undefined) : Promise.resolve(32)),
          2000,
          () => Promise.resolve(66),
        ),
      ).to.equal(32)
    })

    it('should return timeout value if more than timeout and abort function', async () => {
      const start = Date.now()
      let aborted = false
      expect(
        await ptimeoutWithFunction(
          (abortSignal) => delay(200).then(() => (aborted = abortSignal.aborted)),
          20,
          () => Promise.resolve(66),
        ),
      ).to.equal(66)

      expect(Date.now() - start).to.be.lessThan(200)
      await delay(400)

      expect(aborted).to.equal(true)
    })
  })

  describe('ptimeoutWithValue', () => {
    it('should return promise value if less than timeout', async () => {
      expect(await ptimeoutWithValue(Promise.resolve(32), 2000, 66)).to.equal(32)
    })

    it('should return timeout value if more than timeout', async () => {
      const start = Date.now()
      expect(await ptimeoutWithValue(delay(2000), 20, 66)).to.equal(66)

      expect(Date.now() - start).to.be.lessThan(2000)
    })

    it('should return promise value if less than timeout and not abort function', async () => {
      expect(
        await ptimeoutWithValue(
          (abortSignal) => (abortSignal.aborted ? Promise.resolve(undefined) : Promise.resolve(32)),
          2000,
          Promise.resolve(66),
        ),
      ).to.equal(32)
    })

    it('should return timeout value if more than timeout and abort function', async () => {
      const start = Date.now()
      let aborted = false
      expect(
        await ptimeoutWithValue(
          (abortSignal) => delay(200).then(() => (aborted = abortSignal.aborted)),
          20,
          66,
        ),
      ).to.equal(66)

      expect(Date.now() - start).to.be.lessThan(200)
      await delay(400)

      expect(aborted).to.equal(true)
    })
  })

  describe('ptimeoutWithError', () => {
    it('should return promise value if less than timeout', async () => {
      expect(await ptimeoutWithError(Promise.resolve(32), 2000, new Error())).to.equal(32)
    })

    it('should return timeout error if more than timeout', async () => {
      const start = Date.now()
      expect((await presult(ptimeoutWithError(delay(2000), 20, 66)))[0]).to.equal(66)

      expect(Date.now() - start).to.be.lessThan(2000)
    })

    it('should return promise value if less than timeout and not abort function', async () => {
      expect(
        await ptimeoutWithError(
          (abortSignal) => (abortSignal.aborted ? Promise.resolve(undefined) : Promise.resolve(32)),
          2000,
          new Error(),
        ),
      ).to.equal(32)
    })

    it('should return timeout value if more than timeout and abort function', async () => {
      const start = Date.now()
      let aborted = false
      expect(
        await presult(
          ptimeoutWithError(
            (abortSignal) => delay(200).then(() => (aborted = abortSignal.aborted)),
            20,
            66,
          ),
        ),
      ).to.eql([66, undefined])

      expect(Date.now() - start).to.be.lessThan(200)
      await delay(400)

      expect(aborted).to.equal(true)
    })
  })
})
