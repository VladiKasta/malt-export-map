import { computed, ref, type Ref } from 'vue'
import { countryNamesRu } from '../constants/worldMap'
import type { MapCountry } from '../types/types'

export function useCountrySelection(
	countries: Ref<MapCountry[]>,
	focusCountry: (country: MapCountry) => void,
	resetNavigation: () => void
) {
	const selectedCountry = ref<MapCountry | null>(null)

	const hoveredCountry = ref<MapCountry | null>(null)

	const popupCountry = computed(() => hoveredCountry.value ?? selectedCountry.value)

	const selectedCountryCode = computed<string | null>({
		get: () => selectedCountry.value?.code ?? null,

		set: code => {
			if (!code) {
				resetMap()
				return
			}

			const country = countries.value.find(country => country.code === code)

			if (country) {
				selectCountry(country)
			}
		},
	})

	const exportCountryOptions = computed(() =>
		countries.value
			.filter(country => country.products.length > 0 && country.code)
			.map(country => ({
				code: country.code,
				name: countryNamesRu[country.code] ?? country.name,
			}))
	)

	function selectCountry(country: MapCountry) {
		selectedCountry.value = country
		hoveredCountry.value = null
		focusCountry(country)
	}

	function closeCountry() {
		hoveredCountry.value = null
		selectedCountry.value = null
		resetMap()
	}

	function resetMap() {
		resetNavigation()
		selectedCountry.value = null
		hoveredCountry.value = null
	}

	return {
		selectedCountry,
		hoveredCountry,
		popupCountry,
		selectedCountryCode,
		exportCountryOptions,
		selectCountry,
		closeCountry,
		resetMap,
	}
}
