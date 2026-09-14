'use client'

import { useRef, useState } from 'react'
import { uploadFileAndCreateCard } from '@/lib/upload'
import type { Card } from '@/lib/types'

interface UploadButtonProps {
  boardId: string
  userId: string
  getViewportCenter: () => { x: number; y: number }
  onCardCreated: (card: Card) => void
}

export function UploadButton({
  boardId,
  userId,
  getViewportCenter,
  onCardCreated,
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploading(true)
      setFileName(file.name)
      setProgress(10)

      const center = getViewportCenter()
      // Offset each file slightly so they don't stack exactly
      const offset = i * 30

      const card = await uploadFileAndCreateCard(
        file,
        boardId,
        userId,
        { x: center.x - 120 + offset, y: center.y - 100 + offset },
        (percent) => setProgress(percent)
      )

      if (card) {
        onCardCreated(card)
      }
    }

    setUploading(false)
    setProgress(0)
    setFileName('')

    // Reset input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.zip,.rar"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        className="upload-fab"
        onClick={handleClick}
        disabled={uploading}
        aria-label="Upload file"
        title="Upload file"
      >
        {uploading ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>

      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-text">
            Uploading {fileName}…
          </div>
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  )
}
