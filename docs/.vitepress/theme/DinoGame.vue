<template>
  <div class="dino-game-section" ref="sectionRef">
    <h2 class="section-title">
      <span class="title-deco"><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /></span>
      BONUS STAGE
      <span class="title-deco"><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /></span>
    </h2>
    <p class="game-hint">
      <PhGameController :size="18" weight="bold" />
      Press SPACE or tap to jump!
    </p>
    <div
      class="game-wrapper"
      @click="handleInput"
      @touchstart.prevent="handleInput"
      @keydown.space.prevent="handleInput"
      tabindex="0"
      ref="gameWrapper"
    >
      <canvas ref="canvas"></canvas>
      <div v-if="!gameStarted && !gameOver" class="game-overlay">
        <span class="overlay-text">{{ autoStarting ? 'GET READY...' : 'TAP OR PRESS SPACE' }}</span>
      </div>
      <div v-if="gameOver" class="game-overlay">
        <span class="overlay-text">GAME OVER</span>
        <span class="overlay-score">SCORE: {{ score }}</span>
        <span class="overlay-sub">TAP OR PRESS SPACE TO RETRY</span>
      </div>
      <div class="game-score" v-if="gameStarted && !gameOver">
        <PhTrophy :size="14" weight="bold" /> {{ score }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { PhSquare, PhGameController, PhTrophy } from '@phosphor-icons/vue'

const canvas = ref<HTMLCanvasElement | null>(null)
const gameWrapper = ref<HTMLElement | null>(null)
const sectionRef = ref<HTMLElement | null>(null)
const score = ref(0)
const gameStarted = ref(false)
const gameOver = ref(false)
const autoStarting = ref(false)

// Internal canvas resolution (will scale to fill container)
const GAME_W = 960
const GAME_H = 240

// Game state
let ctx: CanvasRenderingContext2D | null = null
let animFrameId = 0
let groundY = GAME_H - 40
let gameSpeed = 5
let frameCount = 0
let observer: IntersectionObserver | null = null
let autoStartTimer: ReturnType<typeof setTimeout> | null = null
let hasAutoStarted = false

// Scale factor for pixel sizes on different resolutions
const S = GAME_W / 960 // 1x base

// Dino (pixel character)
const dino = {
  x: 80,
  y: 0,
  w: 30,
  h: 40,
  vy: 0,
  jumping: false,
  frame: 0,
}

// Obstacles
let obstacles: { x: number; y: number; w: number; h: number; type: string }[] = []
let nextObstacleIn = 80

// Clouds
let clouds: { x: number; y: number; w: number }[] = []

// Stars (background decoration)
let stars: { x: number; y: number; s: number; b: number }[] = []

function resetGame() {
  dino.y = groundY - dino.h
  dino.vy = 0
  dino.jumping = false
  dino.frame = 0
  obstacles = []
  clouds = []
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * GAME_W,
      y: 20 + Math.random() * 60,
      w: 30 + Math.random() * 30,
    })
  }
  stars = []
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * GAME_W,
      y: Math.random() * (groundY - 20),
      s: 1 + Math.random() * 2,
      b: 0.2 + Math.random() * 0.5,
    })
  }
  nextObstacleIn = 80
  gameSpeed = 5
  frameCount = 0
  score.value = 0
}

function startGame() {
  gameStarted.value = true
  gameOver.value = false
  autoStarting.value = false
  resetGame()
  gameLoop()
  gameWrapper.value?.focus()
}

function handleInput() {
  if (!gameStarted.value) {
    if (autoStartTimer) {
      clearTimeout(autoStartTimer)
      autoStartTimer = null
    }
    startGame()
    return
  }
  if (gameOver.value) {
    startGame()
    return
  }
  jump()
}

function jump() {
  if (!dino.jumping) {
    dino.vy = -14
    dino.jumping = true
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    handleInput()
  }
}

function drawPixelRect(x: number, y: number, w: number, h: number, color: string) {
  if (!ctx) return
  ctx.fillStyle = color
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h)
}

