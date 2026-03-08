<template>
  <div class="pixel-home">
    <!-- Floating pixels background -->
    <div class="pixel-bg">
      <div v-for="n in 30" :key="n" class="floating-pixel" :style="randomPixelStyle(n)" />
    </div>

    <!-- Hero Section -->
    <section class="pixel-hero">
      <div class="hero-content">
        <!-- Pixel Avatar -->
        <div class="avatar-container">
          <div class="avatar-frame">
            <img :src="withBase('/pixel-avatar.svg')" alt="Pixel Avatar" class="pixel-avatar" />
          </div>
          <div class="avatar-shadow" />
          <!-- Speech bubble -->
          <div class="speech-bubble">
            <span class="bubble-text">Hello World!</span>
          </div>
        </div>

        <!-- Text content -->
        <div class="hero-text">
          <div class="pixel-badge">[ DEVELOPER ]</div>
          <h1 class="glitch-text" data-text="Tat Thang">
            <span class="typing-text">{{ displayedName }}</span>
            <span class="cursor">_</span>
          </h1>
          <p class="hero-tagline">
            <span class="pixel-arrow">&gt;</span> {{ displayedTagline }}<span class="cursor secondary">_</span>
          </p>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-label">CLASS</span>
              <span class="stat-value">Full-Stack Dev</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">STATUS</span>
              <span class="stat-value online">Online</span>
            </div>
          </div>

          <div class="hero-actions">
            <a :href="withBase('/about')" class="pixel-btn primary">
              <span class="btn-icon">&#9654;</span> About Me
            </a>
            <a :href="withBase('/projects')" class="pixel-btn secondary">
              <span class="btn-icon">&#9733;</span> Projects
            </a>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="scroll-indicator">
        <span class="scroll-arrow">&#9660;</span>
        <span class="scroll-text">SCROLL DOWN</span>
      </div>
    </section>

    <!-- Skills Section -->
    <section class="pixel-section">
      <h2 class="section-title">
        <span class="title-deco">&#9632;&#9632;&#9632;</span>
        SKILLS & ABILITIES
        <span class="title-deco">&#9632;&#9632;&#9632;</span>
      </h2>

      <div class="skill-grid">
        <div v-for="(skill, i) in skills" :key="i" class="skill-card" :style="{ animationDelay: `${i * 0.15}s` }">
          <div class="skill-icon">{{ skill.icon }}</div>
          <h3 class="skill-name">{{ skill.name }}</h3>
          <div class="skill-bar-container">
            <div class="skill-bar" :style="{ width: skill.level + '%' }">
              <span class="skill-level">{{ skill.level }}%</span>
            </div>
          </div>
          <p class="skill-desc">{{ skill.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Quest Board -->
    <section class="pixel-section dark">
      <h2 class="section-title">
        <span class="title-deco">&#9632;&#9632;&#9632;</span>
        QUEST BOARD
        <span class="title-deco">&#9632;&#9632;&#9632;</span>
      </h2>

      <div class="quest-grid">
        <div v-for="(quest, i) in quests" :key="i" class="quest-card">
          <div class="quest-header">
            <span class="quest-type">{{ quest.type }}</span>
            <span class="quest-status" :class="quest.status">{{ quest.statusText }}</span>
          </div>
          <h3 class="quest-name">{{ quest.name }}</h3>
          <p class="quest-desc">{{ quest.desc }}</p>
          <div class="quest-rewards">
            <span class="reward-label">REWARDS:</span>
            <span class="reward-item" v-for="(r, j) in quest.rewards" :key="j">{{ r }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

const displayedName = ref('')
const displayedTagline = ref('')
const fullName = 'Tat Thang'
const fullTagline = 'Building things for the web, one pixel at a time...'

const skills = [
  { icon: '&#x1F310;', name: 'Web Dev', level: 85, desc: 'HTML, CSS, JavaScript & modern frameworks' },
  { icon: '&#x1F4BB;', name: 'Clean Code', level: 80, desc: 'Maintainable & well-structured code' },
  { icon: '&#x1F680;', name: 'Learning', level: 95, desc: 'Always exploring new technologies' },
  { icon: '&#x1F527;', name: 'Problem Solving', level: 88, desc: 'Debugging & creative solutions' },
]

const quests = [
  {
    type: 'MAIN QUEST',
    name: 'Web Development',
    desc: 'Building responsive and modern web applications with cutting-edge technologies.',
    status: 'active',
    statusText: 'IN PROGRESS',
    rewards: ['XP +500', 'New Skills'],
  },
  {
    type: 'SIDE QUEST',
    name: 'Open Source',
    desc: 'Contributing to open source projects and sharing knowledge with the community.',
    status: 'active',
    statusText: 'IN PROGRESS',
    rewards: ['XP +300', 'Community'],
  },
  {
    type: 'DAILY',
    name: 'Continuous Learning',
    desc: 'Exploring new tools, frameworks, and best practices every day.',
    status: 'completed',
    statusText: 'REPEATABLE',
    rewards: ['XP +100', 'Growth'],
  },
]

function randomPixelStyle(n: number) {
  const size = 4 + Math.floor(Math.random() * 8)
  const colors = ['#6c5ce7', '#00cec9', '#fd79a8', '#ffeaa7', '#55efc4', '#a29bfe']
  return {
    width: size + 'px',
    height: size + 'px',
    left: (Math.random() * 100) + '%',
    top: (Math.random() * 100) + '%',
    backgroundColor: colors[n % colors.length],
    animationDuration: (3 + Math.random() * 5) + 's',
    animationDelay: (Math.random() * 3) + 's',
    opacity: 0.15 + Math.random() * 0.35,
  }
}

onMounted(() => {
  let i = 0
  const nameInterval = setInterval(() => {
    if (i <= fullName.length) {
      displayedName.value = fullName.slice(0, i)
      i++
    } else {
      clearInterval(nameInterval)
      let j = 0
      const taglineInterval = setInterval(() => {
        if (j <= fullTagline.length) {
          displayedTagline.value = fullTagline.slice(0, j)
          j++
        } else {
          clearInterval(taglineInterval)
        }
      }, 40)
    }
  }, 100)
})
</script>
