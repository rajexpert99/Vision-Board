'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  useEditor,
  type RecordProps,
  type TLShape,
} from 'tldraw'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Note Card Shape
// ============================================================

const NOTE_SHAPE_TYPE = 'board-card-note' as const

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [NOTE_SHAPE_TYPE]: {
      w: number
      h: number
      cardId: string
      text: string
      groupColor: string
      isPermanent: boolean
      expiresAt: string
    }
  }
}

export type NoteCardShape = TLShape<typeof NOTE_SHAPE_TYPE>

function NoteCardComponent({ shape }: { shape: NoteCardShape }) {
  const { cardId, text, groupColor, isPermanent, expiresAt } = shape.props
  const [isEditing, setIsEditing] = useState(false)
  const [localText, setLocalText] = useState(text || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editor = useEditor()
  const supabase = createClient()

  useEffect(() => {
    setLocalText(text || '')
  }, [text])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleSave = async (newText: string) => {
    setIsEditing(false)
    if (newText === text) return

    // Update tldraw shape
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        text: newText,
      },
    })

    // Update DB
    if (cardId) {
      await supabase
        .from('cards')
        .update({ text_content: newText })
        .eq('id', cardId)
    }
  }

  const isExpiringSoon = expiresAt && !isPermanent && isWithinDays(expiresAt, 3)

  return (
    <HTMLContainer
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
      }}
    >
      <div
        className={`board-card ${groupColor ? 'grouped' : ''} ${isExpiringSoon ? 'expiring-soon' : ''}`}
        style={{
          '--card-group-color': groupColor || undefined,
          cursor: isEditing ? 'text' : 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        } as React.CSSProperties}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
      >
        <div className="board-card-note" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => handleSave(localText)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  handleSave(localText)
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Type your note here..."
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            />
          ) : (
            <div
              className="board-card-note-text"
              style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              title="Double-click to edit note"
            >
              {localText || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Double-click to write note…</span>}
            </div>
          )}
        </div>

        {(isPermanent || isExpiringSoon) && (
          <div className="board-card-meta">
            {isPermanent && <span className="board-card-badge permanent">Pinned</span>}
            {isExpiringSoon && <span className="board-card-badge expiring">Expiring</span>}
          </div>
        )}
      </div>
    </HTMLContainer>
  )
}

export class NoteCardShapeUtil extends BaseBoxShapeUtil<NoteCardShape> {
  static override type = NOTE_SHAPE_TYPE as string
  static override props: RecordProps<NoteCardShape> = {
    w: T.number,
    h: T.number,
    cardId: T.string,
    text: T.string,
    groupColor: T.string,
    isPermanent: T.boolean,
    expiresAt: T.string,
  }

  getDefaultProps(): NoteCardShape['props'] {
    return {
      w: 220,
      h: 160,
      cardId: '',
      text: '',
      groupColor: '',
      isPermanent: false,
      expiresAt: '',
    }
  }

  component(shape: NoteCardShape) {
    return <NoteCardComponent shape={shape} />
  }

  override getIndicatorPath(shape: NoteCardShape) {
    const path = new Path2D()
    const r = 10
    const w = shape.props.w
    const h = shape.props.h
    path.moveTo(r, 0)
    path.lineTo(w - r, 0)
    path.arcTo(w, 0, w, r, r)
    path.lineTo(w, h - r)
    path.arcTo(w, h, w - r, h, r)
    path.lineTo(r, h)
    path.arcTo(0, h, 0, h - r, r)
    path.lineTo(0, r)
    path.arcTo(0, 0, r, 0, r)
    path.closePath()
    return path
  }
}

function isWithinDays(dateStr: string, days: number): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = expiry - now
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000
}