function drawDino() {
  if (!ctx) return
  const x = dino.x
  const y = Math.floor(dino.y)

  // Body (blue jacket - Gangnam style!)
  drawPixelRect(x + 5, y + 12, 20, 12, '#2563EB')
  drawPixelRect(x + 7, y + 12, 16, 3, '#1D4ED8')

  // Head
  drawPixelRect(x + 7, y, 16, 12, '#f5c6a0')

  // Hair
  drawPixelRect(x + 7, y - 3, 16, 4, '#1a1a2e')

  // Sunglasses
  drawPixelRect(x + 8, y + 4, 5, 3, '#1a1a2e')
  drawPixelRect(x + 16, y + 4, 5, 3, '#1a1a2e')
  drawPixelRect(x + 13, y + 5, 3, 1, '#1a1a2e')
  // Lens glare
  drawPixelRect(x + 9, y + 4.5, 2, 1, '#3B82F6')
  drawPixelRect(x + 17, y + 4.5, 2, 1, '#3B82F6')

  // Smile
  drawPixelRect(x + 11, y + 9, 8, 1, '#e8a088')

  // Legs (running animation)
  if (dino.jumping) {
    drawPixelRect(x + 7, y + 24, 5, 10, '#1e293b')
    drawPixelRect(x + 18, y + 24, 5, 10, '#1e293b')
    drawPixelRect(x + 6, y + 34, 6, 4, '#111827')
    drawPixelRect(x + 18, y + 34, 6, 4, '#111827')
  } else {
    dino.frame = (dino.frame + 0.15) % 2
    if (dino.frame < 1) {
      drawPixelRect(x + 6, y + 24, 5, 10, '#1e293b')
      drawPixelRect(x + 19, y + 24, 5, 8, '#1e293b')
      drawPixelRect(x + 5, y + 34, 6, 4, '#111827')
      drawPixelRect(x + 19, y + 32, 6, 4, '#111827')
    } else {
      drawPixelRect(x + 7, y + 24, 5, 8, '#1e293b')
      drawPixelRect(x + 18, y + 24, 5, 10, '#1e293b')
      drawPixelRect(x + 7, y + 32, 6, 4, '#111827')
      drawPixelRect(x + 17, y + 34, 6, 4, '#111827')
    }
  }

  // Arms
  drawPixelRect(x, y + 14, 5, 4, '#f5c6a0')
  drawPixelRect(x + 25, y + 14, 5, 4, '#f5c6a0')

  // Tie
  drawPixelRect(x + 14, y + 15, 2, 7, '#FBBF24')
}

function drawCactus(ox: number, oy: number, ow: number, oh: number) {
  if (!ctx) return
  drawPixelRect(ox + ow / 2 - 4, oy, 8, oh, '#1E3A5F')
  if (oh > 25) {
    drawPixelRect(ox, oy + 10, 8, 5, '#1E3A5F')
    drawPixelRect(ox, oy + 5, 5, 10, '#1E3A5F')
  }
  if (ow > 14) {
    drawPixelRect(ox + ow - 8, oy + 14, 8, 5, '#1E3A5F')
    drawPixelRect(ox + ow - 5, oy + 10, 5, 10, '#1E3A5F')
  }
  drawPixelRect(ox + ow / 2 - 1, oy - 3, 3, 3, '#2563EB')
}

function drawBug(ox: number, oy: number) {
  if (!ctx) return
  const f = Math.floor(frameCount / 8) % 2
  drawPixelRect(ox + 5, oy + 5, 14, 8, '#60A5FA')
  drawPixelRect(ox + 7, oy + 6, 4, 4, '#1a1a2e')
  if (f === 0) {
    drawPixelRect(ox, oy, 10, 5, '#3B82F6')
    drawPixelRect(ox + 14, oy, 10, 5, '#3B82F6')
  } else {
    drawPixelRect(ox, oy + 8, 10, 5, '#3B82F6')
    drawPixelRect(ox + 14, oy + 8, 10, 5, '#3B82F6')
  }
  drawPixelRect(ox + 4, oy + 2, 2, 4, '#93C5FD')
  drawPixelRect(ox + 3, oy, 3, 3, '#93C5FD')
}

function drawStars() {
  if (!ctx) return
  for (const star of stars) {
    const flicker = Math.sin(frameCount * 0.05 + star.x) * 0.15
    ctx.globalAlpha = star.b + flicker
    ctx.fillStyle = '#60A5FA'
    ctx.fillRect(star.x, star.y, star.s, star.s)
  }
  ctx.globalAlpha = 1
}

function resizeCanvas() {
  if (!canvas.value || !gameWrapper.value) return
  const wrapperW = gameWrapper.value.clientWidth
  // Maintain aspect ratio, use full width
  const ratio = GAME_H / GAME_W
  const displayH = Math.max(wrapperW * ratio, 180)

  canvas.value.width = GAME_W
  canvas.value.height = GAME_H
  canvas.value.style.width = wrapperW + 'px'
  canvas.value.style.height = displayH + 'px'

  if (ctx) {
    ctx.imageSmoothingEnabled = false
  }
}

