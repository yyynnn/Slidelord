import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ExampleApp } from './app'
import { storeConfig } from './store'

const store = storeConfig()

ReactDOM.render(
  <Provider store={store}>
    <ExampleApp />
  </Provider>,
  document.getElementById('slidelord')
)
