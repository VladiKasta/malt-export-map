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
	let dragViewportScale = 1
	let dragFrame: number | null = null
	let pendingTransform: MapTransform | null = null

	function finishDragFrame(apply: boolean) {
		if (dragFrame !== null) cancelAnimationFrame(dragFrame)
		dragFrame = null
		if (apply && pendingTransform) mapTransform.value = pendingTransform
		pendingTransform = null
	}

	onUnmounted(() => finishDragFrame(false))
	const mapTransition = computed(() => isMobile.value ? 'none' : 'transform 650ms ease-in-out')

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
		if (!svg || dragState.value) return

		const rect = svg.getBoundingClientRect()
		dragViewportScale = Math.min(rect.width / width, rect.height / height)
		if (dragViewportScale <= 0) return

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

		// Переводим пиксели экрана в координаты viewBox
		const dx = (event.clientX - drag.startX) / dragViewportScale
		const dy = (event.clientY - drag.startY) / dragViewportScale

		// Небольшой порог, чтобы клик не считался перетаскиванием
		if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 2) {
			return
		}

		// Захватываем указатель только при перетаскивании, чтобы клик попадал в страну.
		if (!drag.moved) {
			svg.setPointerCapture(event.pointerId)
		}

		drag.moved = true
		isDragging.value = true

		pendingTransform = clampMapPosition({
			...mapTransform.value,
			x: drag.initialX + dx,
			y: drag.initialY + dy,
		})
		if (dragFrame === null) {
			dragFrame = requestAnimationFrame(() => {
				dragFrame = null
				if (pendingTransform) mapTransform.value = pendingTransform
				pendingTransform = null
			})
		}
	}

	function onPointerUp(event: PointerEvent) {
		const drag = dragState.value

		if (!drag || drag.pointerId !== event.pointerId) {
			return
		}

		suppressClick.value = drag.moved
		finishDragFrame(true)

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

		suppressClick.value = dragState.value.moved
		finishDragFrame(true)
		dragState.value = null
		isDragging.value = false
	}

	function onLostPointerCapture(event: PointerEvent) {
		const svg = svgRef.value
		// На touch захват сначала принадлежит стране. При передаче SVG
		// потеря захвата страной всплывает сюда, но не завершает перетаскивание.
		if (event.target !== svg || svg?.hasPointerCapture(event.pointerId)) return
		onPointerCancel(event)
	}

	function resetMap() {
		finishDragFrame(false)
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
		if (isMobile.value && country.center) {
			const scale = Math.min(MAX_SCALE, Math.max(3.2, mapTransform.value.scale))
			mapTransform.value = clampMapPosition({
				scale,
				x: width / 2 - country.center[0] * scale,
				y: height / 2 - country.center[1] * scale,
			})
			return
		}

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
		if (!suppressClick.value && !dragState.value?.moved) return

		event.stopPropagation()
		event.preventDefault()

		suppressClick.value = false
	}

	return {
		mapTransition,
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
		onLostPointerCapture,
		onMapClickCapture,
	}
}
