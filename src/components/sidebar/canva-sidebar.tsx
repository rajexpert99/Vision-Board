import { useState } from 'react'
import type { Editor } from 'tldraw'
import type { Card, Group } from '@/lib/types'
import { uploadFileAndCreateCard } from '@/lib/upload'
import { ShareModal } from '@/components/share/share-modal'

interface CanvaSidebarProps {
  editor: Editor | null
  groups: Group[]
  cards: Card[]
  onNavigateToGroup: (group: Group) => void
  onNavigateToCard: (card: Card) => void
  onAddNote: (x: number, y: number, text?: string) => void
  onAddLink: (x: number, y: number, url: string) => void
  boardId: string
  userId: string
  getViewportCenter: () => { x: number; y: number }
  onCardCreated: (card: Card) => void
}

export function CanvaSidebar({
  editor,
  groups,
  cards,
  onNavigateToGroup,
  onNavigateToCard,
  onAddNote,
  onAddLink,
  boardId,
  userId,
  getViewportCenter,
  onCardCreated,
}: CanvaSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>('tools')
  const [activeTool, setActiveTool] = useState<string>('select')
  const [isUploading, setIsUploading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [isShareOpen, setIsShareOpen] = useState(false)

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId)
    if (!editor) return

    switch (toolId) {
      case 'select':
        editor.setCurrentTool('select')
        break
      case 'frame':
        editor.setCurrentTool('geo')
        break
      case 'draw':
        editor.setCurrentTool('draw')
        break
      case 'eraser':
        editor.setCurrentTool('eraser')
        break
      case 'line':
        editor.setCurrentTool('arrow')
        break
      case 'note': {
        const center = getViewportCenter()
        onAddNote(center.x - 110, center.y - 80, '')
        editor.setCurrentTool('select')
        break
      }
      case 'text':
        editor.setCurrentTool('text')
        break
      case 'freehand':
        editor.setCurrentTool('draw')
        break
      case 'table':
        editor.setCurrentTool('geo')
        break
      default:
        editor.setCurrentTool('select')
    }
  }

  // Handle direct file upload from Uploads panel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const file = files[0]
    const center = getViewportCenter()

    try {
      const newCard = await uploadFileAndCreateCard(
        file,
        boardId,
        userId,
        { x: center.x - 120, y: center.y - 100 }
      )

      if (newCard) {
        onCardCreated(newCard)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkInput.trim()) return
    const center = getViewportCenter()
    onAddLink(center.x - 130, center.y - 100, linkInput.trim())
    setLinkInput('')
  }

  return (
    <div className="canva-sidebar-wrapper">
      {/* ── 1. Far-Left Main Navigation Rail ────────────────────── */}
      <nav className="canva-nav-rail">
        <div className="canva-nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <button
          className={`canva-rail-item ${activeTab === 'elements' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'elements' ? '' : 'elements')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7.5" cy="7.5" r="4.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <polygon points="12,21 4,13 20,13" />
          </svg>
          <span>Elements</span>
        </button>

        <button
          className={`canva-rail-item ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'text' ? '' : 'text')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
          </svg>
          <span>Text</span>
        </button>

        <button
          className={`canva-rail-item ${activeTab === 'brand' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'brand' ? '' : 'brand')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
          <span>Brand</span>
        </button>

        <button
          className={`canva-rail-item ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'uploads' ? '' : 'uploads')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4 4-4 4 4" />
          </svg>
          <span>Uploads</span>
        </button>

        <button
          className={`canva-rail-item ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'tools' ? '' : 'tools')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
          </svg>

          <span>Tools</span>
        </button>

        <button
          className={`canva-rail-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'projects' ? '' : 'projects')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>Projects</span>
        </button>

        <button
          className="canva-share-nav-btn"
          onClick={() => setIsShareOpen(true)}
          title="Share Board"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
      </nav>

      {/* ── 2. Canva Floating Tool Palette (as seen in screenshot) ── */}
      {activeTab === 'tools' && (
        <div className="canva-floating-toolbar">
          <button
            className="canva-toolbar-close"
            onClick={() => setActiveTab('')}
            title="Close panel"
          >
            ✕
          </button>

          <div className="canva-tools-group">
            {/* Pointer / Cursor */}
            <button
              className={`canva-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
              onClick={() => handleToolSelect('select')}
              title="Select (V)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--canva-purple)" stroke="var(--canva-purple)">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
            </button>

            {/* Frame / Area */}
            <button
              className={`canva-tool-btn ${activeTool === 'frame' ? 'active' : ''}`}
              onClick={() => handleToolSelect('frame')}
              title="Frame Tool"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity="0.4" />
              </svg>
            </button>

            {/* Marker Pen */}
            <button
              className={`canva-tool-btn ${activeTool === 'draw' ? 'active' : ''}`}
              onClick={() => handleToolSelect('draw')}
              title="Draw / Pen Tool"
            >
              <div className="pen-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                </svg>
                <span className="pen-color-dot" style={{ background: '#ef4444' }} />
              </div>
            </button>

            {/* Highlighter / Marker */}
            <button
              className={`canva-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => handleToolSelect('eraser')}
              title="Eraser / Marker"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 2L2 16l6 6 14-14-8-6zm-6 18l-4-4 8-8 4 4-8 8z" opacity="0.85" />
              </svg>
            </button>

            {/* Line / Connector */}
            <button
              className={`canva-tool-btn ${activeTool === 'line' ? 'active' : ''}`}
              onClick={() => handleToolSelect('line')}
              title="Line / Connector"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                <line x1="4" y1="20" x2="20" y2="4" />
              </svg>
            </button>

            {/* Sticky Note */}
            <button
              className={`canva-tool-btn ${activeTool === 'note' ? 'active' : ''}`}
              onClick={() => handleToolSelect('note')}
              title="Sticky Note"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#facc15" stroke="#eab308">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>

            {/* Text Box */}
            <button
              className={`canva-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
              onClick={() => handleToolSelect('text')}
              title="Text Box"
            >
              <span className="purple-text-icon">T</span>
            </button>

            {/* Freehand Sketch */}
            <button
              className={`canva-tool-btn ${activeTool === 'freehand' ? 'active' : ''}`}
              onClick={() => handleToolSelect('freehand')}
              title="Freehand Draw"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17c3-3 6 3 9 0s6-3 9 0" />
              </svg>
            </button>

            {/* Table / Grid */}
            <button
              className={`canva-tool-btn ${activeTool === 'table' ? 'active' : ''}`}
              onClick={() => handleToolSelect('table')}
              title="Table"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Canva Expanded Drawer Panels for other tabs ────────── */}
      {activeTab && activeTab !== 'tools' && (
        <div className="canva-drawer-panel">
          <div className="canva-drawer-header">
            <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
            <button className="canva-drawer-close" onClick={() => setActiveTab('')}>✕</button>
          </div>

          <div className="canva-drawer-content">
            {/* Uploads tab */}
            {activeTab === 'uploads' && (
              <div className="canva-upload-panel">
                <label className="canva-upload-dropzone">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    hidden
                  />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--canva-purple)" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <span>{isUploading ? 'Uploading...' : 'Upload Files or Images'}</span>
                  <small>Drag & drop or click to browse</small>
                </label>

                <div className="canva-panel-divider">or add web bookmark link</div>

                <form onSubmit={handleAddLinkSubmit} className="canva-link-form">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="canva-panel-input"
                  />
                  <button type="submit" className="canva-panel-btn">Add Link Card</button>
                </form>
              </div>
            )}

            {/* Text tab */}
            {activeTab === 'text' && (
              <div className="canva-text-panel">
                <button
                  className="canva-preset-btn heading"
                  onClick={() => {
                    const center = getViewportCenter()
                    onAddNote(center.x - 110, center.y - 80, 'Add a heading')
                  }}
                >
                  Add a heading
                </button>
                <button
                  className="canva-preset-btn subheading"
                  onClick={() => {
                    const center = getViewportCenter()
                    onAddNote(center.x - 110, center.y - 80, 'Add a subheading')
                  }}
                >
                  Add a subheading
                </button>
                <button
                  className="canva-preset-btn body"
                  onClick={() => {
                    const center = getViewportCenter()
                    onAddNote(center.x - 110, center.y - 80, 'Add body text')
                  }}
                >
                  Add body text
                </button>
              </div>
            )}

            {/* Projects / Groups Tab */}
            {activeTab === 'projects' && (
              <div className="canva-projects-panel">
                <h4>Groups ({groups.length})</h4>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="canva-panel-item"
                    onClick={() => onNavigateToGroup(group)}
                  >
                    <span className="group-color-tag" style={{ background: group.color }} />
                    <span>{group.name}</span>
                  </div>
                ))}

                <h4 style={{ marginTop: '16px' }}>Cards ({cards.length})</h4>
                {cards.slice(0, 15).map((card) => (
                  <div
                    key={card.id}
                    className="canva-panel-item"
                    onClick={() => onNavigateToCard(card)}
                  >
                    <span>{card.title || card.text_content?.slice(0, 30) || card.type}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Elements / Brand Placeholder */}
            {(activeTab === 'elements' || activeTab === 'brand') && (
              <div className="canva-elements-grid">
                <p style={{ color: '#64748b', fontSize: '13px' }}>
                  Click items to add shapes and templates to your canvas.
                </p>
                <div className="canva-element-card" onClick={() => handleToolSelect('note')}>
                  <div className="element-preview sticky" />
                  <span>Sticky Note</span>
                </div>
                <div className="canva-element-card" onClick={() => handleToolSelect('frame')}>
                  <div className="element-preview frame" />
                  <span>Rectangle Frame</span>
                </div>
                <div className="canva-element-card" onClick={() => handleToolSelect('line')}>
                  <div className="element-preview line" />
                  <span>Line Arrow</span>
                </div>
                <div className="canva-element-card" onClick={() => handleToolSelect('table')}>
                  <div className="element-preview table" />
                  <span>Grid Table</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        boardId={boardId}
        userId={userId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  )
}
