import parseExportData from '../functions/parseExportData'
import { mockExportData } from '../mocks/exportData'
import type { Product } from '../types/types'

export type ExportData = Record<string, Product[]>

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export async function fetchExportData(
	allowedCountryCodes: ReadonlySet<string>
): Promise<ExportData> {
	let data: unknown

	if (USE_MOCKS) {
		data = structuredClone(mockExportData)
	} else {
		const response = await fetch(import.meta.env.VITE_EXPORT_API_URL)

		if (!response.ok) {
			throw new Error(`Ошибка API: ${response.status}`)
		}

		data = await response.json()
	}

	return parseExportData(data, allowedCountryCodes)
}
