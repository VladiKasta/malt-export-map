export default function getMarkerPosition(index: number, total: number) {
	// Диаметр точки с обводкой — 10, зазор между соседними точками — 2.
	const spacing = 12
	const x = (index - (total - 1) / 2) * spacing

	return `translate(${x}, 0)`
}
