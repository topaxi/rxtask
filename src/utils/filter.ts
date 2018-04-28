/**
 * @param {any} a
 * @return {function(b: any): boolean}
 */
export const neq = <T, U extends T>(a: T) => (b: U): b is U => a !== b

/**
 * @param {any|null} value
 * @return {boolean}
 */
export const notNull = <T, S extends Exclude<T, null>>(
  value: T | null,
): value is S => value !== null
