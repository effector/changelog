import {fork} from 'effector'
import {using} from 'forest'
import {app, Body} from './app'

const scope = fork(app, {
  values: (window as any).__INITIAL_STATE__
})

using(document.body, {
  scope,
  fn: Body
  // hydrate: true
})
