export function resolvePosition(pos: string): string {
  switch (pos) {
    case 'top-left':      return 'top-8 left-8 items-start text-left'
    case 'top-center':    return 'top-8 left-1/2 -translate-x-1/2 items-center text-center'
    case 'top-right':     return 'top-8 right-8 items-end text-right'
    case 'center-left':   return 'top-1/2 -translate-y-1/2 left-8 items-start text-left'
    case 'center':        return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center text-center'
    case 'center-right':  return 'top-1/2 -translate-y-1/2 right-8 items-end text-right'
    case 'bottom-left':   return 'bottom-8 left-8 items-start text-left'
    case 'bottom-center': return 'bottom-8 left-1/2 -translate-x-1/2 items-center text-center'
    case 'bottom-right':
    default:              return 'bottom-8 right-8 items-end text-right'
  }
}

export function getPreviewPositionStyle(pos: string): string {
  switch (pos) {
    case 'top-left':      return 'top-4 left-4 items-start text-left'
    case 'top-center':    return 'top-4 left-1/2 -translate-x-1/2 items-center text-center'
    case 'top-right':     return 'top-4 right-4 items-end text-right'
    case 'center-left':   return 'top-1/2 -translate-y-1/2 left-4 items-start text-left'
    case 'center':        return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center text-center'
    case 'center-right':  return 'top-1/2 -translate-y-1/2 right-4 items-end text-right'
    case 'bottom-left':   return 'bottom-4 left-4 items-start text-left'
    case 'bottom-center': return 'bottom-4 left-1/2 -translate-x-1/2 items-center text-center'
    case 'bottom-right':
    default:              return 'bottom-4 right-4 items-end text-right'
  }
}
