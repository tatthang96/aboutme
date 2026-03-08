<template>
  <div class="dino-game-section">
    <h2 class="section-title">
      <span class="title-deco"><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /></span>
      BONUS STAGE
      <span class="title-deco"><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /><PhSquare :size="10" weight="fill" /></span>
    </h2>
    <p class="game-hint">
      <PhGameController :size="18" weight="bold" />
      Press SPACE or tap to jump!
    </p>
    <div class="game-wrapper" @click="handleInput" @keydown.space.prevent="handleInput" tabindex="0" ref="gameWrapper">
      <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      <div v-if="!gameStarted && !gameOver" class="game-overlay">
        <span class="overlay-text">PRESS SPACE TO START</span>
      </div>
      <div v-if="gameOver" class="game-overlay">
        <span class="overlay-text">GAME OVER</span>
        <span class="overlay-score">SCORE: {{ score }}</span>
        <span class="overlay-sub">PRESS SPACE TO RETRY</span>
      </div>
      <div class="game-score" v-if="gameStarted && !gameOver">
        <PhTrophy :size="12" weight="bold" /> {{ score }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PhSquare, PhGameController, PhTrophy } from '@phosphor-icons/vue'

const canvas = ref<HTMLCanvasElement | null>(null)
const gameWrapper = ref<HTMLElement | null>(null)
const canvasWidth = 800
const canvasHeight = 200
const score = ref(0)
const gameStarted = ref(false)
const gameOver = ref(false)

// Game state
let ctx: CanvasRenderingContext2D | null = null
let animFrameId = 0
let groundY = 160
let gameSpeed = 4
let frameCount = 0

// Dino (pixel character)
const dino = {
  x: 60,
  y: 0,
  w: 24,
  h: 32,
  vy: 0,
  jumping: false,
  frame: 0,
}

// Obstacles
let obstacles: { x: number; y: number; w: number; h: number; type: string }[] = []
let nextObstacleIn = 80

// Clouds
let clouds: { x: number; y: number; w: number }[] = []

function resetGame() {
  dino.y = groundY - dino.h
  dino.vy = 0
  dino.jumping = false
  dino.frame = 0
  obstacles = []
  clouds = [
    { x: 200, y: 30, w: 40 },
    { x: 450, y: 50, w: 30 },
    { x: 700, y: 20, w: 35 },
  ]
  nextObstacleIn = 80
  gameSpeed = 4
  frameCount = 0
  score.value = 0
}

function handleInput() {
  if (!gameStarted.value) {
    gameStarted.value = true
    gameOver.value = false
    resetGame()
    gameLoop()
    gameWrapper.value?.focus()
    return
  }
  if (gameOver.value) {
    gameOver.value = false
    gameStarted.value = true
    resetGame()
    gameLoop()
    return
  }
  jump()
}

