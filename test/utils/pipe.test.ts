import { pipe } from '../../src/utils/pipe'
import { expect } from 'chai'
import { stub, spy } from 'sinon'

/** @test {pipe} */
describe('utils/pipe', () => {
  it('returns given value if no function is passed', () => {
    expect(pipe('test')).to.equal('test')
  })

  it('passes values from functions to the next one', () => {
    let receiveA = spy(stub().returns('B'))
    let receiveB = spy(stub().returns('C'))
    let receiveC = spy(stub().returns('D'))
    expect(pipe('A', receiveA, receiveB, receiveC)).to.equal('D')
    expect(receiveA).to.have.been.calledWithExactly('A')
    expect(receiveB).to.have.been.calledWithExactly('B')
    expect(receiveC).to.have.been.calledWithExactly('C')
  })
})
