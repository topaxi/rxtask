import { Observable } from 'rxjs/Observable'
import { map } from 'rxjs/operators'
import { OperatorFunction } from 'rxjs/interfaces'
import { UnaryFunction } from '../interfaces'
import { filterNotNull, NotNull } from './filter-not-null'

export type MapNonNullFunction<T, R> = OperatorFunction<T, NotNull<R>>

/**
 * @param {UnaryFunction<T, R>} project
 * @return {MapNonNullFunction<T, R>}
 */
export const mapNonNull = <T, R>(
  project: UnaryFunction<T, R>,
): MapNonNullFunction<T, R> => in$ => in$.pipe(map(project), filterNotNull())

/**
 * @typedef {function(value: T): NotNull<R>} MapNonNullFunction
 */
