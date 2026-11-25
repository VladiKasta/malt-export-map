import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { CountryProperties } from './types'

export type CountriesGeoJson = FeatureCollection<Polygon | MultiPolygon, CountryProperties>

export interface DragState {
	pointerId: number
	startX: number
	startY: number
	initialX: number
	initialY: number
	moved: boolean
}

export interface MapTransform {
	x: number
	y: number
	scale: number
}
