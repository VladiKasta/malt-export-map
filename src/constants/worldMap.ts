import type { Product } from '../types/types'

export const productColors: Record<Product, string> = {
	malt: '#E9AE16',
	hops: '#609D38',
	barley: '#EE7C24',
	wheat: '#926039',
	chickpeas: '#B79B77',
}
export const productNames: Record<Product, string> = {
	malt: 'Солод',
	hops: 'Хмель',
	barley: 'Ячмень',
	wheat: 'Пшеница',
	chickpeas: 'Нут',
}

export const countryNamesRu: Record<string, string> = {
	RU: 'Россия',
	KZ: 'Казахстан',
	BY: 'Беларусь',
	UZ: 'Узбекистан',
	CN: 'Китай',
	TR: 'Турция',
	AB: 'Абхазия',
	TT: 'Тринидад и Тобаго',
}

export const width = 1000
export const height = 550
