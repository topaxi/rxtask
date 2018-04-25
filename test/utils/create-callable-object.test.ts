import { createCallableObject } from '../../src/utils/create-callable-object'
import { expect } from 'chai'
import { spy } from 'sinon'

/** @test {createCallableObject} */
describe('utils/create-callable-object', () => {
  it('returns a callable object', () => {
    let fn = () => 'myfn'
    let obj = createCallableObject({}, fn)

    expect(obj()).to.equal('myfn')
  })

  it('returns an almost indistinguishable object', () => {
    let fn = () => 'myfn'
    let original = { foo: 'foo', bar: [] }
    let obj = createCallableObject(original, fn)

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
    let obj = createCallableObject(original, fn)

    expect(obj.foo()).to.equal(obj)
  })

  it('passes through function methods', () => {
    let fn = spy(function(this: any) {
      return this
    })
    let original = { bar: 'bar' }
    let obj = createCallableObject(original, fn)

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
    let obj = { method: createCallableObject(original, fn) }

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
    let obj = createCallableObject(original, fn)

    expect(obj).to.be.instanceof(Foo)
    expect(obj.foo()).to.equal(obj)
    expect(obj.getArrayValue()).to.equal('myarrayvalue')
  })

  it('returns undefined for unknown properties', () => {
    let fn = () => 'myfn'
    let original = { foo: 'foo', bar: [] }
    let obj = createCallableObject(original, fn)

    expect((obj as any).baz).to.be.undefined
  })
})
