
export default {
  onSwipe(elm: HTMLElement, callback:(direction: ['right' | 'left', 'up' | 'down'], delta: [number, number], start: {x: number, y: number, target: EventTarget | null}) => void) {
    let startEvent: TouchEvent
    elm.addEventListener('touchstart', (e: TouchEvent) => {
      startEvent = e
    }, {passive: true})
    elm.addEventListener('touchend', (e: TouchEvent) => {
      const startTouch = startEvent.changedTouches[0]
      const deltaX = e.changedTouches[0].clientX - startTouch.clientX
      const deltaY = e.changedTouches[0].clientY - startTouch.clientY
      callback(
        [deltaX > 0? 'right': 'left', deltaY > 0? 'down': 'up'],
        [Math.abs(deltaX), Math.abs(deltaY)],
        {x: startTouch.clientX, y: startTouch.clientY, target: startEvent.target}
      )
    }, {passive: true})
  },

  onPress(element: HTMLElement, callback: (duration: number) => void) {
  
    let pressed = false
    let pressedTime = 0
    const startHandler = (e: Event) => {
      pressed = true
      pressedTime = new Date().getTime()
      e.stopPropagation()
      e.preventDefault()
      return false
    };
  
    const endHandler = (e: Event) => {
      if (pressed) {
        const now = new Date().getTime();
        callback(now - pressedTime);
        pressed = false
      }
      e.stopPropagation()
      e.preventDefault()
      return false
    };
  
    element.addEventListener('touchstart', startHandler);
    element.addEventListener('touchend', endHandler);
    element.addEventListener('touchcancel', endHandler);
  }
}