import { computed, ref, type Ref } from 'vue'
import { height, width } from '../constants/worldMap'
import type { MapCountry } from '../types/types'
import type { MapTransform } from '../types/worldMap'

export function useCountryPopup(
	hoveredCountry: Ref<MapCountry | null>,
	selectedCountry: Ref<MapCountry | null>,
	mapTransform: Ref<MapTransform>,
	svgRef: Ref<SVGSVGElement | null>
) {
	const mapRef = ref<HTMLElement | null>(null)
	const popupRef = ref<HTMLElement | null>(null)
	const pointerPosition = ref({ x: 0, y: 0 })

	function updatePopupPosition(event: MouseEvent) {
		const map = mapRef.value
		if (!map) return

		const rect = map.getBoundingClientRect()
		pointerPosition.value = {
			x: event.clientX - rect.left - map.clientLeft,
			y: event.clientY - rect.top - map.clientTop,
		}
	}

	const anchorPosition = computed(() => {
		if (hoveredCountry.value) return pointerPosition.value

		const country = selectedCountry.value
		const svg = svgRef.value
		const map = mapRef.value
		if (!country?.center || !svg || !map) return null

		const mapRect = map.getBoundingClientRect()
		const svgRect = svg.getBoundingClientRect()
		const viewportScale = Math.min(svgRect.width / width, svgRect.height / height)
		const { x, y, scale } = mapTransform.value

		return {
			x:
				svgRect.left -
				mapRect.left -
				map.clientLeft +
				(svgRect.width - width * viewportScale) / 2 +
				(country.center[0] * scale + x) * viewportScale,
			y:
				svgRect.top -
				mapRect.top -
				map.clientTop +
				(svgRect.height - height * viewportScale) / 2 +
				(country.center[1] * scale + y) * viewportScale,
		}
	})

	const popupStyle = computed(() => {
		if (!anchorPosition.value || !mapRef.value) return undefined

		const map = mapRef.value
		const popupWidth = popupRef.value?.offsetWidth ?? 260
		const popupHeight = popupRef.value?.offsetHeight ?? 240
		const gap = 16
		const padding = 8
		const { x, y } = anchorPosition.value
		const left = x + gap + popupWidth <= map.clientWidth - padding ? x + gap : x - gap - popupWidth
		const top =
			y + gap + popupHeight <= map.clientHeight - padding ? y + gap : y - gap - popupHeight

		return {
			left: `${Math.max(padding, Math.min(left, map.clientWidth - popupWidth - padding))}px`,
			top: `${Math.max(padding, Math.min(top, map.clientHeight - popupHeight - padding))}px`,
			transform: 'none',
		}
	})

	return { mapRef, popupRef, popupStyle, updatePopupPosition }
}
