import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, FileText, Keyboard, Pencil, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { LocalSemanticPreviewProvider, OpenRouterProvider } from '../../services/aiProvider'
import { extractPastedText, extractTextFromPDF } from '../../services/pdfExtractor'
import { soundManager } from '../../services/SoundManager'
import { selectActiveDeck, useDeckStore } from '../../stores/deckStore'
import { useExperienceStore } from '../../stores/experienceStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUIStore } from '../../stores/uiStore'
import type { DeckLanguage, KnowledgeCard, WorkbenchView } from '../../types'
import { createKnowledgeCard, parseBatchCards } from '../../utils/cardFactory'

const views: { id: Exclude<WorkbenchView, null>; label: string }[] = [
  { id: 'create', label: 'NEW DECK' },
  { id: 'add', label: 'ADD' },
  { id: 'batch', label: 'BATCH' },
  { id: 'import', label: 'IMPORT' },
  { id: 'library', label: 'MY DECKS' },
]

export function WorkbenchOverlay() {
  const view = useUIStore((state) => state.workbenchView)
  const closeWorkbench = useUIStore((state) => state.closeWorkbench)
  const openWorkbench = useUIStore((state) => state.openWorkbench)
  const activeDeck = useDeckStore(selectActiveDeck)
  const clearSelection = useExperienceStore((state) => state.clearSelection)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWorkbench()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeWorkbench])

  return (
    <AnimatePresence>
      {view && (
        <motion.div
          className="workbench-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && closeWorkbench()}
        >
          <motion.section
            className={`workbench workbench--${view}`}
            initial={{ opacity: 0, y: 30, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Knowledge deck workbench"
          >
            <header className="workbench__header">
              <div>
                <span>KNOWLEDGE WORKBENCH</span>
                <strong>{activeDeck?.name ?? 'NO ACTIVE DECK'}</strong>
              </div>
              <button type="button" onClick={closeWorkbench} aria-label="Close workbench"><X size={17} /></button>
            </header>
            {!['preview', 'gesture', 'settings'].includes(view) && (
              <nav className="workbench__nav" aria-label="Workbench sections">
                {views.map((item) => (
                  <button type="button" key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => openWorkbench(item.id)}>{item.label}</button>
                ))}
              </nav>
            )}
            <div className="workbench__body">
              {view === 'create' && <CreateDeckPanel />}
              {view === 'add' && <AddCardPanel />}
              {view === 'batch' && <BatchAddPanel />}
              {view === 'import' && <ImportPanel />}
              {view === 'preview' && <PreviewPanel />}
              {view === 'library' && <LibraryPanel />}
              {view === 'gesture' && <GesturePanel />}
              {view === 'settings' && <SettingsPanel />}
            </div>
            <footer className="workbench__footer">
              <span>ANY KNOWLEDGE → DECK → DRAW</span>
              <span>{activeDeck?.cards.length ?? 0} OBJECTS IN FIELD</span>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )

  function AddCardPanel() {
    const addCards = useDeckStore((state) => state.addCards)
    const [form, setForm] = useState({ titleZh: '', titleEn: '', shortEn: '', descriptionZh: '', descriptionEn: '', category: activeDeck?.category ?? '' })
    const [added, setAdded] = useState(false)
    const submit = (event: FormEvent) => {
      event.preventDefault()
      if (!activeDeck || (!form.titleZh.trim() && !form.titleEn.trim())) return
      addCards(activeDeck.id, [createKnowledgeCard({
        ...form,
        titleZh: form.titleZh || form.titleEn,
        titleEn: form.titleEn || form.titleZh,
        source: 'Manual',
      })])
      clearSelection()
      setAdded(true)
      window.setTimeout(closeWorkbench, 460)
    }
    return (
      <form className="workbench-form" onSubmit={submit}>
        <PanelTitle eyebrow="MANUAL KNOWLEDGE" title="添加一条真正想研究的知识" description="中文是卡牌主标题，英文作为第二层信息。" />
        <div className="form-grid form-grid--two">
          <Field label="中文 / PRIMARY" value={form.titleZh} onChange={(titleZh) => setForm({ ...form, titleZh })} placeholder="人工智能智能体" required />
          <Field label="ENGLISH / SECONDARY" value={form.titleEn} onChange={(titleEn) => setForm({ ...form, titleEn })} placeholder="AI Agent" />
          <Field label="SHORT EN / ACRONYM" value={form.shortEn} onChange={(shortEn) => setForm({ ...form, shortEn })} placeholder="AGENT" />
          <Field label="CATEGORY" value={form.category} onChange={(category) => setForm({ ...form, category })} placeholder="AI · KNOWLEDGE" />
        </div>
        <Field label="中文解释" value={form.descriptionZh} onChange={(descriptionZh) => setForm({ ...form, descriptionZh })} placeholder="能够自主理解目标、规划并执行任务的 AI 系统。" multiline />
        <Field label="ENGLISH DESCRIPTION" value={form.descriptionEn} onChange={(descriptionEn) => setForm({ ...form, descriptionEn })} placeholder="An AI system that can plan and act toward a goal." multiline />
        <PrimaryAction label={added ? 'ADDED TO ORBIT' : 'ADD TO KNOWLEDGE ORBIT'} icon={added ? <Check size={14} /> : <Plus size={14} />} />
      </form>
    )
  }
}

function PanelTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="panel-title"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
}

function Field({ label, value, onChange, placeholder, required, multiline, type = 'text' }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; multiline?: boolean; type?: string
}) {
  return (
    <label className="workbench-field">
      <span>{label}</span>
      {multiline
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
        : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />}
    </label>
  )
}

