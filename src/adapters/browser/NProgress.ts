let hideTimer: ReturnType<typeof setTimeout> | null = null
let trickleTimer: ReturnType<typeof setInterval> | null = null
let el: HTMLDivElement | null = null
let pending = 0
let progress = 0

function getEl(): HTMLDivElement {
  if (!el) {
    el = document.createElement('div')
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:0',
      'height:2px',
      'background:var(--el-color-primary,#409eff)',
      'z-index:9999',
      'transition:width 0.3s ease,opacity 0.4s ease',
      'opacity:0',
    ].join(';')
    document.body.appendChild(el)
  }
  return el
}

// 越接近 100% 每次前进越少，模拟真实加载感
function trickleAmount(): number {
  if (progress < 0.2) return 0.08
  if (progress < 0.5) return 0.05
  if (progress < 0.8) return 0.02
  if (progress < 0.95) return 0.005
  return 0
}

function setProgress(n: number) {
  progress = Math.min(n, 0.994)
  getEl().style.width = (progress * 100) + '%'
}

function startTrickle() {
  if (trickleTimer) return
  trickleTimer = setInterval(() => setProgress(progress + trickleAmount()), 800)
}

function stopTrickle() {
  if (trickleTimer) { clearInterval(trickleTimer); trickleTimer = null }
}

export default {
  start() {
    pending++
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    const bar = getEl()
    bar.style.opacity = '1'
    if (progress === 0) setProgress(0.02)
    startTrickle()
  },
  done() {
    if (pending > 0) pending--
    if (pending > 0) return
    stopTrickle()
    setProgress(1)
    hideTimer = setTimeout(() => {
      getEl().style.opacity = '0'
      hideTimer = setTimeout(() => {
        getEl().style.width = '0'
        progress = 0
      }, 400)
    }, 200)
  }
}
