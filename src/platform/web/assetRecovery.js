// 此脚本由构建器内联到 head，必须先于任何有内容哈希的脚本执行，且不能依赖模块导入。
;(function () {
  var retryParam = '__asset_retry'
  var storageKey = 'chunkReloadAt'
  var recovering = false
  var notified = false

  function retryUrl() {
    var url = new URL(location.href)
    // 旧 SW 的 app shell 会忽略导航查询参数；真实 .html 入口走网络优先，能绕开旧 shell。
    var entries = { '/': '/index.html', '/home': '/home.html', '/tag': '/tag.html', '/catalog': '/catalog.html', '/cluster': '/cluster.html' }
    url.pathname = entries[url.pathname] || url.pathname
    url.searchParams.set(retryParam, String(Date.now()))
    return url.href
  }

  function notify(message) {
    if (notified) return
    notified = true
    function show() {
      var notice = document.createElement('div')
      notice.id = 'asset-recovery-notice'
      notice.setAttribute('role', 'alert')
      notice.style.cssText = 'position:fixed;bottom:24px;right:24px;max-width:calc(100vw - 48px);padding:16px;z-index:var(--z-popup,3000);border:1px solid var(--border-color,#e2e8f0);border-radius:8px;background:var(--card-bg-color,#fff);color:var(--main-text-color,#1e293b);box-shadow:0 4px 16px #0002;font:14px/1.6 sans-serif'
      notice.appendChild(document.createTextNode(message + ' '))
      var link = document.createElement('a')
      link.textContent = '重新加载'
      link.href = retryUrl()
      link.style.color = 'var(--el-color-primary,#409eff)'
      notice.appendChild(link)
      document.body.appendChild(notice)
    }
    if (document.body) show()
    else document.addEventListener('DOMContentLoaded', show, { once: true })
  }

  function recover() {
    if (recovering || notified) return
    if (navigator.onLine === false) {
      notify('网络不可用，请连接网络后重试。')
      return
    }

    var now = Date.now()
    // URL 也是跨刷新的限流标记，隐私模式下 sessionStorage 不可用仍不会循环刷新。
    var last = Number(new URL(location.href).searchParams.get(retryParam)) || 0
    try { last = Math.max(last, Number(sessionStorage.getItem(storageKey)) || 0) } catch (_) {}
    if (last > 0 && last <= now && now - last < 60_000) {
      notify('部分内容加载失败，请检查网络后重试。')
      return
    }
    recovering = true
    try { sessionStorage.setItem(storageKey, String(now)) } catch (_) {}

    var reloaded = false
    function reload() {
      if (reloaded) return
      reloaded = true
      location.replace(retryUrl())
    }
    // 先安排兜底，SW 检查即使因网络挂起，也不能阻塞恢复。
    setTimeout(reload, 2000)
    try {
      var sw = navigator.serviceWorker
      if (sw) {
        sw.addEventListener('controllerchange', reload, { once: true })
        sw.getRegistration().then(function (reg) {
          if (!reg) return
          function activate() {
            if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
          function watchInstalling() {
            if (reg.installing) reg.installing.addEventListener('statechange', activate)
          }
          reg.addEventListener('updatefound', watchInstalling)
          watchInstalling()
          activate()
          return reg.update().then(function () { watchInstalling(); activate() })
        }).catch(function () { /* 定时导航兜底 */ })
      }
    } catch (_) { /* 不支持 SW 时仍能恢复 */ }
  }

  window.addEventListener('vite:preloadError', recover)
  window.addEventListener('error', function (event) {
    var target = event.target
    var source = ''
    if (target instanceof HTMLScriptElement) source = target.src
    if (target instanceof HTMLLinkElement && /^(stylesheet|modulepreload)$/.test(target.rel)) source = target.href
    if (!source) return
    var url = new URL(source, location.href)
    if (url.origin === location.origin && /^\/resource\/.*\.(js|css)$/.test(url.pathname)) recover()
  }, true)
  window.addEventListener('unhandledrejection', function (event) {
    var message = event.reason && (event.reason.message || String(event.reason))
    if (typeof message === 'string' && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(message)) {
      recover()
      event.preventDefault()
    }
  })
})()