function PrimaryAction({ label, icon, disabled }: { label: string; icon?: React.ReactNode; disabled?: boolean }) {
  return <button className="primary-action" type="submit" disabled={disabled}><span>{label}</span>{icon}</button>
}

function CreateDeckPanel() {
  const createDeck = useDeckStore((state) => state.createDeck)
  const openWorkbench = useUIStore((state) => state.openWorkbench)
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<DeckLanguage>('bilingual')
  const [category, setCategory] = useState('GENERAL KNOWLEDGE')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    createDeck({ name, language, category })
    openWorkbench('add')
  }
  return (
    <form className="workbench-form" onSubmit={submit}>
      <PanelTitle eyebrow="CREATE KNOWLEDGE DECK" title="把任何领域变成一条知识轨道" description="Deck 是抽取、研究、讲解和未来复习模式共享的核心。" />
      <Field label="DECK NAME" value={name} onChange={setName} placeholder="我的 AI 术语" required />
      <div className="form-grid form-grid--two">
        <label className="workbench-field"><span>LANGUAGE</span><select value={language} onChange={(event) => setLanguage(event.target.value as DeckLanguage)}><option value="bilingual">中文 + English</option><option value="zh">中文</option><option value="en">English</option></select></label>
        <Field label="CATEGORY" value={category} onChange={setCategory} placeholder="AI / ECONOMICS / EXAM" />
      </div>
      <PrimaryAction label="CREATE DECK" icon={<Plus size={14} />} />
    </form>
  )
}

function BatchAddPanel() {
  const activeDeck = useDeckStore(selectActiveDeck)
  const addCards = useDeckStore((state) => state.addCards)
  const closeWorkbench = useUIStore((state) => state.closeWorkbench)
  const clearSelection = useExperienceStore((state) => state.clearSelection)
  const [text, setText] = useState('')
  const cards = useMemo(() => parseBatchCards(text, activeDeck?.category, 'Batch list'), [activeDeck?.category, text])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!activeDeck || cards.length === 0) return
    addCards(activeDeck.id, cards)
    clearSelection()
    closeWorkbench()
  }
  return (
    <form className="workbench-form" onSubmit={submit}>
      <PanelTitle eyebrow="BATCH ADD" title="一行就是一个知识对象" description="使用“中文 | English | 可选解释”，立即进入当前 Orbit。" />
      <Field label="KNOWLEDGE LIST" value={text} onChange={setText} multiline placeholder={'人工智能智能体 | AI Agent\n检索增强生成 | RAG\n上下文窗口 | Context Window'} />
      <div className="batch-count"><strong>{String(cards.length).padStart(2, '0')}</strong><span>CARDS READY</span></div>
      <PrimaryAction label={`ADD ${cards.length || ''} TO CURRENT DECK`} icon={<Plus size={14} />} disabled={cards.length === 0} />
    </form>
  )
}

