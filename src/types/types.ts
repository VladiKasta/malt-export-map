/* export const Country = {
	center:
} */
import type { Feature, MultiPolygon, Polygon } from 'geojson'

export interface MapCountry {
	id: number
	center: [number, number] | null
	name: string
	code: string
	path: string | null
	products: Product[]
	feature: Feature<Polygon | MultiPolygon, CountryProperties>
}

export interface CountryProperties {
	name: string
	iso_a2?: string
	[key: string]: unknown // на случай дополнительных полей
}

export type Product = 'malt' | 'hops' | 'barley' | 'wheat' | 'chickpeas'
