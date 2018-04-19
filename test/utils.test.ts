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

  describe('createCallableObject', () => {
    it('returns a callable object', () => {
      let fn = () => 'myfn'
      let obj = utils.createCallableObject({}, fn)

      expect(obj()).to.equal('myfn')
    })

    it('returns an almost indistinguishable object', () => {
      let fn = () => 'myfn'
      let original = { foo: 'foo', bar: [] }
      let obj = utils.createCallableObject(original, fn)

      expect(obj.foo).to.equal(original.foo)
      expect(obj.bar).to.equal(original.bar)
    })

    it('passes through methods with correct this', () => {
      let fn = () => 'myfn'
      let original = {
        foo() {
          return this.bar()
        },
        bar() {
          return this
        },
      }
      let obj = utils.createCallableObject(original, fn)

      expect(obj.foo()).to.equal(obj)
    })

    it('passes through function methods', () => {
      let fn = spy(function(this: any) {
        return this
      })
      let original = { bar: 'bar' }
      let obj = utils.createCallableObject(original, fn)

      expect(obj()).to.equal(obj)
      expect(fn).to.have.been.called
      expect(obj.call(Object, 'a', 'b')).to.equal(Object)
      expect(fn).to.have.been.calledWith('a', 'b')
      expect(obj.call(Object, 'a', 'b')).to.equal(Object)
      expect(fn).to.have.been.calledWith('a', 'b')
      expect(obj.apply(Object, ['a', 'b'])).to.equal(Object)
      expect(fn).to.have.been.calledWith('a', 'b')
      expect(obj.bind(Object, 'a', 'b')('c')).to.equal(Object)
      expect(fn).to.have.been.calledWith('a', 'b', 'c')
      // Bound callable loses its properties and reverts
      // to being a plain old function.
      expect(obj.bind(Object).bar).to.be.undefined
    })

    it('retains its own this as a method on an object', () => {
      let fn = function(this: any) {
        return this
      }
      let original = { bar: 'bar' }
      let obj = { method: utils.createCallableObject(original, fn) }

      expect(obj.method()).to.not.equal(obj)
      expect(obj.method()).to.equal(obj.method)
    })

    it('works with instanceof', () => {
      let fn = () => 'myfn'

      class Foo {
        myproperty = 'mypropertyValue'
        myarrayproperty = ['myarrayvalue']

        foo() {
          return this.bar()
        }

        bar() {
          return this
        }

        getArrayValue() {
          return this.myarrayproperty[0]
        }
      }

      let original = new Foo()
      let obj = utils.createCallableObject(original, fn)

      expect(obj).to.be.instanceof(Foo)
      expect(obj.foo()).to.equal(obj)
      expect(obj.getArrayValue()).to.equal('myarrayvalue')
    })

    it('returns undefined for unknown properties', () => {
      let fn = () => 'myfn'
      let original = { foo: 'foo', bar: [] }
      let obj = utils.createCallableObject(original, fn)

      expect((obj as any).baz).to.be.undefined
    })
  })
})