function ImportPanel() {
  const importMethod = useUIStore((state) => state.importMethod)
  const setImportMethod = useUIStore((state) => state.setImportMethod)
  const extractedDocument = useUIStore((state) => state.extractedDocument)
  const setExtractedDocument = useUIStore((state) => state.setExtractedDocument)
  const setExtractionPreview = useUIStore((state) => state.setExtractionPreview)
  const openRouterKey = useSettingsStore((state) => state.openRouterKey)
  const openRouterModel = useSettingsStore((state) => state.openRouterModel)
  const setOpenRouterKey = useSettingsStore((state) => state.setOpenRouterKey)
  const setOpenRouterModel = useSettingsStore((state) => state.setOpenRouterModel)
  const [text, setText] = useState('')
  const [count, setCount] = useState(20)
  const [reading, setReading] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const readPDF = async (file?: File) => {
    if (!file) return
    setError('')
    setReading('READING DOCUMENT…')
    try {
      const document = await extractTextFromPDF(file, (page, total) => setReading(`READING PAGE ${page} / ${total}`))
      setExtractedDocument(document)
      setReading('')
    } catch (cause) {
      setReading('')
      setError(cause instanceof Error ? cause.message : 'PDF 读取失败。')
    }
  }

  const generate = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    let document = extractedDocument
    if (importMethod !== 'pdf') {
      if (text.trim().length < 12) return setError('请先粘贴足够的知识内容。')
      document = extractPastedText(importMethod === 'list' ? 'Manual Knowledge List' : 'Pasted Knowledge', text)
      setExtractedDocument(document)
    }
    if (!document) return setError('请先选择并读取一个文本型 PDF。')
    setGenerating(true)
    try {
      const provider = openRouterKey.trim()
        ? new OpenRouterProvider({ apiKey: openRouterKey.trim(), model: openRouterModel.trim() })
        : new LocalSemanticPreviewProvider()
      const result = await provider.generateDeck({ text: document.text, count, sourceName: document.name })
      setExtractionPreview(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '知识提取失败。')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <form className="workbench-form import-panel" onSubmit={generate}>
      <PanelTitle eyebrow="IMPORT KNOWLEDGE" title="从内容中识别值得理解的概念" description="不是高频词统计。AI 会寻找理论、机制、方法与关键关系。" />
      <div className="import-methods">
        <button type="button" className={importMethod === 'text' ? 'is-active' : ''} onClick={() => setImportMethod('text')}><FileText size={16} /><strong>PASTE TEXT</strong><span>文章 / 笔记 / 讲义</span></button>
        <button type="button" className={importMethod === 'pdf' ? 'is-active' : ''} onClick={() => setImportMethod('pdf')}><Upload size={16} /><strong>UPLOAD PDF</strong><span>浏览器本地解析</span></button>
        <button type="button" className={importMethod === 'list' ? 'is-active' : ''} onClick={() => setImportMethod('list')}><Keyboard size={16} /><strong>MANUAL LIST</strong><span>双语知识清单</span></button>
      </div>
      {importMethod === 'pdf' ? (
        <div className="pdf-drop">
          <input id="pdf-file" type="file" accept="application/pdf,.pdf" onChange={(event) => void readPDF(event.target.files?.[0])} />
          <label htmlFor="pdf-file"><Upload size={20} /><strong>{reading || extractedDocument?.name || 'SELECT A TEXT PDF'}</strong><span>扫描版 PDF 暂不支持 OCR</span></label>
          {extractedDocument && <div className="document-stats"><span><strong>{extractedDocument.pageCount}</strong> PAGES DETECTED</span><span><strong>{extractedDocument.wordCount.toLocaleString()}</strong> WORDS EXTRACTED</span></div>}
        </div>
      ) : (
        <Field label={importMethod === 'list' ? '中文 | ENGLISH | 可选解释' : 'SOURCE TEXT'} value={text} onChange={setText} multiline placeholder={importMethod === 'list' ? '机会成本 | Opportunity Cost | 选择某一方案时所放弃的最佳替代方案。' : '粘贴文章、课堂笔记或学习资料…'} />
      )}
      <div className="generate-count"><span>GENERATE</span>{[10, 20, 30, 50].map((value) => <button type="button" key={value} className={count === value ? 'is-active' : ''} onClick={() => setCount(value)}>{value}</button>)}<em>KEY CONCEPTS</em></div>
      <details className="ai-route"><summary>AI ROUTE · {openRouterKey ? 'OPENROUTER' : 'LOCAL PREVIEW'}</summary><Field label="OPENROUTER API KEY / BYOK" value={openRouterKey} onChange={setOpenRouterKey} type="password" placeholder="sk-or-v1-…" /><Field label="MODEL" value={openRouterModel} onChange={setOpenRouterModel} /></details>
      {error && <div className="workbench-error" role="alert">{error}</div>}
      <PrimaryAction label={generating ? 'EXTRACTING KNOWLEDGE…' : openRouterKey ? 'GENERATE WITH AI' : 'GENERATE LOCAL PREVIEW'} icon={<Sparkles size={14} />} disabled={generating} />
    </form>
  )
}

