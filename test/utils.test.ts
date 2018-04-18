import * as utils from '../src/utils'
import { expect } from 'chai'
import { stub, spy } from 'sinon'

describe('utils', () => {
  it('exports an empty array', () => {
    expect(utils.EMPTY_ARRAY).to.deep.equal([])
  })

  describe('assertNever', () => {
    it('throws with message', () => {
      expect(() => utils.assertNever('VALUE' as never)).to.throw(
        TypeError,
        'Unkown value VALUE',
      )
    })
  })

  describe('neq', () => {
    it('returns a function for inequality', () => {
      expect(utils.neq(5)).to.be.a('function')
      expect(utils.neq({})({})).to.be.true
      let obj = {}
      expect(utils.neq(obj)(obj)).to.be.false
      expect(utils.neq(5)(5)).to.be.false
      expect(utils.neq(5)(6)).to.be.true
      expect(utils.neq(5)('6' as any)).to.be.true
      expect(utils.neq(null)(undefined as any)).to.be.true
      expect(utils.neq(undefined)(null as any)).to.be.true
      expect(utils.neq(NaN)(NaN), 'NaN').to.be.true
    })
  })

  describe('pipe', () => {
    it('returns given value if no function is passed', () => {
      expect(utils.pipe('test')).to.equal('test')
    })

    it('passes values from functions to the next one', () => {
      let receiveA = spy(stub().returns('B'))
      let receiveB = spy(stub().returns('C'))
      let receiveC = spy(stub().returns('D'))
      expect(utils.pipe('A', receiveA, receiveB, receiveC)).to.equal('D')
      expect(receiveA).to.have.been.calledWithExactly('A')
      expect(receiveB).to.have.been.calledWithExactly('B')
      expect(receiveC).to.have.been.calledWithExactly('C')
    })
  })
})
