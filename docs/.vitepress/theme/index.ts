import DefaultTheme from 'vitepress/theme'
import PixelHome from './PixelHome.vue'
import './pixel-style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PixelHome', PixelHome)
  }
}
