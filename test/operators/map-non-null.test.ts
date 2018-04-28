import { mapNonNull } from '../../src/operators/map-non-null'
import { marbles } from 'rxjs-marbles'

const selectValue = <T extends { value: any }>(v: T): any => v.value

/** @test {mapNonNull} */
describe('operators/mapNonNull', () => {
  it(
    'maps values and filters resulting null values',
    marbles(m => {
      const avals = {
        a: { value: null },
        b: { value: undefined },
        c: { value: '' },
        d: { value: null },
        e: { value: 42 },
      }
      const expectedvals = {
        x: undefined,
        y: '',
        z: 42,
      }

      const a        = m.cold('abcde|', avals) // prettier-ignore
      const asubs    =        '^    !' // prettier-ignore
      const expected = m.cold('-xy-z|', expectedvals)

      const r = a.pipe(mapNonNull(selectValue))

      m.expect(r).toBeObservable(expected)
      m.expect(a).toHaveSubscriptions(asubs)
    }),
  )
})
