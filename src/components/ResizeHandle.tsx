import { useCallback, useEffect, useState } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export default function ResizeHandle({ onResize, direction = 'horizontal', className = '' }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = direction === 'horizontal' ? e.movementX : e.movementY
      onResize(delta)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isResizing, onResize, direction])

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        ${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize hover:bg-accent/40' : 'h-1 w-full cursor-row-resize hover:bg-accent/40'}
        transition-colors duration-150 z-50 shrink-0
        ${isResizing ? 'bg-accent/60 shadow-accent-sm' : 'bg-transparent'}
        ${className}
      `}
    />
  )
}