function PreviewPanel() {
  const preview = useUIStore((state) => state.extractionPreview)
  const setExtractionPreview = useUIStore((state) => state.setExtractionPreview)
  const closeWorkbench = useUIStore((state) => state.closeWorkbench)
  const createDeck = useDeckStore((state) => state.createDeck)
  const addCards = useDeckStore((state) => state.addCards)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(preview?.cards.map((card) => card.id)))
  const [editing, setEditing] = useState<string | null>(null)
  if (!preview) return null

  const updateCard = (id: string, patch: Partial<KnowledgeCard>) => setExtractionPreview({ ...preview, cards: preview.cards.map((card) => card.id === id ? { ...card, ...patch } : card) })
  const deleteCard = (id: string) => {
    selected.delete(id)
    setSelected(new Set(selected))
    setExtractionPreview({ ...preview, cards: preview.cards.filter((card) => card.id !== id) })
  }
  const create = () => {
    const cards = preview.cards.filter((card) => selected.has(card.id))
    if (cards.length === 0) return
    const id = createDeck({ name: preview.deckTitle, language: 'bilingual', category: cards[0]?.category ?? 'IMPORTED KNOWLEDGE', mode: 'creator' })
    addCards(id, cards)
    useExperienceStore.getState().clearSelection()
    setExtractionPreview(null)
    closeWorkbench()
  }
  return (
    <div className="preview-panel">
      <PanelTitle eyebrow={`AI FOUND ${preview.cards.length} CONCEPTS`} title="确认哪些知识值得进入轨道" description="取消、编辑或删除质量不够的概念，再创建 Deck。" />
      <Field label="DECK TITLE" value={preview.deckTitle} onChange={(deckTitle) => setExtractionPreview({ ...preview, deckTitle })} />
      <div className="concept-list">
        {preview.cards.map((card) => (
          <div className={`concept-row ${selected.has(card.id) ? 'is-selected' : ''}`} key={card.id}>
            <button type="button" className="concept-check" onClick={() => {
              const next = new Set(selected)
              if (next.has(card.id)) next.delete(card.id)
              else next.add(card.id)
              setSelected(next)
            }}>{selected.has(card.id) && <Check size={12} />}</button>
            {editing === card.id ? (
              <div className="concept-edit"><input value={card.titleZh} onChange={(event) => updateCard(card.id, { titleZh: event.target.value })} /><input value={card.titleEn} onChange={(event) => updateCard(card.id, { titleEn: event.target.value })} /><textarea value={card.descriptionZh ?? ''} onChange={(event) => updateCard(card.id, { descriptionZh: event.target.value })} /></div>
            ) : (
              <div className="concept-copy"><strong>{card.titleZh}</strong><span>{card.titleEn}</span><p>{card.descriptionZh}</p></div>
            )}
            <div className="concept-actions"><button type="button" onClick={() => setEditing(editing === card.id ? null : card.id)}>{editing === card.id ? <Check size={13} /> : <Pencil size={13} />}</button><button type="button" onClick={() => deleteCard(card.id)}><Trash2 size={13} /></button></div>
          </div>
        ))}
      </div>
      <button className="primary-action" type="button" onClick={create}><span>CREATE DECK · {selected.size} CONCEPTS</span><Plus size={14} /></button>
    </div>
  )
}

