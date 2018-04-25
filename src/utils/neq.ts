/**
 * @param {any} a
 * @return {function(b: any): boolean}
 */
export const neq = <T, U extends T>(a: T) => (b: U): b is U => a !== b
