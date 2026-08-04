import { useEffect, useState } from 'react'
import type { Location } from '../types'

interface GeolocationState {
  location: Location | null
  error: string | null
  isLoading: boolean
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: 'Geolocation is not supported by this browser', isLoading: false })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          error: null,
          isLoading: false,
        })
      },
      (error) => {
        setState({ location: null, error: error.message, isLoading: false })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  return state
}
