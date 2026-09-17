import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import type { ExtractedDocument } from '../types'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

function countWords(text: string) {
  const latinWords = text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g)?.length ?? 0
  const chineseUnits = text.match(/[\u3400-\u9fff]+/g)?.reduce((sum, unit) => sum + Math.max(1, Math.ceil(unit.length / 2)), 0) ?? 0
  return latinWords + chineseUnits
}

export async function extractTextFromPDF(file: File, onProgress?: (page: number, total: number) => void): Promise<ExtractedDocument> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('请选择 PDF 文件。')
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data, useSystemFonts: true })
  const pdf = await loadingTask.promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const rawText = content.items
      .map((item) => ('str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : ''))
      .join('')
    const text = rawText
      .split(/\r?\n/)
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
    pages.push(text)
    onProgress?.(pageNumber, pdf.numPages)
  }

  const text = pages.join('\n\n')
  if (text.replace(/\s/g, '').length < 20) {
    throw new Error('没有提取到可用文字。当前版本不支持扫描版 PDF 或 OCR。')
  }

  return {
    name: file.name,
    text,
    pageCount: pdf.numPages,
    wordCount: countWords(text),
    sourceType: 'pdf',
  }
}

export function extractPastedText(name: string, text: string): ExtractedDocument {
  return { name, text: text.trim(), pageCount: 1, wordCount: countWords(text), sourceType: 'text' }
}
