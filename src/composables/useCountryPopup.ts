import { computed, ref, watch, type Ref } from 'vue'
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
	const layout = ref({ width: 0, height: 0, svgWidth: 0, svgLeft: 0, svgTop: 0, popupWidth: 220, popupHeight: 200 })

	watch([mapRef, svgRef, popupRef], ([map, svg, popup], _, onCleanup) => {
		if (!map || !svg) return

		function measure() {
			const mapRect = map!.getBoundingClientRect()
			const svgRect = svg!.getBoundingClientRect()
			layout.value = {
				width: map!.clientWidth,
				height: svgRect.height,
				svgWidth: svgRect.width,
				svgLeft: svgRect.left - mapRect.left - map!.clientLeft,
				svgTop: svgRect.top - mapRect.top - map!.clientTop,
				popupWidth: popup?.offsetWidth ?? 220,
				popupHeight: popup?.offsetHeight ?? 200,
			}
		}

		const observer = new ResizeObserver(measure)
		observer.observe(map)
		observer.observe(svg)
		if (popup) observer.observe(popup)
		measure()
		onCleanup(() => observer.disconnect())
	}, { flush: 'post' })

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
		// Пересчитываем экранные координаты при изменении размера карты.
		void layout.value
		if (hoveredCountry.value) return pointerPosition.value

		const country = selectedCountry.value
		const svg = svgRef.value
		const map = mapRef.value
		if (!country?.center || !svg || !map) return null

		const viewport = layout.value
		const viewportScale = Math.min(viewport.svgWidth / width, viewport.height / height)
		const { x, y, scale } = mapTransform.value

		return {
			x:
				viewport.svgLeft +
				(viewport.svgWidth - width * viewportScale) / 2 +
				(country.center[0] * scale + x) * viewportScale,
			y:
				viewport.svgTop +
				(viewport.height - height * viewportScale) / 2 +
				(country.center[1] * scale + y) * viewportScale,
		}
	})

	const popupStyle = computed(() => {
		if (!anchorPosition.value || !mapRef.value) return undefined

		const { width: areaWidth, height: areaHeight } = layout.value
		if (!areaWidth || !areaHeight) return undefined
		const gap = 16
		const padding = 8
		const popupWidth = Math.min(layout.value.popupWidth, areaWidth - padding * 2)
		const popupHeight = Math.min(layout.value.popupHeight, areaHeight - padding * 2)
		const { x, y } = anchorPosition.value
		const left = x + gap + popupWidth <= areaWidth - padding ? x + gap : x - gap - popupWidth
		const top =
			y + gap + popupHeight <= areaHeight - padding ? y + gap : y - gap - popupHeight

		return {
			left: `${Math.max(padding, Math.min(left, areaWidth - popupWidth - padding))}px`,
			top: `${Math.max(padding, Math.min(top, areaHeight - popupHeight - padding))}px`,
			maxWidth: `${areaWidth - padding * 2}px`,
			maxHeight: `${areaHeight - padding * 2}px`,
			overflowY: 'auto' as const,
			transform: 'none',
		}
	})

	return { mapRef, popupRef, popupStyle, updatePopupPosition }
}
