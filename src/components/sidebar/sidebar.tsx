'use client'

import type { Card, Group } from '@/lib/types'

interface SidebarProps {
  groups: Group[]
  cards: Card[]
  isOpen: boolean
  onClose: () => void
  onNavigateToGroup: (group: Group) => void
  onNavigateToCard: (card: Card) => void
}

export function Sidebar({
  groups,
  cards,
  isOpen,
  onClose,
  onNavigateToGroup,
  onNavigateToCard,
}: SidebarProps) {
  const ungroupedCards = cards.filter((c) => !c.group_id)
  const recentCards = [...cards]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  // Count cards per group
  const groupCardCounts: Record<string, number> = {}
  for (const card of cards) {
    if (card.group_id) {
      groupCardCounts[card.group_id] = (groupCardCounts[card.group_id] || 0) + 1
    }
  }

  const cardTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        )
      case 'image':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )
      case 'link':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )
      case 'file':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Board</h2>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sidebar-body">
        {/* Groups section */}
        {groups.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Groups</div>
            {groups.map((group) => (
              <div
                key={group.id}
                className="sidebar-item"
                onClick={() => {
                  onNavigateToGroup(group)
                  onClose()
                }}
              >
                <div
                  className="sidebar-item-dot"
                  style={{ background: group.color }}
                />
                <span>{group.name}</span>
                <span className="sidebar-item-count">
                  {groupCardCounts[group.id] || 0}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recent section */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            Recent
          </div>
          {recentCards.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-md)',
                color: 'var(--text-tertiary)',
                fontSize: '13px',
              }}
            >
              No cards yet
            </div>
          ) : (
            recentCards.map((card) => (
              <div
                key={card.id}
                className="sidebar-item"
                onClick={() => {
                  onNavigateToCard(card)
                  onClose()
                }}
              >
                {cardTypeIcon(card.type)}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.title || card.text_content?.slice(0, 40) || card.link_url || 'Untitled'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Ungrouped section */}
        {ungroupedCards.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              Ungrouped ({ungroupedCards.length})
            </div>
            {ungroupedCards.slice(0, 20).map((card) => (
              <div
                key={card.id}
                className="sidebar-item"
                onClick={() => {
                  onNavigateToCard(card)
                  onClose()
                }}
              >
                {cardTypeIcon(card.type)}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.title || card.text_content?.slice(0, 40) || card.link_url || 'Untitled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
