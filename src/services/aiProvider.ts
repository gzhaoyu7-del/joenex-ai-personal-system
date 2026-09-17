import type { AIExtractionResult, KnowledgeCard } from '../types'
import { createKnowledgeCard } from '../utils/cardFactory'

export interface GenerateDeckInput {
  text: string
  count: number
  sourceName: string
}

export interface AIProvider {
  readonly id: string
  generateDeck(input: GenerateDeckInput): Promise<AIExtractionResult>
  extractConcepts(input: GenerateDeckInput): Promise<AIExtractionResult>
  explainConcept(card: KnowledgeCard): Promise<string>
}

interface OpenRouterConfig {
  apiKey: string
  model: string
}

interface RawCard {
  titleZh?: string
  titleEn?: string
  shortEn?: string
  descriptionZh?: string
  descriptionEn?: string
  category?: string
  importance?: number
  tags?: string[]
}

function normalizeResult(raw: { deckTitle?: string; cards?: RawCard[] }, sourceName: string): AIExtractionResult {
  const cards = (raw.cards ?? [])
    .filter((card) => card.titleZh || card.titleEn)
    .map((card) => createKnowledgeCard({
      titleZh: card.titleZh || card.titleEn || '',
      titleEn: card.titleEn || card.titleZh || '',
      shortEn: card.shortEn || card.titleEn,
      descriptionZh: card.descriptionZh,
      descriptionEn: card.descriptionEn,
      category: card.category || 'GENERAL',
      importance: Math.max(0, Math.min(1, Number(card.importance ?? 0.5))),
      tags: card.tags ?? [],
      source: sourceName,
    }))
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
  return { deckTitle: raw.deckTitle?.trim() || `${sourceName} 核心知识`, cards }
}

export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter'
  constructor(private config: OpenRouterConfig) {}

  async generateDeck(input: GenerateDeckInput) {
    return this.extractConcepts(input)
  }

  async extractConcepts({ text, count, sourceName }: GenerateDeckInput): Promise<AIExtractionResult> {
    const prompt = `You are a bilingual knowledge editor. Extract ${count} concepts genuinely worth researching or reviewing from the source. This is semantic knowledge extraction, NOT keyword frequency. Prefer named theories, mechanisms, principles, models, methods, and causal relationships. Reject generic frequent words. Return only valid JSON with this exact structure: {"deckTitle":"...","cards":[{"titleZh":"...","titleEn":"...","shortEn":"...","descriptionZh":"...","descriptionEn":"...","category":"...","importance":0.95,"tags":["..."]}]}. Sort cards by importance descending. Write concise, accurate explanations. Source name: ${sourceName}\n\nSOURCE:\n${text.slice(0, 90000)}`
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Knowledge Orbit',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'Return structured bilingual knowledge concepts as strict JSON. Never return markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.25,
      }),
    })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`AI 请求失败 (${response.status})：${detail.slice(0, 180)}`)
    }
    const payload = await response.json() as { choices?: { message?: { content?: string } }[] }
    const content = payload.choices?.[0]?.message?.content
    if (!content) throw new Error('AI 没有返回可解析的知识点。')
    const parsed = JSON.parse(content.replace(/^```json\s*|```$/g, '').trim()) as { deckTitle?: string; cards?: RawCard[] }
    return normalizeResult(parsed, sourceName)
  }

  async explainConcept(card: KnowledgeCard) {
    return card.descriptionZh || card.descriptionEn || ''
  }
}

export class LocalSemanticPreviewProvider implements AIProvider {
  readonly id = 'local-semantic-preview'

  async generateDeck(input: GenerateDeckInput) {
    return this.extractConcepts(input)
  }

  async extractConcepts({ text, count, sourceName }: GenerateDeckInput): Promise<AIExtractionResult> {
    const lines = text.split(/\r?\n|(?<=[。.!?])\s+/).map((line) => line.trim()).filter((line) => line.length > 3)
    const documentHeading = lines.find((line) => /^[\u3400-\u9fffA-Za-z0-9 ·-]{4,32}$/.test(line) && !/^\d/.test(line))
    const candidates: RawCard[] = []
    for (const line of lines) {
      const bilingual = line.match(/^([^|｜:：()（）]{2,24})\s*(?:[|｜]|[（(])\s*([A-Z][A-Za-z0-9 /-]{2,70})[)）]?\s*(?:[:：-]\s*)?(.*)$/)
      const definitionZh = line.match(/^([^，。；:：]{2,18})(?:是指|指的是|是|意味着)\s*(.{8,160})/)
      const definitionEn = line.match(/^([A-Z][A-Za-z0-9 -]{2,55})\s+(?:is|means|refers to)\s+(.{12,180})/i)
      if (bilingual) {
        candidates.push({ titleZh: bilingual[1].trim(), titleEn: bilingual[2].trim(), shortEn: bilingual[2].trim(), descriptionZh: bilingual[3]?.trim(), category: 'SOURCE CONCEPT', importance: 0.84 })
      } else if (definitionZh) {
        candidates.push({ titleZh: definitionZh[1].trim(), titleEn: definitionZh[1].trim(), descriptionZh: definitionZh[2].trim(), category: 'SOURCE CONCEPT', importance: 0.72 })
      } else if (definitionEn) {
        candidates.push({ titleZh: definitionEn[1].trim(), titleEn: definitionEn[1].trim(), descriptionEn: definitionEn[2].trim(), category: 'SOURCE CONCEPT', importance: 0.68 })
      }
    }
    const seen = new Set<string>()
    const unique = candidates.filter((item) => {
      const key = `${item.titleZh}|${item.titleEn}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, count)
    if (unique.length === 0) throw new Error('本地预览没有识别到明确概念。添加 OpenRouter Key 可进行真正的语义提取。')
    return normalizeResult({ deckTitle: documentHeading || `${sourceName.replace(/\.pdf$/i, '')} 核心概念`, cards: unique }, sourceName)
  }

  async explainConcept(card: KnowledgeCard) {
    return card.descriptionZh || card.descriptionEn || ''
  }
}