function jump() {
  if (!dino.jumping) {
    dino.vy = -12
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
  drawPixelRect(x + 4, y + 10, 16, 10, '#2563EB')
  drawPixelRect(x + 6, y + 10, 12, 2, '#1D4ED8')

  // Head
  drawPixelRect(x + 6, y, 12, 10, '#f5c6a0')

  // Hair
  drawPixelRect(x + 6, y - 2, 12, 3, '#1a1a2e')

  // Sunglasses
  drawPixelRect(x + 7, y + 3, 4, 2, '#1a1a2e')
  drawPixelRect(x + 13, y + 3, 4, 2, '#1a1a2e')
  drawPixelRect(x + 11, y + 3.5, 2, 1, '#1a1a2e')

  // Smile
  drawPixelRect(x + 9, y + 7, 6, 1, '#e8a088')

  // Legs (running animation)
  if (dino.jumping) {
    // Both legs tucked
    drawPixelRect(x + 6, y + 20, 4, 8, '#1e293b')
    drawPixelRect(x + 14, y + 20, 4, 8, '#1e293b')
    drawPixelRect(x + 5, y + 28, 5, 4, '#111827')
    drawPixelRect(x + 14, y + 28, 5, 4, '#111827')
  } else {
    dino.frame = (dino.frame + 0.15) % 2
    if (dino.frame < 1) {
      // Left forward, right back
      drawPixelRect(x + 5, y + 20, 4, 8, '#1e293b')
      drawPixelRect(x + 15, y + 20, 4, 6, '#1e293b')
      drawPixelRect(x + 4, y + 28, 5, 4, '#111827')
      drawPixelRect(x + 15, y + 26, 5, 4, '#111827')
    } else {
      // Right forward, left back
      drawPixelRect(x + 6, y + 20, 4, 6, '#1e293b')
      drawPixelRect(x + 14, y + 20, 4, 8, '#1e293b')
      drawPixelRect(x + 6, y + 26, 5, 4, '#111827')
      drawPixelRect(x + 13, y + 28, 5, 4, '#111827')
    }
  }

  // Arms
  drawPixelRect(x, y + 12, 4, 3, '#f5c6a0')
  drawPixelRect(x + 20, y + 12, 4, 3, '#f5c6a0')

  // Tie
  drawPixelRect(x + 11, y + 12, 2, 6, '#1a1a2e')
}

function drawCactus(ox: number, oy: number, ow: number, oh: number) {
  if (!ctx) return
  // Main trunk
  drawPixelRect(ox + ow / 2 - 3, oy, 6, oh, '#1E3A5F')
  // Left branch
  if (oh > 20) {
    drawPixelRect(ox, oy + 8, 6, 4, '#1E3A5F')
    drawPixelRect(ox, oy + 4, 4, 8, '#1E3A5F')
  }
  // Right branch
  if (ow > 12) {
    drawPixelRect(ox + ow - 6, oy + 12, 6, 4, '#1E3A5F')
    drawPixelRect(ox + ow - 4, oy + 8, 4, 8, '#1E3A5F')
  }
  // Spikes / detail pixels
  drawPixelRect(ox + ow / 2 - 1, oy - 2, 2, 2, '#2563EB')
}

function drawBug(ox: number, oy: number) {
  if (!ctx) return
  // A flying "bug" obstacle (like a pterodactyl but it's a code bug)
  const f = Math.floor(frameCount / 8) % 2
  drawPixelRect(ox + 4, oy + 4, 12, 6, '#60A5FA')
  drawPixelRect(ox + 6, oy + 5, 3, 3, '#1a1a2e') // eye
  // Wings
  if (f === 0) {
    drawPixelRect(ox, oy, 8, 4, '#3B82F6')
    drawPixelRect(ox + 12, oy, 8, 4, '#3B82F6')
  } else {
    drawPixelRect(ox, oy + 6, 8, 4, '#3B82F6')
    drawPixelRect(ox + 12, oy + 6, 8, 4, '#3B82F6')
  }
  // Antennae
  drawPixelRect(ox + 3, oy + 2, 1, 3, '#93C5FD')
  drawPixelRect(ox + 2, oy + 1, 2, 2, '#93C5FD')
}

function gameLoop() {
  if (!ctx || gameOver.value) return

  // Clear
  ctx.fillStyle = '#0B1120'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  frameCount++

  // Ground
  ctx.fillStyle = '#1E3A5F'
  ctx.fillRect(0, groundY, canvasWidth, 2)
  // Ground details
  for (let gx = (frameCount * gameSpeed) % 40; gx < canvasWidth; gx += 40) {
    ctx.fillStyle = '#1E3A5F'
    ctx.fillRect(canvasWidth - gx, groundY + 6, 8, 2)
    ctx.fillRect(canvasWidth - gx + 20, groundY + 10, 4, 2)
  }

  // Clouds
  ctx.fillStyle = '#1E3A5F'
  for (const cloud of clouds) {
    ctx.globalAlpha = 0.3
    ctx.fillRect(cloud.x, cloud.y, cloud.w, 6)
    ctx.fillRect(cloud.x + 4, cloud.y - 4, cloud.w - 8, 6)
    ctx.globalAlpha = 1
    cloud.x -= gameSpeed * 0.3
    if (cloud.x + cloud.w < 0) {
      cloud.x = canvasWidth + Math.random() * 200
      cloud.y = 20 + Math.random() * 50
    }
  }

  // Dino physics
  dino.vy += 0.7 // gravity
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
        x: canvasWidth,
        y: groundY - 45 - Math.random() * 20,
        w: 20,
        h: 14,
        type: 'bug',
      })
    } else {
      const h = 20 + Math.floor(Math.random() * 20)
      const w = 10 + Math.floor(Math.random() * 10)
      obstacles.push({
        x: canvasWidth,
        y: groundY - h,
        w,
        h,
        type: 'cactus',
      })
    }
    nextObstacleIn = 50 + Math.floor(Math.random() * 60)
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

    // Remove off-screen
    if (obs.x + obs.w < 0) {
      obstacles.splice(i, 1)
      continue
    }

    // Collision (with some padding for fairness)
    const pad = 4
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
  if (frameCount % 300 === 0) {
    gameSpeed += 0.3
  }

  animFrameId = requestAnimationFrame(gameLoop)
}

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = false
    }
  }
  resetGame()
  // Draw initial state
  if (ctx) {
    ctx.fillStyle = '#0B1120'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = '#1E3A5F'
    ctx.fillRect(0, groundY, canvasWidth, 2)
    dino.y = groundY - dino.h
    drawDino()
  }
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  window.removeEventListener('keydown', onKeyDown)
})
</script>
