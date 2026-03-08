import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tat Thang',
  description: 'Personal Portfolio',
  base: '/aboutme/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/aboutme/favicon.svg' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      { text: 'Projects', link: '/projects' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tatthang96' }
    ],
    footer: {
      message: 'Built with VitePress',
      copyright: '© 2026 Tat Thang'
    }
  }
})
