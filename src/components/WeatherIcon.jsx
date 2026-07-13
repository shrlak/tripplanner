import React from 'react'
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from 'lucide-react'
import { wmoIconGroup } from '../lib/weather.js'

const ICONS = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

export default function WeatherIcon({ code, size = 16 }) {
  const Icon = ICONS[wmoIconGroup(code)] || Cloud
  return <Icon size={size} />
}
