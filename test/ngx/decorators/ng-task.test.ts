import { Observable } from 'rxjs/Observable'
import { of } from 'rxjs/observable/of'
import { task, Task } from '../../../src/task'
import { NgTask } from '../../../src/ngx/decorators/ng-task'
import { marbles } from 'rxjs-marbles'
import { expect } from 'chai'
import { stub } from 'sinon'

/** @test {NgTask} */
describe('NgTask', () => {
  it('installs a ngOnDestroy hook', () => {
    class Component {
      @NgTask()
      save = task((model: any) => of(model))
    }

    const c: any = new Component()
    c.save.subscribe()
    expect(c.ngOnDestroy).to.be.a('function')
    c.ngOnDestroy()
    expect(c.save.closed).to.be.true
  })

  it('allows overwriting teardownMethodName', () => {
    class Component {
      @NgTask({ teardownMethod: 'teardown' })
      save = task((model: any) => of(model))
    }

    const c: any = new Component()
    expect(c.teardown).to.be.a('function')
    expect(c).to.not.have.property('ngOnDestroy')
  })
})
