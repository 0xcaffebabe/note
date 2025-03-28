
export default {
  onSwipe(elm: HTMLElement, callback:(direction: ['right' | 'left', 'up' | 'down'], delta: [number, number]) => void) {
    let startEvent: TouchEvent
    let endEvent
    elm.addEventListener('touchstart', (e: TouchEvent) => {
      startEvent = e
    })
    elm.addEventListener('touchend', (e: TouchEvent) => {
      endEvent = e
      const deltaX = endEvent.changedTouches[0].clientX - startEvent.changedTouches[0].clientX
      const deltaY = endEvent.changedTouches[0].clientY - startEvent.changedTouches[0].clientY
      callback([deltaX > 0? 'right': 'left', deltaX > 0? 'down': 'up'], [Math.abs(deltaX), Math.abs(deltaY)])
    })
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