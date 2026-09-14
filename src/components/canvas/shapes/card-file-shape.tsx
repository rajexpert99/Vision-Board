import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLShape,
} from 'tldraw'

// ============================================================
// File Card Shape
// ============================================================

const FILE_SHAPE_TYPE = 'board-card-file' as const

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [FILE_SHAPE_TYPE]: {
      w: number
      h: number
      cardId: string
      fileName: string
      fileType: string
      fileUrl: string
      groupColor: string
      isPermanent: boolean
      expiresAt: string
    }
  }
}

export type FileCardShape = TLShape<typeof FILE_SHAPE_TYPE>

export class FileCardShapeUtil extends BaseBoxShapeUtil<FileCardShape> {
  static override type = FILE_SHAPE_TYPE as string
  static override props: RecordProps<FileCardShape> = {
    w: T.number,
    h: T.number,
    cardId: T.string,
    fileName: T.string,
    fileType: T.string,
    fileUrl: T.string,
    groupColor: T.string,
    isPermanent: T.boolean,
    expiresAt: T.string,
  }

  getDefaultProps(): FileCardShape['props'] {
    return {
      w: 180,
      h: 160,
      cardId: '',
      fileName: '',
      fileType: '',
      fileUrl: '',
      groupColor: '',
      isPermanent: false,
      expiresAt: '',
    }
  }

  component(shape: FileCardShape) {
    const { fileName, fileType, fileUrl, groupColor, isPermanent, expiresAt } = shape.props
    const isExpiringSoon = expiresAt && !isPermanent && isWithinDays(expiresAt, 3)
    const ext = fileType || fileName.split('.').pop()?.toUpperCase() || 'FILE'

    const handleOpenFile = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer')
      }
    }

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
            cursor: 'pointer',
            height: '100%',
          } as React.CSSProperties}
          onDoubleClick={handleOpenFile}
        >
          <div className="board-card-file">
            <svg className="board-card-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="board-card-file-name" title={fileName}>{fileName || 'Untitled file'}</div>
            <div className="board-card-file-type">{ext}</div>
            {fileUrl && (
              <button
                onClick={handleOpenFile}
                style={{
                  marginTop: '8px',
                  padding: '4px 10px',
                  background: 'var(--bg-elevated, #f1f5f9)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Download or open file"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
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

  override getIndicatorPath(shape: FileCardShape) {
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
