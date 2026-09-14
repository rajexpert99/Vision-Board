'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Tldraw, useEditor, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'

import { NoteCardShapeUtil } from './shapes/card-note-shape'
import { ImageCardShapeUtil } from './shapes/card-image-shape'
import { FileCardShapeUtil } from './shapes/card-file-shape'
import { LinkCardShapeUtil } from './shapes/card-link-shape'
import { CanvaSidebar } from '../sidebar/canva-sidebar'
import { SearchBar } from '../search/search-bar'
import { UploadButton } from '../upload/upload-button'
import { CardContextMenu } from '../cards/card-context-menu'
import { GroupActionBar } from '../groups/group-action-bar'
import { createClient } from '@/lib/supabase/client'
import type { Card, Group } from '@/lib/types'

const customShapeUtils = [
  NoteCardShapeUtil,
  ImageCardShapeUtil,
  FileCardShapeUtil,
  LinkCardShapeUtil,
]

interface BoardCanvasProps {
  boardId: string
  userId: string
  initialCards: Card[]
  initialGroups: Group[]
}

export function BoardCanvas({
  boardId,
  userId,
  initialCards,
  initialGroups,
}: BoardCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    cardId: string
    card: Card
  } | null>(null)
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([])
  const [showEmptyHint, setShowEmptyHint] = useState(initialCards.length === 0)
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({})
  const supabase = createClient()

  // Hydrate tldraw with existing cards when editor mounts
  const handleMount = useCallback(
    (editorInstance: Editor) => {
      setEditor(editorInstance)

      // Add existing cards as custom shapes
      if (initialCards.length > 0) {
        const shapes = initialCards.map((card) => cardToShape(card, initialGroups))
        editorInstance.createShapes(shapes)
      }

      // Listen for selection changes
      editorInstance.store.listen(
        (entry) => {
          // Get selected shape IDs
          const selected = editorInstance.getSelectedShapeIds()
          setSelectedShapeIds([...selected])
        },
        { source: 'user', scope: 'session' }
      )
    },
    [initialCards, initialGroups]
  )

  // Listen for shape position/size changes and sync to DB
  useEffect(() => {
    if (!editor) return

    const unsub = editor.store.listen(
      (entry) => {
        for (const [, change] of Object.entries(entry.changes.updated)) {
          const [, to] = change as [any, any]
          if (to.typeName === 'shape' && to.type?.startsWith('board-card-')) {
            const cardId = to.props?.cardId
            if (!cardId) continue

            // Debounce the DB write
            if (debounceTimerRef.current[cardId]) {
              clearTimeout(debounceTimerRef.current[cardId])
            }
            debounceTimerRef.current[cardId] = setTimeout(async () => {
              await supabase
                .from('cards')
                .update({
                  x: to.x,
                  y: to.y,
                  width: to.props?.w,
                  height: to.props?.h,
                })
                .eq('id', cardId)
            }, 500)
          }
        }
      },
      { source: 'user', scope: 'document' }
    )

    return unsub
  }, [editor, supabase])

  // Handle right-click context menu for cards
  useEffect(() => {
    if (!editor) return

    const handlePointerDown = (info: any) => {
      // Close any existing context menu when clicking anywhere
      setContextMenu(null)
    }

    editor.on('event', (event: any) => {
      if (event.name === 'pointer_down') {
        handlePointerDown(event)
      }
    })
  }, [editor])

  // Add a new note card at the given canvas position
  const addNoteCard = useCallback(
    async (x: number, y: number, text: string = '') => {
      if (!editor) return

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Create in DB
      const { data, error } = await supabase
        .from('cards')
        .insert({
          board_id: boardId,
          user_id: userId,
          type: 'note',
          text_content: text,
          x,
          y,
          width: 220,
          height: 160,
          expires_at: expiresAt.toISOString(),
          is_permanent: false,
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Create note error:', error)
        return
      }

      const card = data as Card

      // Create tldraw shape
      editor.createShape({
        type: 'board-card-note',
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          text: text || '',
          groupColor: '',
          isPermanent: false,
          expiresAt: card.expires_at || '',
        },
      })

      setCards((prev) => [...prev, card])
      setShowEmptyHint(false)
    },
    [editor, boardId, userId, supabase]
  )

  // Add a link card from URL with OG metadata
  const addLinkCard = useCallback(
    async (x: number, y: number, url: string) => {
      if (!editor) return

      // Fetch OG metadata
      let ogData = { title: url, description: '', image: null as string | null, siteName: '' }
      try {
        const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`)
        if (res.ok) {
          ogData = await res.json()
        }
      } catch {
        // Fallback to just the URL
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { data, error } = await supabase
        .from('cards')
        .insert({
          board_id: boardId,
          user_id: userId,
          type: 'link',
          link_url: url,
          title: ogData.title || url,
          preview_image_url: ogData.image,
          text_content: ogData.description,
          x,
          y,
          width: 260,
          height: ogData.image ? 220 : 120,
          expires_at: expiresAt.toISOString(),
          is_permanent: false,
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Create link error:', error)
        return
      }

      const card = data as Card

      editor.createShape({
        type: 'board-card-link',
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          linkUrl: url,
          title: ogData.title || url,
          description: ogData.description || '',
          previewImage: ogData.image || '',
          siteName: ogData.siteName || '',
          groupColor: '',
          isPermanent: false,
          expiresAt: card.expires_at || '',
        },
      })

      setCards((prev) => [...prev, card])
      setShowEmptyHint(false)
    },
    [editor, boardId, userId, supabase]
  )

  // Handle adding an uploaded file/image card to the canvas
  const addUploadedCard = useCallback(
    (card: Card) => {
      if (!editor) return

      const isImage = card.type === 'image'

      if (isImage) {
        editor.createShape({
          type: 'board-card-image',
          x: card.x,
          y: card.y,
          props: {
            w: card.width,
            h: card.height,
            cardId: card.id,
            imageUrl: card.content_url || '',
            title: card.title || '',
            groupColor: '',
            isPermanent: card.is_permanent,
            expiresAt: card.expires_at || '',
          },
        })
      } else {
        editor.createShape({
          type: 'board-card-file',
          x: card.x,
          y: card.y,
          props: {
            w: card.width,
            h: card.height,
            cardId: card.id,
            fileName: card.title || '',
            fileType: card.content_url?.split('.').pop() || '',
            fileUrl: card.content_url || '',
            groupColor: '',
            isPermanent: card.is_permanent,
            expiresAt: card.expires_at || '',
          },
        })
      }

      setCards((prev) => [...prev, card])
      setShowEmptyHint(false)
    },
    [editor]
  )

  // Get the current viewport center in canvas coordinates
  const getViewportCenter = useCallback((): { x: number; y: number } => {
    if (!editor) return { x: 0, y: 0 }
    const bounds = editor.getViewportScreenBounds()
    const point = editor.screenToPage({
      x: bounds.x + bounds.w / 2,
      y: bounds.y + bounds.h / 2,
    })
    return { x: point.x, y: point.y }
  }, [editor])

  // Navigate camera to a specific position
  const navigateTo = useCallback(
    (x: number, y: number, zoom?: number) => {
      if (!editor) return
      editor.setCamera(
        { x, y, z: zoom || editor.getCamera().z },
        { animation: { duration: 500 } }
      )
    },
    [editor]
  )

  // Navigate to a card's position
  const navigateToCard = useCallback(
    (card: Card) => {
      if (!editor) return
      // Center on the card
      editor.centerOnPoint(
        { x: card.x + card.width / 2, y: card.y + card.height / 2 },
        { animation: { duration: 500 } }
      )
    },
    [editor]
  )

  // Navigate to a group's saved viewport
  const navigateToGroup = useCallback(
    (group: Group) => {
      if (!editor) return
      editor.setCamera(
        { x: group.camera_x, y: group.camera_y, z: group.camera_zoom },
        { animation: { duration: 500 } }
      )
    },
    [editor]
  )

  // Delete a card
  const deleteCard = useCallback(
    async (cardId: string) => {
      // Find the card
      const card = cards.find((c) => c.id === cardId)
      if (!card) return

      // Delete storage file if it exists
      if (card.content_url) {
        // Extract storage path from URL
        const urlParts = card.content_url.split('/card-files/')
        if (urlParts[1]) {
          await supabase.storage.from('card-files').remove([urlParts[1]])
        }
      }

      // Delete DB record
      await supabase.from('cards').delete().eq('id', cardId)

      // Remove tldraw shape
      if (editor) {
        const shapes = editor.getCurrentPageShapes()
        const shape = shapes.find(
          (s: any) => s.props?.cardId === cardId
        )
        if (shape) {
          editor.deleteShape(shape.id)
        }
      }

      setCards((prev) => prev.filter((c) => c.id !== cardId))
      setContextMenu(null)
    },
    [cards, editor, supabase]
  )

  // Toggle permanent status
  const togglePermanent = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId)
      if (!card) return

      const newValue = !card.is_permanent

      await supabase
        .from('cards')
        .update({
          is_permanent: newValue,
          expires_at: newValue ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', cardId)

      // Update local state
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, is_permanent: newValue, expires_at: newValue ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
            : c
        )
      )

      // Update tldraw shape
      if (editor) {
        const shapes = editor.getCurrentPageShapes()
        const shape = shapes.find((s: any) => s.props?.cardId === cardId) as any
        if (shape) {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: {
              ...shape.props,
              isPermanent: newValue,
              expiresAt: newValue ? '' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          })
        }
      }

      setContextMenu(null)
    },
    [cards, editor, supabase]
  )

  // Update card expiry
  const setCardExpiry = useCallback(
    async (cardId: string, days: number | null) => {
      const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null

      await supabase
        .from('cards')
        .update({ expires_at: expiresAt, is_permanent: days === null })
        .eq('id', cardId)

      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, expires_at: expiresAt, is_permanent: days === null }
            : c
        )
      )

      // Update shape
      if (editor) {
        const shapes = editor.getCurrentPageShapes()
        const shape = shapes.find((s: any) => s.props?.cardId === cardId) as any
        if (shape) {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: {
              ...shape.props,
              isPermanent: days === null,
              expiresAt: expiresAt || '',
            },
          })
        }
      }

      setContextMenu(null)
    },
    [editor, supabase]
  )

  // Handle double-click on empty canvas to create a note
  const handleCanvasDoubleClick = useCallback(() => {
    if (!editor) return
    const center = getViewportCenter()
    addNoteCard(center.x - 110, center.y - 80)
  }, [editor, getViewportCenter, addNoteCard])

  // Handle paste (detect URL vs text)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!editor) return

      const text = e.clipboardData?.getData('text/plain')
      if (!text) return

      // Check if it's a URL
      const urlPattern = /^https?:\/\/.+/i
      const center = getViewportCenter()

      if (urlPattern.test(text.trim())) {
        e.preventDefault()
        await addLinkCard(center.x - 130, center.y - 100, text.trim())
      } else if (text.trim().length > 0) {
        e.preventDefault()
        await addNoteCard(center.x - 110, center.y - 80, text.trim())
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [editor, getViewportCenter, addLinkCard, addNoteCard])

  // Handle right-click on canvas
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!editor) return

      // Check if we right-clicked on a card shape
      const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
      const shape = editor.getShapeAtPoint(point, { hitInside: true }) as any

      if (shape && shape.type?.startsWith('board-card-')) {
        e.preventDefault()
        const cardId = shape.props?.cardId
        const card = cards.find((c) => c.id === cardId)
        if (card) {
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            cardId,
            card,
          })
        }
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [editor, cards])

  // Refresh groups after grouping
  const refreshGroups = useCallback(async () => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true })

    if (data) setGroups(data as Group[])
  }, [boardId, supabase])

  // Refresh cards (for group updates)
  const refreshCards = useCallback(async () => {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })

    if (data) setCards(data as Card[])
  }, [boardId, supabase])

  // Get selected card IDs (from tldraw shape selection)
  const getSelectedCardIds = useCallback((): string[] => {
    if (!editor) return []
    const selectedIds = editor.getSelectedShapeIds()
    const cardIds: string[] = []
    for (const id of selectedIds) {
      const shape = editor.getShape(id) as any
      if (shape?.props?.cardId) {
        cardIds.push(shape.props.cardId)
      }
    }
    return cardIds
  }, [editor])

  // Determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className="app-layout">
      {/* Canva Sidebar (Left Rail + Floating Tools) */}
      <CanvaSidebar
        editor={editor}
        groups={groups}
        cards={cards}
        onNavigateToGroup={navigateToGroup}
        onNavigateToCard={navigateToCard}
        onAddNote={addNoteCard}
        onAddLink={addLinkCard}
        boardId={boardId}
        userId={userId}
        getViewportCenter={getViewportCenter}
        onCardCreated={addUploadedCard}
      />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Canvas area */}
      <div className="app-canvas-area">
        {/* Sidebar toggle (mobile) */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Search */}
        <SearchBar
          boardId={boardId}
          onNavigateToCard={navigateToCard}
          onNavigateToGroup={navigateToGroup}
          cards={cards}
          groups={groups}
        />

        {/* tldraw Canvas */}
        <Tldraw
          hideUi
          shapeUtils={customShapeUtils}
          onMount={handleMount}
        />

        {/* Empty state hint */}
        {showEmptyHint && (
          <div className="empty-hint">
            <h3>Your board is empty</h3>
            <p>
              Double-click to add a note · Paste a URL · Upload a file
            </p>
          </div>
        )}

        {/* Upload FAB */}
        <UploadButton
          boardId={boardId}
          userId={userId}
          getViewportCenter={getViewportCenter}
          onCardCreated={addUploadedCard}
        />

        {/* Group action bar (when 2+ shapes selected) */}
        {selectedShapeIds.length >= 2 && (
          <GroupActionBar
            editor={editor}
            boardId={boardId}
            userId={userId}
            getSelectedCardIds={getSelectedCardIds}
            onGroupCreated={() => {
              refreshGroups()
              refreshCards()
            }}
          />
        )}

        {/* Context menu */}
        {contextMenu && (
          <CardContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            card={contextMenu.card}
            onClose={() => setContextMenu(null)}
            onDelete={() => deleteCard(contextMenu.cardId)}
            onTogglePermanent={() => togglePermanent(contextMenu.cardId)}
            onSetExpiry={(days) => setCardExpiry(contextMenu.cardId, days)}
            onRemoveFromGroup={async () => {
              await supabase
                .from('cards')
                .update({ group_id: null })
                .eq('id', contextMenu.cardId)
              refreshCards()
              setContextMenu(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function cardToShape(card: Card, groups: Group[]) {
  const group = card.group_id
    ? groups.find((g) => g.id === card.group_id)
    : null
  const groupColor = group?.color || ''

  switch (card.type) {
    case 'note':
      return {
        type: 'board-card-note' as const,
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          text: card.text_content || '',
          groupColor,
          isPermanent: card.is_permanent,
          expiresAt: card.expires_at || '',
        },
      }
    case 'image':
      return {
        type: 'board-card-image' as const,
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          imageUrl: card.content_url || '',
          title: card.title || '',
          groupColor,
          isPermanent: card.is_permanent,
          expiresAt: card.expires_at || '',
        },
      }
    case 'file':
      return {
        type: 'board-card-file' as const,
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          fileName: card.title || '',
          fileType: card.content_url?.split('.').pop() || '',
          fileUrl: card.content_url || '',
          groupColor,
          isPermanent: card.is_permanent,
          expiresAt: card.expires_at || '',
        },
      }
    case 'link':
      return {
        type: 'board-card-link' as const,
        x: card.x,
        y: card.y,
        props: {
          w: card.width,
          h: card.height,
          cardId: card.id,
          linkUrl: card.link_url || '',
          title: card.title || '',
          description: card.text_content || '',
          previewImage: card.preview_image_url || '',
          siteName: '',
          groupColor,
          isPermanent: card.is_permanent,
          expiresAt: card.expires_at || '',
        },
      }
  }
}
