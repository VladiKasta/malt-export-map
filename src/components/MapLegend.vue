<script setup lang="ts">
import { defineProps } from 'vue'
import type { Product } from '../types/types'

const props = defineProps<{
	productNames: Record<Product, string>
	productColors: Record<Product, string>
}>()
</script>

<template>
	<div class="map-legend">
		<div
			v-for="(color, product) in productColors"
			:key="product"
			class="map-legend__item"
		>
			<span
				class="map-legend__marker"
				:style="{ backgroundColor: color }"
			/>

			<span class="map-legend__label">
				{{ productNames[product] }}
			</span>
		</div>
	</div>
</template>

<style>
.map-legend {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;

	padding: 20px 24px;

	border-top: 1px solid #e1e6df;
	background: #fff;
}

.map-legend__item {
	display: flex;
	align-items: center;
	gap: 12px;
	white-space: nowrap;
}

.map-legend__marker {
	display: block;
	width: 28px;
	height: 28px;
	flex-shrink: 0;

	border: 1px solid #b8c3b7;
	border-radius: 50%;
}

.map-legend__label {
	font-size: 12px;
	font-weight: 400;
	color: #303030;
}

@media (max-width: 768px) {
	.map-legend {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: repeat(2, auto);
		grid-auto-flow: column;
		gap: 16px 8px;
	}

	.map-legend__item {
		gap: 8px;
	}

	.map-legend__marker {
		width: 20px;
		height: 20px;
	}
}
</style>
