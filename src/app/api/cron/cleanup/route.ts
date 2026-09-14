import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Cron endpoint: delete expired cards.
 * Called daily by Vercel Cron.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role key for cron operations (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Find expired, non-permanent cards
  const { data: expiredCards, error: fetchError } = await supabase
    .from('cards')
    .select('id, content_url')
    .lt('expires_at', new Date().toISOString())
    .eq('is_permanent', false)

  if (fetchError) {
    console.error('Fetch expired cards error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!expiredCards || expiredCards.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'No expired cards found' })
  }

  // Delete storage files
  const storagePaths: string[] = []
  for (const card of expiredCards) {
    if (card.content_url) {
      const parts = card.content_url.split('/card-files/')
      if (parts[1]) {
        storagePaths.push(parts[1])
      }
    }
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('card-files')
      .remove(storagePaths)

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }
  }

  // Delete DB records
  const cardIds = expiredCards.map((c) => c.id)
  const { error: deleteError } = await supabase
    .from('cards')
    .delete()
    .in('id', cardIds)

  if (deleteError) {
    console.error('DB delete error:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  console.log(`Cleanup: deleted ${cardIds.length} expired cards`)

  return NextResponse.json({
    deleted: cardIds.length,
    message: `Deleted ${cardIds.length} expired cards`,
  })
}
