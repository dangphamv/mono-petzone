import type { Locale } from './config'
import type { Dictionary } from './dictionaries/vi'

const dictionaries = {
  vi: () => import('./dictionaries/vi').then((m) => m.default),
  en: () => import('./dictionaries/en').then((m) => m.default),
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
