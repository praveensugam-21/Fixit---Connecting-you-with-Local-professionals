import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './leafletIconFix'
import type { Location, TechnicianNearby } from '../../types'
import { RatingStars } from '../common/RatingStars'

interface TechnicianMapProps {
  center: Location
  technicians: TechnicianNearby[]
  onSelect?: (technicianId: string) => void
}

export function TechnicianMap({ center, technicians, onSelect }: TechnicianMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[center.lat, center.lng]}>
        <Popup>Your location</Popup>
      </Marker>

      {technicians.map((tech) => (
        <Marker
          key={tech.id}
          position={[tech.location.lat, tech.location.lng]}
          eventHandlers={onSelect ? { click: () => onSelect(tech.id) } : undefined}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-medium">{tech.full_name}</p>
              <RatingStars rating={tech.avg_rating} count={tech.rating_count} />
              <p className="text-xs text-slate-500">{tech.distance_km.toFixed(1)} km away</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
