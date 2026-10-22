import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export interface NumberTickerProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function NumberTicker({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
  className = '',
}: NumberTickerProps) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const display = useTransform(spring, (latest) => {
    return (
      prefix +
      latest.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix
    )
  })

  return <motion.span className={className}>{display}</motion.span>
}
