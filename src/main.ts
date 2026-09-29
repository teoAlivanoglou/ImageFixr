import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

if (typeof window !== 'undefined') {
  const resetScroll = () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0)
    }
    if (document.documentElement.scrollTop !== 0 || document.documentElement.scrollLeft !== 0) {
      document.documentElement.scrollTop = 0
      document.documentElement.scrollLeft = 0
    }
    if (document.body.scrollTop !== 0 || document.body.scrollLeft !== 0) {
      document.body.scrollTop = 0
      document.body.scrollLeft = 0
    }
  }

  window.addEventListener('scroll', resetScroll, { passive: true })
  window.addEventListener('resize', resetScroll, { passive: true })
  window.addEventListener('orientationchange', resetScroll, { passive: true })
  window.addEventListener('focus', resetScroll, { passive: true })
  window.addEventListener('pageshow', resetScroll, { passive: true })

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resetScroll, { passive: true })
    window.visualViewport.addEventListener('scroll', resetScroll, { passive: true })
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      resetScroll()
      requestAnimationFrame(resetScroll)
      setTimeout(resetScroll, 50)
      setTimeout(resetScroll, 150)
      setTimeout(resetScroll, 300)
    }
  })
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
