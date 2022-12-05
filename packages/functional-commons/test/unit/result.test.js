'use strict'
import {describe, it} from 'mocha'
import {expect} from 'chai'
import {
  failureResult,
  successResult,
  isResultError,
  isResultOk,
} from '../../src/functional-commons.js'

describe('functional-commons [result] (unit)', function () {
  describe('successResult, isResultError, isResultOk', () => {
    it('should allow to access value when the result is ok result', () => {
      /** @type {import('../../src/functional-commons.js').Result<string, Error>} */
      const result = successResult('test')
      expect(isResultError(result)).to.be.false
      if (isResultOk(result)) {
        expect(result.value).to.equal('test')
      }
    })
  })
  describe('failureResult, isResultOk, isResultError', () => {
    it('should allow to access error when the result is failure result', () => {
      /** @type {import('../../src/functional-commons.js').Result<string, Error>} */
      const result = failureResult(new Error('Ups...'))
      expect(isResultOk(result)).to.be.false
      if (isResultError(result)) {
        expect(result.error.message).to.equal('Ups...')
      }
    })
  })
})
