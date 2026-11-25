<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

export interface CountryOption {
	code: string
	name: string
}

const props = defineProps<{
	countries: CountryOption[]
}>()

const model = defineModel<string | null>({ default: null })

const search = ref('')
const isOpen = ref(false)
const dropdownRef = useTemplateRef<HTMLElement>('dropdown')

const filteredCountries = computed(() => {
	const query = search.value.trim().toLocaleLowerCase('ru')

	return [...props.countries]
		.filter(country => country.name.toLocaleLowerCase('ru').includes(query))
		.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

const selectedCountry = computed(() =>
	props.countries.find(country => country.code === model.value)
)

watch(selectedCountry, country => {
	search.value = country?.name ?? ''
})

function clearCountry() {
	search.value = ''
	model.value = null
	isOpen.value = false
}

function selectCountry(country: CountryOption) {
	model.value = country.code
	search.value = country.name
	isOpen.value = false
}

function openDropdown() {
	isOpen.value = true
}

function handleOutsideClick(event: MouseEvent) {
	if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
		isOpen.value = false
	}
}

function handleEscape(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		isOpen.value = false
	}
}

function handleBlur() {
	if (!isOpen.value && selectedCountry.value) {
		search.value = selectedCountry.value.name
	}
}

onMounted(() => {
	document.addEventListener('pointerdown', handleOutsideClick)
})

onUnmounted(() => {
	document.removeEventListener('pointerdown', handleOutsideClick)
})
</script>

<template>
	<div
		ref="dropdown"
		class="country-dropdown"
		@keydown="handleEscape"
	>
		<label
			class="country-dropdown__label"
			for="country-search"
		>
			Выбрать страну
		</label>

		<div class="country-dropdown__field">
			<svg
				class="country-dropdown__icon"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<circle
					cx="10.8"
					cy="10.8"
					r="7.3"
					stroke="currentColor"
					stroke-width="1.8"
				/>
				<path
					d="M16.3 16.3L21 21"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>

			<input
				id="country-search"
				v-model="search"
				type="text"
				autocomplete="off"
				placeholder="Введите название"
				aria-label="Поиск страны"
				:aria-expanded="isOpen"
				aria-controls="country-options"
				@focus="openDropdown"
				@input="openDropdown"
				@blur="handleBlur"
			/>

			<button
				v-if="search || model"
				type="button"
				class="country-dropdown__clear"
				aria-label="Очистить поле и выбранную страну"
				@click="clearCountry"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<div
			v-if="isOpen"
			id="country-options"
			class="country-dropdown__menu"
		>
			<div class="country-dropdown__list">
				<button
					v-for="country in filteredCountries"
					:key="country.code"
					type="button"
					class="country-dropdown__option"
					:class="{
						'country-dropdown__option--selected': model === country.code,
					}"
					@click="selectCountry(country)"
				>
					{{ country.name }}
				</button>

				<div
					v-if="filteredCountries.length === 0"
					class="country-dropdown__empty"
				>
					Страны не найдены
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.country-dropdown {
	position: relative;
	width: 100%;
	max-width: 600px;
	font-family: inherit;
	z-index: 10;
}

.country-dropdown__label {
	display: block;
	margin-bottom: 16px;
	color: #1c1c1c;
	font-size: 24px;
	font-weight: 700;
}

.country-dropdown__field {
	display: flex;
	align-items: center;
	gap: 16px;
	height: 64px;
	padding: 0 20px;
	border: 1px solid #cdd5c9;
	border-radius: 10px;
	background: #fff;
}

.country-dropdown__field:focus-within {
	border-color: #609d38;
}

.country-dropdown__icon {
	flex-shrink: 0;
	color: #7a817a;
}

.country-dropdown__clear {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 28px;
	height: 28px;
	padding: 0;
	border: none;
	background: transparent;
	color: #7a817a;
	cursor: pointer;
}

.country-dropdown__clear:hover {
	color: #1c1c1c;
}

.country-dropdown__field input {
	width: 100%;
	min-width: 0;
	border: none;
	outline: none;
	background: transparent;
	color: #1c1c1c;
	font: inherit;
	font-size: 20px;
}

.country-dropdown__field input::placeholder {
	color: #989898;
}

.country-dropdown__menu {
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	width: 100%;
	padding: 12px 0;
	border: 1px solid #e0e5dc;
	border-radius: 12px;
	background: #fff;
	box-shadow: 0 18px 36px rgba(20, 35, 20, 0.14);
	z-index: 20;
}

.country-dropdown__list {
	max-height: 280px;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: #c8c8c8 transparent;
}

.country-dropdown__option {
	display: block;
	width: 100%;
	padding: 12px 20px;
	border: none;
	background: transparent;
	color: #1c1c1c;
	font: inherit;
	font-size: 20px;
	text-align: left;
	cursor: pointer;
}

.country-dropdown__option:hover,
.country-dropdown__option--selected {
	background: #edf5e8;
}

.country-dropdown__empty {
	padding: 16px 20px;
	color: #888;
	font-size: 16px;
}

@media (max-width: 768px) {
	.country-dropdown__label {
		font-size: 20px;
	}

	.country-dropdown__field {
		height: 56px;
		padding: 0 14px;
		gap: 12px;
	}

	.country-dropdown__icon {
		width: 18px;
		height: 18px;
	}

	.country-dropdown__field input,
	.country-dropdown__option {
		font-size: 13px;
	}
}
</style>
