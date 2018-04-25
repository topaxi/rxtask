import { assertNever } from '../../src/utils/assert-never'
import { expect } from 'chai'

/** @test {assertNever} */
describe('utils/assert-never', () => {
  it('throws with message', () => {
    expect(() => assertNever('VALUE' as never)).to.throw(
      TypeError,
      'Unkown value VALUE',
    )
  })
})
