import { Observable } from 'rxjs/Observable'
import { OperatorFunction } from 'rxjs/interfaces'
import { filter } from 'rxjs/operators'
import { notNull } from '../utils'

export type NotNull<T> = Exclude<T, null>
export type NotNullFilter<T> = OperatorFunction<T, NotNull<T>>

/**
 * @return {NotNullFilter<T>}
 */
export const filterNotNull: <T>() => NotNullFilter<T> = () => filter(notNull)

/**
 * @typedef {function(value: T): NotNull<T>} NotNullFilter
 */
