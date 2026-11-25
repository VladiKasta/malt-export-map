<script setup lang="ts">
import WorldMap from './components/WorldMap.vue'
</script>

<template>
	<main class="page">
		<h1>Страны экспорта</h1>

		<h2>География поставок</h2>

		<p>Наведите на страну, чтобы увидеть её границы.</p>

		<WorldMap />
	</main>
</template>

<style scoped>
.page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 40px 20px;
}

h1 {
	font-size: 32px;
	margin-bottom: 30px;
}

h2 {
	font-size: 22px;
	margin-bottom: 12px;
}

p {
	color: #888;
	margin-bottom: 24px;
}
</style>
