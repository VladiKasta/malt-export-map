<script setup lang="ts">
import { useCountrySelection } from '../composables/useCountrySelection'
import { useCountryPopup } from '../composables/useCountryPopup'
import { useMapData } from '../composables/useMapData'
import { useMapGeometry } from '../composables/useMapGeometry'
import { useMapNavigation } from '../composables/useMapNavigation'
import { countryNamesRu, height, productColors, productNames, width } from '../constants/worldMap'
import getMarkerPosition from '../functions/getMarkerPosition'
import CountryDropdown from './CountryDropdown.vue'
import MapControls from './MapControls.vue'
import MapLegend from './MapLegend.vue'

const { geojson, loading, error, exportData } = useMapData()
const { countries, countriesWithMarkers, pathGenerator } = useMapGeometry(geojson, exportData)

const {
	mapTransition,
	svgRef,
	isDragging,
	mapTransform,
	canZoomIn,
	canZoomOut,
	markerScale,
	zoomIn,
	zoomOut,
	resetMap: resetNavigation,
	focusCountry,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onPointerCancel,
	onLostPointerCapture,
	onMapClickCapture,
} = useMapNavigation(pathGenerator)

const {
	selectedCountry,
	hoveredCountry,
	popupCountry,
	selectedCountryCode,
	exportCountryOptions,
	selectCountry,
	closeCountry,
	resetMap,
} = useCountrySelection(countries, focusCountry, resetNavigation)

const { mapRef, popupRef, popupStyle, updatePopupPosition } = useCountryPopup(
	hoveredCountry,
	selectedCountry,
	mapTransform,
	svgRef
)
</script>

<template>
	<!-- <div class="page"></div> -->
	<CountryDropdown
		v-model="selectedCountryCode"
		:countries="exportCountryOptions"
	/>

	<div ref="mapRef" class="world-map">
		<div
			v-if="loading"
			class="map-message"
		>
			Загрузка карты...
		</div>

		<div
			v-else-if="error"
			class="map-message"
		>
			{{ error }}
		</div>

		<svg
			v-else
			ref="svgRef"
			:viewBox="`0 0 ${width} ${height}`"
			xmlns="http://www.w3.org/2000/svg"
			class="map-svg"
			:style="{ '--map-transition': mapTransition }"
			:class="{ 'map-svg--dragging': isDragging }"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointercancel="onPointerCancel"
			@lostpointercapture="onLostPointerCapture"
			@click.capture="onMapClickCapture"
		>
			<g
				class="map-content"
				:style="{
					transition: isDragging ? 'none' : mapTransition,
				}"
				:transform="`translate(${mapTransform.x}, ${mapTransform.y}) scale(${mapTransform.scale})`"
			>
				<!-- Контуры стран -->
				<path
					v-for="country in countries"
					v-memo="[country, selectedCountry?.id]"
					:key="country.id"
					:d="country.path ?? ''"
					class="country"
					:class="{
						'country--export': country.products.length > 0,
						'country--selected': selectedCountry?.code === country.code,
					}"
					@click="selectCountry(country)"
				>
					<title>{{ country.name }}</title>
				</path>

				<!-- Контур выбранной страны поверх всех остальных -->
				<path
					v-if="selectedCountry?.path"
					:d="selectedCountry.path"
					class="country-outline"
				/>

				<!-- Маркеры -->
				<g
					v-for="country in countriesWithMarkers"
					v-memo="[country, markerScale]"
					:key="`markers-${country.id}`"
					:transform="`translate(${country.center[0]}, ${country.center[1]})`"
					class="country-markers"
					@mouseenter="hoveredCountry = country; updatePopupPosition($event)"
					@mousemove="updatePopupPosition"
					@mouseleave="hoveredCountry = null"
					@click.stop="selectCountry(country)"
				>
					<g
						class="country-markers__scale"
						:transform="`scale(${markerScale})`"
					>
						<g
							v-for="(product, index) in country.products"
							:key="product"
							:transform="getMarkerPosition(index, country.products.length)"
						>
							<circle
								r="4.5"
								:fill="productColors[product]"
								stroke="#ffffff"
								stroke-width="1"
							/>
						</g>
					</g>
				</g>
			</g>
		</svg>

		<MapControls
			class="world-map__controls"
			:can-zoom-in="canZoomIn"
			:can-zoom-out="canZoomOut"
			@zoom-in="zoomIn"
			@zoom-out="zoomOut"
			@reset="resetMap"
		/>

		<Transition name="popup">
			<div
				v-if="popupCountry"
				:key="popupCountry.code"
				ref="popupRef"
				class="country-popup"
				:class="{ 'country-popup--hover': hoveredCountry }"
				:style="popupStyle"
			>
				<!-- Крестик только для выбранной страны -->
				<button
					v-if="selectedCountry"
					type="button"
					class="country-popup__close"
					aria-label="Закрыть"
					@click="closeCountry"
				>
					×
				</button>

				<h3 class="country-popup__title">
					{{ countryNamesRu[popupCountry.code] ?? popupCountry.name }}
				</h3>

				<p class="country-popup__subtitle">Состав поставок</p>

				<ul class="country-popup__products">
					<li
						v-for="product in popupCountry.products"
						:key="product"
					>
						<span
							class="country-popup__dot"
							:style="{ backgroundColor: productColors[product] }"
						/>

						{{ productNames[product] }}
					</li>
				</ul>
			</div>
		</Transition>

		<MapLegend
			:product-names="productNames"
			:product-colors="productColors"
		></MapLegend>
	</div>
