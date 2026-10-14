import { useEffect, useState } from "react"

interface BubbleProps {
  text: string
  visible: boolean
  duration?: number
  onHide?: () => void
}

export function Bubble({
  text,
  visible,
  duration = 5000,
  onHide,
}: BubbleProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!visible) {
      setFading(false)
      return
    }

    setFading(false)

    const fadeTimer = window.setTimeout(() => {
      setFading(true)
    }, duration)

    const hideTimer = window.setTimeout(() => {
      onHide?.()
    }, duration + 800)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [visible, duration, text, onHide])

  if (!visible) {
    return null
  }

  return (
    <div className={`bubble ${fading ? "bubble-fade-out" : ""}`}>
      <div className="bubble-text">
        {text}
      </div>

      {/* 思考气泡的小圆点 */}
      <div className="bubble-dot bubble-dot-large" />
      <div className="bubble-dot bubble-dot-small" />
    </div>
  )
}