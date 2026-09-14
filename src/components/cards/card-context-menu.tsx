'use client'

import { useEffect, useRef } from 'react'
import type { Card } from '@/lib/types'

interface CardContextMenuProps {
  x: number
  y: number
  card: Card
  onClose: () => void
  onDelete: () => void
  onTogglePermanent: () => void
  onSetExpiry: (days: number | null) => void
  onRemoveFromGroup: () => void
}

export function CardContextMenu({
  x,
  y,
  card,
  onClose,
  onDelete,
  onTogglePermanent,
  onSetExpiry,
  onRemoveFromGroup,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid immediate close from the right-click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - 300)

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Pin / Unpin */}
      <button className="context-menu-item" onClick={onTogglePermanent}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {card.is_permanent ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
          )}
        </svg>
        {card.is_permanent ? 'Unpin (allow expiry)' : 'Pin (make permanent)'}
      </button>

      <div className="context-menu-separator" />

      {/* Expiry options */}
      <button className="context-menu-item" onClick={() => onSetExpiry(7)}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Expire in 7 days
      </button>
      <button className="context-menu-item" onClick={() => onSetExpiry(30)}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Expire in 30 days
      </button>
      <button className="context-menu-item" onClick={() => onSetExpiry(90)}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Expire in 90 days
      </button>
      <button className="context-menu-item" onClick={() => onSetExpiry(null)}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" />
          <path d="M22 12l-4 4-4-4" />
        </svg>
        Never expire
      </button>

      {/* Remove from group (if in a group) */}
      {card.group_id && (
        <>
          <div className="context-menu-separator" />
          <button className="context-menu-item" onClick={onRemoveFromGroup}>
            <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="12" x2="15" y2="12" />
            </svg>
            Remove from group
          </button>
        </>
      )}

      <div className="context-menu-separator" />

      {/* Delete */}
      <button className="context-menu-item danger" onClick={onDelete}>
        <svg className="context-menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  )
}
