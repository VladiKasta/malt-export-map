<script setup lang="ts">
const emit = defineEmits<{
	zoomIn: []
	zoomOut: []
	reset: []
}>()

defineProps<{
	canZoomIn?: boolean
	canZoomOut?: boolean
}>()
</script>

<template>
	<div
		class="map-controls"
		aria-label="Управление картой"
	>
		<button
			type="button"
			class="map-controls__button"
			aria-label="Приблизить карту"
			:disabled="canZoomIn === false"
			@click="emit('zoomIn')"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
		</button>

		<button
			type="button"
			class="map-controls__button"
			aria-label="Отдалить карту"
			:disabled="canZoomOut === false"
			@click="emit('zoomOut')"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d="M5 12h14" />
			</svg>
		</button>

		<button
			type="button"
			class="map-controls__button"
			aria-label="Сбросить карту"
			@click="emit('reset')"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
				<path d="M3 3v5h5" />
			</svg>
		</button>
	</div>
</template>

<style scoped>
.map-controls {
	display: flex;
	flex-direction: column;
	width: 56px;
	overflow: hidden;

	background: #fff;
	border: 1px solid #d5ddd2;
	border-radius: 10px;
	box-shadow: 0 8px 24px rgba(20, 35, 20, 0.12);
}

.map-controls__button {
	touch-action: manipulation;
	display: flex;
	align-items: center;
	justify-content: center;

	width: 56px;
	height: 56px;
	padding: 0;

	border: 0;
	border-bottom: 1px solid #d5ddd2;
	background: #fff;
	color: #1c1c1c;

	cursor: pointer;
	transition: background-color 0.2s ease;
}

.map-controls__button:last-child {
	border-bottom: 0;
}

.map-controls__button:hover:not(:disabled) {
	background: #f0f5ec;
}

.map-controls__button:disabled {
	opacity: 0.35;
	cursor: not-allowed;
}

.map-controls__button svg {
	width: 24px;
	height: 24px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.8;
	stroke-linecap: round;
	stroke-linejoin: round;
}

@media (max-width: 768px) {
	.map-controls {
		width: 36px;
		border-radius: 8px;
	}

	.map-controls__button {
		width: 100%;
		height: 36px;
	}

	.map-controls__button svg {
		width: 20px;
		height: 20px;
	}
}
</style>
