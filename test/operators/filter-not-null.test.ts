import { filterNotNull } from '../../src/operators/filter-not-null'
import { marbles } from 'rxjs-marbles'

/** @test {filterNotNull} */
describe('operators/filterNotNull', () => {
  it(
    'filters null values',
    marbles(m => {
      const avals = { a: null, b: undefined, c: '', d: null, e: 42 }
      const expectedvals = {
        x: undefined,
        y: '',
        z: 42,
      }

      const a        = m.cold('abcde|', avals) // prettier-ignore
      const asubs    =        '^    !' // prettier-ignore
      const expected = m.cold('-xy-z|', expectedvals)

      const r = a.pipe(filterNotNull())

      m.expect(r).toBeObservable(expected)
      m.expect(a).toHaveSubscriptions(asubs)
    }),
  )
})
