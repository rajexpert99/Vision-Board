'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Card, Group } from '@/lib/types'

interface SearchBarProps {
  boardId: string
  onNavigateToCard: (card: Card) => void
  onNavigateToGroup: (group: Group) => void
  cards: Card[]
  groups: Group[]
}

export function SearchBar({
  boardId,
  onNavigateToCard,
  onNavigateToGroup,
  cards,
  groups,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ type: 'card' | 'group'; item: Card | Group }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Client-side search for instant results
  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }

      const lowerQ = q.toLowerCase()
      const matched: Array<{ type: 'card' | 'group'; item: Card | Group }> = []

      // Search groups
      for (const group of groups) {
        if (group.name.toLowerCase().includes(lowerQ)) {
          matched.push({ type: 'group', item: group })
        }
      }

      // Search cards
      for (const card of cards) {
        const searchableText = [
          card.title,
          card.text_content,
          card.link_url,
          card.content_url,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (searchableText.includes(lowerQ)) {
          matched.push({ type: 'card', item: card })
        }
      }

      setResults(matched.slice(0, 15))
    },
    [cards, groups]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 150)
    return () => clearTimeout(timer)
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Search cards, groups… (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            style={{ padding: '4px', color: 'var(--text-tertiary)' }}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((result, i) => (
            <div
              key={`${result.type}-${result.type === 'card' ? (result.item as Card).id : (result.item as Group).id}-${i}`}
              className="search-result-item"
              onClick={() => {
                if (result.type === 'card') {
                  onNavigateToCard(result.item as Card)
                } else {
                  onNavigateToGroup(result.item as Group)
                }
                setIsOpen(false)
                setQuery('')
              }}
            >
              <span className="search-result-type">
                {result.type === 'group' ? 'Group' : (result.item as Card).type}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {result.type === 'group'
                  ? (result.item as Group).name
                  : (result.item as Card).title ||
                    (result.item as Card).text_content?.slice(0, 50) ||
                    (result.item as Card).link_url ||
                    'Untitled'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
