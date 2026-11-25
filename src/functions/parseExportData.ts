import type { Product } from '../types/types'

const products: readonly Product[] = ['malt', 'hops', 'barley', 'wheat', 'chickpeas']

function isProduct(value: unknown): value is Product {
	return typeof value === 'string' && products.some(product => product === value)
}

export default function parseExportData(
	data: unknown,
	allowedCountryCodes: ReadonlySet<string>
): Record<string, Product[]> {
	if (typeof data !== 'object' || data === null || Array.isArray(data)) {
		throw new Error('Некорректные данные экспорта')
	}

	const result: Record<string, Product[]> = {}

	for (const [countryCode, value] of Object.entries(data)) {
		// Проверка кода страны
		if (!allowedCountryCodes.has(countryCode)) {
			throw new Error(`Неизвестный код страны: ${countryCode}`)
		}

		// Проверка продукции
		if (!Array.isArray(value) || !value.every(isProduct)) {
			throw new Error(`Некорректная продукция для страны ${countryCode}`)
		}

		result[countryCode] = value
	}

	return result
}