</template>

<style scoped>
.world-map {
	display: grid;
	grid-template-rows: 688px auto;
	width: 100%;
	margin-top: 25px;
	background: #fafcf9;
	border: 1px solid #e1e6df;
	border-radius: 8px;
	overflow: hidden;
}

.world-map svg {
	display: block;
	width: 100%;
	height: 100%;
	min-height: 0;
}

.country {
	fill: #e9ede9;
	stroke: #b8c3b7;
	stroke-width: 0.4;
	stroke-linejoin: round;
	cursor: pointer;
	transition: fill 0.2s;
}

.country--export {
	fill: #b7d6a5;
}

.country:hover {
	fill: #91bd79;
}

.country--export:hover {
	fill: #75a85b;
}
.map-message {
	padding: 60px;
	text-align: center;
}

.country-markers {
	cursor: pointer;
}

.map-content {
	transition: transform 650ms ease-in-out;
	transform-box: view-box;
	transform-origin: 0 0;
}

.country--selected {
	vector-effect: non-scaling-stroke;
}

.world-map {
	position: relative;
}

.country-popup {
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 10;

	width: 260px;
	max-width: 260px;
	box-sizing: border-box;
	padding: 16px;

	background: #fff;
	border: 1px solid #e1e6df;
	border-radius: 16px;
	box-shadow: 0 12px 40px rgba(20, 35, 20, 0.12);

	transform: translate(-50%, -50%);
}

.country-popup--hover {
	pointer-events: none;
}

.country-popup__close {
	position: absolute;
	top: 20px;
	right: 20px;

	display: flex;
	align-items: center;
	justify-content: center;

	width: 8px;
	height: 8px;
	padding: 0;

	border: none;
	background: transparent;
	color: #7d847d;
	font-size: 22px;
	font-weight: 300;
	line-height: 1;

	cursor: pointer;
	transition: color 0.2s ease;
}

.country-popup__close:hover {
	color: #1c1c1c;
}

.country-popup__title {
	margin: 0 40px 4px 0;

	color: #1c1c1c;
	font-size: 16px;
	font-weight: 700;
	line-height: 1.2;
}

.country-popup__subtitle {
	margin: 0 0 12px;

	color: #858b85;
	font-size: 12px;
	font-weight: 400;
	line-height: 1.4;
}

.country-popup__products {
	display: flex;
	flex-direction: column;
	gap: 8px;

	margin: 0;
	padding: 0;
	list-style: none;
}

.country-popup__products li {
	display: flex;
	align-items: center;
	gap: 16px;

	color: #1c1c1c;
	font-size: 12px;
	font-weight: 400;
	line-height: 1.4;
}

.country-popup__dot {
	display: block;
	width: 16px;
	height: 16px;
	flex-shrink: 0;

	border-radius: 50%;
}

@media (max-width: 768px) {
	.country-popup {
		width: min(220px, calc(100% - 16px));
		padding: 12px;
		border-radius: 10px;
	}

	.country-popup__close {
		top: 14px;
		right: 14px;
	}

	.country-popup__title {
		font-size: 14px;
		margin-bottom: 8px;
	}

	.country-popup__subtitle {
		font-size: 12px;
		margin-bottom: 8px;
	}

	.country-popup__products li {
		font-size: 12px;
		gap: 12px;
	}

	.country-popup__dot {
		width: 12px;
		height: 12px;
	}
}

.map-content {
	transition: transform 650ms ease-in-out;
}

.country-markers__scale {
	transition: var(--map-transition, none);
}

.country-outline {
	fill: none;
	stroke: #668f47;
	stroke-width: 1.5;
	stroke-linejoin: round;
	stroke-linecap: round;
	vector-effect: non-scaling-stroke;
	pointer-events: none;
}

.popup-enter-active,
.popup-leave-active {
	transition:
		opacity 250ms ease,
		transform 250ms ease;
}

.popup-enter-from,
.popup-leave-to {
	opacity: 0;
	transform: translate(-50%, -46%) scale(0.97);
}

.popup-enter-to,
.popup-leave-from {
	opacity: 1;
	transform: translate(-50%, -50%) scale(1);
}

.world-map {
	position: relative;
}

.world-map__controls {
	position: absolute;
	top: 24px;
	right: 24px;
	z-index: 15;
}

.map-content {
	transition: transform 650ms ease-in-out;
}

@media (max-width: 768px) {
	.world-map {
		grid-template-rows: 335px auto;
	}

	.world-map__controls {
		top: 12px;
		right: 12px;
	}
}

.map-svg {
	cursor: grab;
	touch-action: none;
	user-select: none;
}

.map-svg--dragging {
	cursor: grabbing;
}

.map-content--dragging {
	transition: none !important;
}
</style>
