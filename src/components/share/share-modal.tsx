'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDisposableEmail } from '@/lib/email-validator'
import type { BoardMember } from '@/lib/types'

interface ShareModalProps {
  boardId: string
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ boardId, userId, isOpen, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  // Fetch current collaborators
  useEffect(() => {
    if (!isOpen) return

    async function fetchMembers() {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMembers(data as BoardMember[])
      }
    }

    fetchMembers()
  }, [isOpen, boardId, supabase])

  if (!isOpen) return null

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Please enter a valid email address.')
      return
    }

    // Check disposable email
    if (isDisposableEmail(cleanEmail)) {
      setError('Temporary or disposable email addresses are not permitted.')
      return
    }

    // Check if already invited
    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setError('This user is already a collaborator on this board.')
      return
    }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('board_members')
      .insert({
        board_id: boardId,
        email: cleanEmail,
        role: role,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message || 'Failed to invite collaborator.')
    } else if (data) {
      setMembers((prev) => [...prev, data as BoardMember])
      setEmail('')
      setSuccess(`Invited ${cleanEmail} as ${role}!`)
    }

    setLoading(false)
  }

  const handleRemove = async (memberId: string) => {
    const { error: deleteError } = await supabase
      .from('board_members')
      .delete()
      .eq('id', memberId)

    if (!deleteError) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="share-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <h2>Share Board</h2>
          </div>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="share-modal-desc">
          Invite teammates or friends with their email to collaborate on your board.
        </p>

        {error && <div className="share-alert share-alert-error">{error}</div>}
        {success && <div className="share-alert share-alert-success">{success}</div>}

        <form onSubmit={handleInvite} className="share-invite-form">
          <div className="share-input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
              className="share-email-input"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="share-role-select"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="submit" className="share-invite-btn" disabled={loading}>
              {loading ? '...' : 'Invite'}
            </button>
          </div>
        </form>

        <div className="share-members-section">
          <h3>Collaborators ({members.length})</h3>
          {members.length === 0 ? (
            <div className="share-members-empty">No collaborators invited yet.</div>
          ) : (
            <ul className="share-members-list">
              {members.map((member) => (
                <li key={member.id} className="share-member-item">
                  <div className="share-member-info">
                    <div className="share-member-avatar">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="share-member-details">
                      <span className="share-member-email">{member.email}</span>
                      <span className="share-member-role">{member.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="share-member-remove"
                    title="Remove access"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="share-modal-footer">
          <button onClick={handleCopyLink} className="share-copy-btn">
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied Board Link!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