function gameLoop() {
  if (!ctx || gameOver.value) return

  ctx.fillStyle = '#0B1120'
  ctx.fillRect(0, 0, GAME_W, GAME_H)

  frameCount++

  // Stars
  drawStars()

  // Ground line
  ctx.fillStyle = '#2563EB'
  ctx.fillRect(0, groundY, GAME_W, 2)
  // Ground texture
  ctx.fillStyle = '#1E3A5F'
  for (let gx = (frameCount * gameSpeed) % 50; gx < GAME_W; gx += 50) {
    ctx.fillRect(GAME_W - gx, groundY + 6, 10, 2)
    ctx.fillRect(GAME_W - gx + 25, groundY + 12, 6, 2)
  }
  // Ground fill
  ctx.fillStyle = '#080E1A'
  ctx.fillRect(0, groundY + 2, GAME_W, GAME_H - groundY)

  // Clouds
  ctx.fillStyle = '#1E3A5F'
  for (const cloud of clouds) {
    ctx.globalAlpha = 0.2
    ctx.fillRect(cloud.x, cloud.y, cloud.w, 8)
    ctx.fillRect(cloud.x + 5, cloud.y - 5, cloud.w - 10, 8)
    ctx.globalAlpha = 1
    cloud.x -= gameSpeed * 0.3
    if (cloud.x + cloud.w < 0) {
      cloud.x = GAME_W + Math.random() * 300
      cloud.y = 20 + Math.random() * 60
    }
  }

  // Dino physics
  dino.vy += 0.8
  dino.y += dino.vy
  if (dino.y >= groundY - dino.h) {
    dino.y = groundY - dino.h
    dino.vy = 0
    dino.jumping = false
  }

  drawDino()

  // Spawn obstacles
  nextObstacleIn--
  if (nextObstacleIn <= 0) {
    const isBug = Math.random() > 0.7 && score.value > 5
    if (isBug) {
      obstacles.push({
        x: GAME_W,
        y: groundY - 55 - Math.random() * 25,
        w: 24,
        h: 18,
        type: 'bug',
      })
    } else {
      const h = 25 + Math.floor(Math.random() * 25)
      const w = 14 + Math.floor(Math.random() * 12)
      obstacles.push({
        x: GAME_W,
        y: groundY - h,
        w,
        h,
        type: 'cactus',
      })
    }
    nextObstacleIn = 45 + Math.floor(Math.random() * 55)
  }

  // Update & draw obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i]
    obs.x -= gameSpeed

    if (obs.type === 'bug') {
      drawBug(obs.x, obs.y)
    } else {
      drawCactus(obs.x, obs.y, obs.w, obs.h)
    }

    if (obs.x + obs.w < 0) {
      obstacles.splice(i, 1)
      continue
    }

    // Collision
    const pad = 5
    if (
      dino.x + dino.w - pad > obs.x + pad &&
      dino.x + pad < obs.x + obs.w - pad &&
      dino.y + dino.h - pad > obs.y + pad &&
      dino.y + pad < obs.y + obs.h - pad
    ) {
      gameOver.value = true
      return
    }
  }

  // Score
  if (frameCount % 6 === 0) {
    score.value++
  }

  // Increase speed
  if (frameCount % 250 === 0) {
    gameSpeed += 0.3
  }

  animFrameId = requestAnimationFrame(gameLoop)
}

function drawInitialState() {
  if (!ctx) return
  ctx.fillStyle = '#0B1120'
  ctx.fillRect(0, 0, GAME_W, GAME_H)

  // Draw stars
  for (const star of stars) {
    ctx.globalAlpha = star.b
    ctx.fillStyle = '#60A5FA'
    ctx.fillRect(star.x, star.y, star.s, star.s)
  }
  ctx.globalAlpha = 1

  // Ground
  ctx.fillStyle = '#2563EB'
  ctx.fillRect(0, groundY, GAME_W, 2)
  ctx.fillStyle = '#080E1A'
  ctx.fillRect(0, groundY + 2, GAME_W, GAME_H - groundY)

  dino.y = groundY - dino.h
  drawDino()
}

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
  }

  resetGame()
  nextTick(() => {
    resizeCanvas()
    drawInitialState()
  })

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', resizeCanvas)

  // Auto-start when scrolled into view
  if (sectionRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !gameStarted.value && !hasAutoStarted) {
            hasAutoStarted = true
            autoStarting.value = true
            // Brief "GET READY" then auto-start
            autoStartTimer = setTimeout(() => {
              if (!gameStarted.value) {
                startGame()
              }
            }, 1200)
          }
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(sectionRef.value)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', resizeCanvas)
  if (observer) observer.disconnect()
  if (autoStartTimer) clearTimeout(autoStartTimer)
})
</script>
