import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0)
    }
  })
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.scrollTo(0, 0)
    }
  })
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
