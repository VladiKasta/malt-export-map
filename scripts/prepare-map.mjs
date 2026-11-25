import { difference } from '@turf/difference'
import { featureCollection } from '@turf/helpers'
import fs from 'node:fs'

const countries = JSON.parse(fs.readFileSync('public/maps/countries.geojson', 'utf8'))

const abkhaziaData = JSON.parse(fs.readFileSync('public/maps/abkhazia.geojson', 'utf8'))

// Получаем полигон Абхазии
const abkhazia = abkhaziaData.type === 'FeatureCollection' ? abkhaziaData.features[0] : abkhaziaData

if (!abkhazia?.geometry || !['Polygon', 'MultiPolygon'].includes(abkhazia.geometry.type)) {
	throw new Error('Не найден полигон Абхазии')
}

// Ищем Грузию
const georgiaIndex = countries.features.findIndex(feature => {
	const p = feature.properties || {}

	return p.ISO3166_1_Alpha_3 === 'GEO' || p.ADMIN === 'Georgia' || p.name === 'Georgia'
})

if (georgiaIndex === -1) {
	throw new Error('Грузия не найдена в GeoJSON')
}

const georgia = countries.features[georgiaIndex]

// Вычитаем территорию Абхазии из Грузии
const result = difference(featureCollection([georgia, abkhazia]))

if (!result) {
	throw new Error('Вычитание вернуло пустую геометрию')
}

// Сохраняем свойства Грузии
result.properties = { ...georgia.properties }

// Заменяем старую геометрию
countries.features[georgiaIndex] = result

// Добавляем Абхазию как отдельную территорию
countries.features.push({
	...abkhazia,
	properties: {
		...abkhazia.properties,
		name: 'Абхазия',
		code: 'AB',
	},
})

// Сохраняем готовую карту
fs.writeFileSync('public/maps/countries-custom.geojson', JSON.stringify(countries))

console.log('Карта успешно подготовлена')
