import { create } from 'zustand'
import type { AIExtractionResult, ExtractedDocument, ImportMethod, WorkbenchView } from '../types'

interface UIState {
  workbenchView: WorkbenchView
  importMethod: ImportMethod
  extractedDocument: ExtractedDocument | null
  extractionPreview: AIExtractionResult | null
  openWorkbench: (view: Exclude<WorkbenchView, null>) => void
  closeWorkbench: () => void
  setImportMethod: (method: ImportMethod) => void
  setExtractedDocument: (document: ExtractedDocument | null) => void
  setExtractionPreview: (result: AIExtractionResult | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  workbenchView: null,
  importMethod: 'text',
  extractedDocument: null,
  extractionPreview: null,
  openWorkbench: (workbenchView) => set({ workbenchView }),
  closeWorkbench: () => set({ workbenchView: null }),
  setImportMethod: (importMethod) => set({ importMethod }),
  setExtractedDocument: (extractedDocument) => set({ extractedDocument }),
  setExtractionPreview: (extractionPreview) => set({ extractionPreview, workbenchView: extractionPreview ? 'preview' : 'import' }),
}))
