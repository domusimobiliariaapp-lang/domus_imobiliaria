import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Coordinates {
  latitude: number
  longitude: number
}

interface Props {
  center: Coordinates
  selected: Coordinates | null
  onSelect: (coordinates: Coordinates) => void
}

export function PropertyLocationPicker({ center, selected, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.CircleMarker | null>(null)
  const onSelectRef = useRef(onSelect)
  const initialCenter = useRef(center)
  const selectedLatitude = selected?.latitude
  const selectedLongitude = selected?.longitude

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  useEffect(() => {
    if (!container.current || map.current) return
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView([initialCenter.current.latitude, initialCenter.current.longitude], 17)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> colaboradores',
    }).addTo(instance)
    instance.on('click', event => onSelectRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng }))
    map.current = instance
    requestAnimationFrame(() => instance.invalidateSize())
    return () => {
      instance.remove()
      map.current = null
      marker.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const current = instance.getCenter()
    if (current.distanceTo([center.latitude, center.longitude]) > 30) instance.setView([center.latitude, center.longitude], instance.getZoom())
  }, [center.latitude, center.longitude])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    marker.current?.remove()
    marker.current = selectedLatitude != null && selectedLongitude != null ? L.circleMarker([selectedLatitude, selectedLongitude], {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: '#AD7B3B',
      fillOpacity: 1,
    }).addTo(instance) : null
  }, [selectedLatitude, selectedLongitude])

  return <div ref={container} className="h-72 w-full rounded-md border border-border/40" aria-label="Mapa para definir a localização exata do imóvel" />
}