function LibraryPanel() {
  const decks = useDeckStore((state) => state.decks)
  const activeDeckId = useDeckStore((state) => state.activeDeckId)
  const setActiveDeck = useDeckStore((state) => state.setActiveDeck)
  const duplicateDeck = useDeckStore((state) => state.duplicateDeck)
  const deleteDeck = useDeckStore((state) => state.deleteDeck)
  const openWorkbench = useUIStore((state) => state.openWorkbench)
  return (
    <div className="library-panel">
      <PanelTitle eyebrow="MY DECKS" title="你的知识，不是一份静态清单" description="选择一个 Deck 回到 Orbit，或继续添加内容。" />
      <div className="deck-list">
        {decks.map((deck) => (
          <div className={`deck-row ${deck.id === activeDeckId ? 'is-active' : ''}`} key={deck.id}>
            <button type="button" className="deck-row__main" onClick={() => { setActiveDeck(deck.id); useExperienceStore.getState().clearSelection() }}><span>{deck.isBuiltIn ? 'BUILT-IN' : deck.mode.toUpperCase()}</span><strong>{deck.name}</strong><em>{deck.cards.length} CARDS · {deck.language.toUpperCase()}</em></button>
            <button type="button" onClick={() => duplicateDeck(deck.id)} aria-label="Duplicate deck"><Copy size={14} /></button>
            {!deck.isBuiltIn && <button type="button" onClick={() => deleteDeck(deck.id)} aria-label="Delete deck"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
      <div className="library-actions"><button type="button" onClick={() => openWorkbench('add')}><Plus size={13} /> ADD KNOWLEDGE</button><button type="button" onClick={() => openWorkbench('create')}><Plus size={13} /> NEW DECK</button></div>
    </div>
  )
}

function GesturePanel() {
  const enabled = useSettingsStore((state) => state.gestureEnabled)
  const status = useSettingsStore((state) => state.gestureStatus)
  const message = useSettingsStore((state) => state.gestureMessage)
  const setGestureEnabled = useSettingsStore((state) => state.setGestureEnabled)
  return (
    <div className="gesture-panel">
      <PanelTitle eyebrow="ADVANCED INPUT" title="Gesture Draw" description="张开手掌让知识轨道持续旋转；握紧手掌，立即抽中正面的知识卡片。" />
      <div className="gesture-map gesture-map--primary"><div><span>OPEN PALM · 420MS</span><strong>持续转动 / RANDOM DRAW</strong></div><div><span>CLOSE HAND · 310MS</span><strong>停止并抽中 / LOCK TARGET</strong></div></div>
      <div className={`gesture-live gesture-live--${status}`}><span /><strong>{message}</strong><em>CONFIDENCE ≥ 0.68 · COOLDOWN 950MS</em></div>
      <button className="primary-action" type="button" onClick={() => setGestureEnabled(!enabled)}><span>{enabled ? 'DISABLE AND RELEASE CAMERA' : 'ENABLE GESTURE CONTROL'}</span><HandIcon /></button>
      <p className="privacy-note">Camera frames stay in this browser and are not displayed in Creator Mode. Mouse and touch remain active at all times.</p>
    </div>
  )
}

function HandIcon() { return <span aria-hidden="true">◌</span> }

function SettingsPanel() {
  const muted = useSettingsStore((state) => state.soundMuted)
  const volume = useSettingsStore((state) => state.soundVolume)
  const key = useSettingsStore((state) => state.openRouterKey)
  const model = useSettingsStore((state) => state.openRouterModel)
  const setKey = useSettingsStore((state) => state.setOpenRouterKey)
  const setModel = useSettingsStore((state) => state.setOpenRouterModel)
  return (
    <div className="settings-panel">
      <PanelTitle eyebrow="SYSTEM SETTINGS" title="声音、AI 与本地控制" description="API Key 只保存在当前浏览器；正式部署应切换到 /api/ai 代理。" />
      <label className="range-field"><span>SOUND VOLUME</span><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => soundManager.setVolume(Number(event.target.value))} /><strong>{muted ? 'MUTED' : `${Math.round(volume * 100)}%`}</strong></label>
      <button className="setting-toggle" type="button" onClick={() => soundManager.setMuted(!muted)}><span>MECHANICAL SELECTOR SOUND</span><strong>{muted ? 'OFF' : 'ON'}</strong></button>
      <Field label="OPENROUTER API KEY / LOCAL ONLY" value={key} onChange={setKey} type="password" />
      <Field label="AI MODEL" value={model} onChange={setModel} />
    </div>
  )
}
