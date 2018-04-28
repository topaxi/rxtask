import { neq, notNull } from '../../src/utils/filter'
import { expect } from 'chai'

/** @test {neq} */
describe('utils/filter/neq', () => {
  it('returns a function for inequality', () => {
    expect(neq(5)).to.be.a('function')
    expect(neq({})({})).to.be.true
    let obj = {}
    expect(neq(obj)(obj)).to.be.false
    expect(neq(5)(5)).to.be.false
    expect(neq(5)(6)).to.be.true
    expect(neq(5)('6' as any)).to.be.true
    expect(neq(null)(undefined as any)).to.be.true
    expect(neq(undefined)(null as any)).to.be.true
    expect(neq(NaN)(NaN), 'NaN').to.be.true
  })
})

/** @test {notNull} */
describe('utils/filter/notNull', () => {
  it('returns true for null', () => {
    expect(notNull(null)).to.be.false
    ;[undefined, 0, 1, false, NaN, '', {}, []].forEach(
      v => expect(notNull(v)).to.be.true,
    )
  })
})
