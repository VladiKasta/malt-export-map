import { onMounted, ref, shallowRef } from 'vue'
import { fetchExportData, type ExportData } from '../api/exportApi'
import type { CountryProperties } from '../types/types'
import type { CountriesGeoJson } from '../types/worldMap'

export function useMapData() {
	const geojson = shallowRef<CountriesGeoJson | null>(null)
	const loading = ref(true)
	const error = ref('')

	const exportData = ref<ExportData>({})

	function getCountryCode(properties: CountryProperties): string {
		return String(properties.code || properties['ISO3166-1-Alpha-2'] || '').toUpperCase()
	}

	onMounted(async () => {
		try {
			const response = await fetch(`${import.meta.env.BASE_URL}maps/countries-custom.geojson`)

			if (!response.ok) {
				throw new Error(`Не удалось загрузить карту: ${response.status}`)
			}

			const data = (await response.json()) as CountriesGeoJson

			geojson.value = data

			const allowedCountryCodes = new Set(
				data.features
					.map(feature => getCountryCode(feature.properties ?? {}))
					.filter(code => code.length > 0)
			)

			exportData.value = await fetchExportData(allowedCountryCodes)
		} catch (err: unknown) {
			error.value = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке карты'
		} finally {
			loading.value = false
		}
	})

	return { geojson, loading, error, exportData }
}
