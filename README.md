# RxTask [![Build Status](https://travis-ci.org/topaxi/rxtask.svg?branch=master)](https://travis-ci.org/topaxi/rxtask) [![Test Coverage](https://api.codeclimate.com/v1/badges/21326724623aaafae755/test_coverage)](https://codeclimate.com/github/topaxi/rxtask/test_coverage)

A more object oriented approach to do concurrency with RxJS.

# Installation

```sh
npm install rxtask
```

```sh
yarn add rxtask
```

# Documentation

**Work In Progress**

## Usage

```typescript
import { Observable } from 'rxjs'
import { task } from 'rxtask'

const request = task((id: number) =>
  Observable.ajax(`/api/users/${id}`)
)

request.performed$ // How many times `request.perform()` has been called
request.pending$ // List of pending tasks
request.running$ // List of currently running tasks
request.cancelled$ // Counts many tasks have been cancelled

const fetch = task((id: number) =>
  Observable.ajax(`/api/users/${id}`)
).switch()

// Like switchAll(), switchMap() from RxJS, these three calls result
// in only one AJAX request.
fetch(5)
fetch(6)
fetch(7)

const update = task((framework: { id: number }) =>
  Observable.ajax(`/api/frameworks/${framework.id}`, framework)
).drop()

// Like exhaust() from RxJS, any call to update() will be dropped until
// the running update request is complete.
update({ id: 1, name: 'Ember.js' })
update({ id: 2, name: 'React' })
update({ id: 3, name: 'Vue.js' })
update({ id: 4, name: 'Angular' })
```

## Angular Examples

### Typeahead

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { delay, switchMapTo } from 'rxjs/operators'
import { task, NgTask } from 'rxtask/ngx'

const DEBOUNCE_TIME = 200

@Component({
  selector: 'rt-typeahead',
  template: `
    <input (input)="search.perform($event.target.value)"
           placeholder="Search...">

    <loading-spinner *ngIf="search.isRunning$ | async"></loading-spinner>

    <ul *ngIf="search.lastSuccessful$ | async as lastSuccessful">
      <li *ngFor="let result of lastSuccessful.value">{{result.name}}</li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class UserDetailsComponent {
  @NgTask()
  search = task((query: string) =>
    of(query).pipe(
      delay(DEBOUNCE_TIME)
      switchMapTo(this.http.get('/api/users', { params: { query } }))
    )
  ).switch()

  constructor(private http: HttpClient) {}
}
```

### Showing a detail page with loading and error state

```typescript
import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { task, NgTask } from 'rxtask/ngx'

@Component({
  selector: 'rt-user-details',
  template: `
    <div *ngIf="fetchUser.isRunning$ | async; else details" class="loading">
      Loading...
    </div>
    <ng-template #details>
      <div *ngIf="fetchUser.lastCompleted$ | async as lastCompleted">
        <div *ngIf="lastCompleted.error; else #details" class="error">
          <h3>Ohno! Something bad happened!</h3>
          <p>Error: {{lastCompleted.error.message}}</p>
        </div>
        <div *ngIf="lastCompleted.value; let user">
          <dl>
            <dt>Name</dt>
            <dd>{{user.name}}</dd>
            <dt>Birthday</dt>
            <dd>{{user.birthday}}</dd>
          </dl>
        </div>
      </div>
    </ng-template>
  `
})
class UserDetailsComponent implements OnChanges {
  @Input() userId: number

  @NgTask()
  fetchUser = task((id: number) => this.users.fetch(id)).switch()

  constructor(private users: UsersRestService) {}

  ngOnChanges({ userId }: SimpleChanges): void {
    if (userId != null) {
      this.fetchUser.perform(userId.currentValue);
    }
  }
}
```

# Maintenance

## Installation

- `git clone`
- `yarn install`

## Running

- `yarn test`

# Generate Docs

- `yarn build:docs`

## Publish Docs

- `yarn publish:docs`
