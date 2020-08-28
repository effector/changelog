import {fork} from 'effector'
import {using} from 'forest'
import {app, Body} from './app'

window.addEventListener('load', () => {
  const scope = fork(app, {
    values: getInitialState()
  })

  using(document.body, {
    scope,
    fn: Body,
    hydrate: process.env.USE_SPA !== 'true'
  })
})

function getInitialState() {
  const json = document.getElementById('initial_state') as HTMLScriptElement
  if (json) {
    try {
      return JSON.parse(json.innerText)
    } catch (err) {}
  }
}
