import * as index from '../../src/operators/index'
import { expect } from 'chai'

describe('operators/index', () => {
  it('exports actionReducer', () => {
    expect(index.actionReducer).to.exist
  })
})
