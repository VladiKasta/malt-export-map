import { geoCentroid, geoEqualEarth, geoPath, type GeoProjection } from 'd3-geo'
import { computed, type Ref } from 'vue'
import type { ExportData } from '../api/exportApi'
import { width, height } from '../constants/worldMap'
import type { MapCountry } from '../types/types'
import type { CountriesGeoJson } from '../types/worldMap'

export function useMapGeometry(geojson: Ref<CountriesGeoJson | null>, exportData: Ref<ExportData>) {
	const projection: GeoProjection = geoEqualEarth()
	projection.fitExtent(
		[
			[15, 15],
			[width - 15, height - 15],
		],
		{ type: 'Sphere' }
	)

	const pathGenerator = geoPath(projection)

	const countries = computed<MapCountry[]>(() => {
		if (!geojson.value) return []

		return geojson.value.features.map((feature, index) => {
			const props = feature.properties || {}

			const code = String(props.code || props['ISO3166-1-Alpha-2'] || '').toUpperCase()

			const center = projection(geoCentroid(feature))

			return {
				id: index,
				name: String(props.name || props.ADMIN || ''),
				code,
				path: pathGenerator(feature),
				center: projection(geoCentroid(feature)),
				products: exportData.value[code] || [],
				feature,
			}
		})
	})

	type CountryWithCenter = MapCountry & {
		center: [number, number]
	}

	const countriesWithMarkers = computed<CountryWithCenter[]>(() => {
		return countries.value.filter(
			(country): country is CountryWithCenter =>
				country.products.length > 0 && country.center !== null
		)
	})

	return { countries, countriesWithMarkers, pathGenerator }
}
