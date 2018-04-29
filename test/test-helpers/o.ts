import { Observable } from 'rxjs/Observable'
import { TaskInstance } from '../../src/task-instance'

export const o = <T>(t: TaskInstance<T>): Observable<T> => t as any
