import * as index from '../../src/ngx/index'
import { expect } from 'chai'

/** @ignore */
describe('index', () => {
  it('exports NgTask', () => {
    expect(index.NgTask).to.exist
  })
})
