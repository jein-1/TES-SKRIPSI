// leaflet-rotate type augmentation
import 'leaflet'

declare module 'leaflet' {
  interface Map {
    setBearing(bearing: number): this
    getBearing(): number
    touchRotate: { enable(): void; disable(): void; _enabled?: boolean }
    compassBearing?: { enable(): void; disable(): void }
  }
  interface MapOptions {
    rotate?: boolean
    touchRotate?: boolean
    bearingSnap?: number
    rotateControl?: boolean | { position: string }
  }
}
