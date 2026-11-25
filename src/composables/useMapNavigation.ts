import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { GeoPath } from 'd3-geo'
import type { MapCountry } from '../types/types'
import type { DragState, MapTransform } from '../types/worldMap'
import { width, height } from '../constants/worldMap'

export function useMapNavigation(pathGenerator: GeoPath) {
	const mobileQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)') : null
	const isMobile = ref(mobileQuery?.matches ?? false)

	function updateMobile(event: MediaQueryListEvent) {
		isMobile.value = event.matches
	}

	onMounted(() => mobileQuery?.addEventListener('change', updateMobile))
	onUnmounted(() => mobileQuery?.removeEventListener('change', updateMobile))

	const svgRef = ref<SVGSVGElement | null>(null)

	const dragState = ref<DragState | null>(null)
	const isDragging = ref(false)
	const suppressClick = ref(false)

	const MIN_SCALE = 1
	const MAX_SCALE = 8
	const ZOOM_FACTOR = 1.3

	function getInitialTransform(): MapTransform {
		const scale = isMobile.value ? 2.2 : 1
		// На мобильном центрируем обзор между Европой и Азией.
		const [centerX, centerY] = isMobile.value
			? pathGenerator.centroid({ type: 'Point', coordinates: [65, 45] })
			: [width / 2, height / 2]

		return clampMapPosition({
			x: width / 2 - centerX * scale,
			y: height / 2 - centerY * scale,
			scale,
		})
	}

	const mapTransform = ref<MapTransform>(getInitialTransform())

	function zoomMap(factor: number) {
		const current = mapTransform.value

		const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor))

		const ratio = newScale / current.scale

		const centerX = width / 2
		const centerY = height / 2

		mapTransform.value = clampMapPosition({
			scale: newScale,
			x: centerX - (centerX - current.x) * ratio,
			y: centerY - (centerY - current.y) * ratio,
		})
	}

	function zoomIn() {
		zoomMap(ZOOM_FACTOR)
	}

	function zoomOut() {
		zoomMap(1 / ZOOM_FACTOR)
	}

	function onPointerDown(event: PointerEvent) {
		// Только основная кнопка мыши
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return
		}

		const svg = svgRef.value
		if (!svg) return

		dragState.value = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			initialX: mapTransform.value.x,
			initialY: mapTransform.value.y,
			moved: false,
		}
	}

	function onPointerMove(event: PointerEvent) {
		const drag = dragState.value
		const svg = svgRef.value

		if (!drag || !svg || drag.pointerId !== event.pointerId) {
			return
		}

		const rect = svg.getBoundingClientRect()

		// Переводим пиксели экрана в координаты viewBox
		const dx = (event.clientX - drag.startX) * (width / rect.width)
		const dy = (event.clientY - drag.startY) * (height / rect.height)

		// Небольшой порог, чтобы клик не считался перетаскиванием
		if (!drag.moved && Math.hypot(dx, dy) < 2) {
			return
		}

		// Захватываем указатель только при перетаскивании, чтобы клик попадал в страну.
		if (!drag.moved) {
			svg.setPointerCapture(event.pointerId)
		}

		drag.moved = true
		isDragging.value = true

		mapTransform.value = clampMapPosition({
			...mapTransform.value,
			x: drag.initialX + dx,
			y: drag.initialY + dy,
		})
	}

	function onPointerUp(event: PointerEvent) {
		const drag = dragState.value

		if (!drag || drag.pointerId !== event.pointerId) {
			return
		}

		suppressClick.value = drag.moved

		if (svgRef.value?.hasPointerCapture(event.pointerId)) {
			svgRef.value.releasePointerCapture(event.pointerId)
		}

		dragState.value = null
		isDragging.value = false
	}

	function onPointerCancel(event: PointerEvent) {
		if (dragState.value?.pointerId !== event.pointerId) {
			return
		}

		dragState.value = null
		isDragging.value = false
	}

	function resetMap() {
		dragState.value = null
		isDragging.value = false
		suppressClick.value = false

		mapTransform.value = getInitialTransform()
	}

	function clampMapPosition(transform: MapTransform): MapTransform {
		const { x, y, scale } = transform

		const minX = width * (1 - scale)
		const minY = height * (1 - scale)

		return {
			scale,
			x: Math.min(0, Math.max(minX, x)),
			y: Math.min(0, Math.max(minY, y)),
		}
	}

	function focusCountry(country: MapCountry) {
		const [[x0, y0], [x1, y1]] = pathGenerator.bounds(country.feature)

		const countryWidth = x1 - x0
		const countryHeight = y1 - y0

		if (
			!Number.isFinite(countryWidth) ||
			!Number.isFinite(countryHeight) ||
			countryWidth <= 0 ||
			countryHeight <= 0
		) {
			return
		}

		const centerX = (x0 + x1) / 2
		const centerY = (y0 + y1) / 1.9

		const scale = Math.min(
			MAX_SCALE,
			Math.max(1.4, Math.min((width * 0.35) / countryWidth, (height * 0.35) / countryHeight))
		)

		mapTransform.value = clampMapPosition({
			scale,
			x: width / 2 - centerX * scale,
			y: height / 2 - centerY * scale,
		})
	}

	const canZoomIn = computed(() => mapTransform.value.scale < MAX_SCALE)

	const canZoomOut = computed(() => mapTransform.value.scale > MIN_SCALE)

	const markerScale = computed(() => (isMobile.value ? 1.2 : 1) / mapTransform.value.scale)

	function onMapClickCapture(event: MouseEvent) {
		if (!suppressClick.value) return

		event.stopPropagation()
		event.preventDefault()

		suppressClick.value = false
	}

	return {
		svgRef,
		isDragging,
		mapTransform,
		canZoomIn,
		canZoomOut,
		markerScale,
		zoomIn,
		zoomOut,
		resetMap,
		focusCountry,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onMapClickCapture,
	}
}
