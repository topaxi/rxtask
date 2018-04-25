/**
 * @param {never} x
 * @throws {TypeError}
 * @return {never}
 */
export function assertNever(x: never): never {
  throw new TypeError(`Unkown value ${x}`)
}
