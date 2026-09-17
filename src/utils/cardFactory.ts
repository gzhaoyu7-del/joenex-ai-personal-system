import type { KnowledgeCard } from '../types'

export const makeCardId = () => `card-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`

export function createKnowledgeCard(input: Partial<KnowledgeCard> & Pick<KnowledgeCard, 'titleZh' | 'titleEn'>): KnowledgeCard {
  return {
    id: input.id ?? makeCardId(),
    titleZh: input.titleZh.trim(),
    titleEn: input.titleEn.trim(),
    shortEn: input.shortEn?.trim() || input.titleEn.trim(),
    descriptionZh: input.descriptionZh?.trim(),
    descriptionEn: input.descriptionEn?.trim(),
    category: input.category?.trim() || 'GENERAL',
    tags: input.tags ?? [],
    source: input.source,
    importance: input.importance,
    studyState: input.studyState ?? 'question',
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

export function parseBatchCards(text: string, category = 'GENERAL', source?: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [titleZh = '', titleEn = '', descriptionZh = ''] = line.split(/[|｜]/).map((part) => part.trim())
      if (!titleZh && !titleEn) return null
      return createKnowledgeCard({
        titleZh: titleZh || titleEn,
        titleEn: titleEn || titleZh,
        shortEn: titleEn || titleZh,
        descriptionZh,
        category,
        source,
      })
    })
    .filter((card): card is KnowledgeCard => Boolean(card))
}
