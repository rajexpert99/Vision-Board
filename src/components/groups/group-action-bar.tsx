'use client'

import { useState } from 'react'
import { createGroup } from '@/lib/groups'
import type { Editor } from 'tldraw'

const GROUP_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#22c55e', // green
]

interface GroupActionBarProps {
  editor: Editor | null
  boardId: string
  userId: string
  getSelectedCardIds: () => string[]
  onGroupCreated: () => void
}

export function GroupActionBar({
  editor,
  boardId,
  userId,
  getSelectedCardIds,
  onGroupCreated,
}: GroupActionBarProps) {
  const [showModal, setShowModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !editor) return

    setLoading(true)

    const cardIds = getSelectedCardIds()
    const camera = editor.getCamera()

    const group = await createGroup(
      boardId,
      userId,
      groupName.trim(),
      selectedColor,
      cardIds,
      { x: camera.x, y: camera.y, zoom: camera.z }
    )

    if (group) {
      // Update the visual appearance of grouped shapes
      const shapes = editor.getCurrentPageShapes()
      for (const shape of shapes) {
        const s = shape as any
        if (s.props?.cardId && cardIds.includes(s.props.cardId)) {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: {
              ...s.props,
              groupColor: selectedColor,
            },
          })
        }
      }

      onGroupCreated()
    }

    setShowModal(false)
    setGroupName('')
    setSelectedColor(GROUP_COLORS[0])
    setLoading(false)
  }

  return (
    <>
      <div className="group-action-bar">
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {getSelectedCardIds().length} cards selected
        </span>
        <button
          className="group-action-btn primary"
          onClick={() => setShowModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Group
        </button>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Group</h3>
            <input
              className="modal-input"
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup()
              }}
            />
            <div className="color-picker">
              {GROUP_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || loading}
              >
                {loading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
