import { NextResponse } from 'next/server'
import ogs from 'open-graph-scraper'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    )
  }

  // Basic SSRF protection: block internal IPs
  const hostname = new URL(url).hostname
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  ) {
    return NextResponse.json(
      { error: 'Internal URLs are not allowed' },
      { status: 403 }
    )
  }

  try {
    const { result } = await ogs({ url, timeout: 8000 })

    const ogImage = result.ogImage
    let imageUrl: string | null = null

    if (Array.isArray(ogImage) && ogImage.length > 0) {
      imageUrl = ogImage[0].url
    }

    const response = {
      title: result.ogTitle || result.twitterTitle || '',
      description: result.ogDescription || result.twitterDescription || '',
      image: imageUrl,
      siteName: result.ogSiteName || '',
      url: result.ogUrl || url,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200',
      },
    })
  } catch (error) {
    console.error('OG scraping error:', error)
    return NextResponse.json(
      {
        title: '',
        description: '',
        image: null,
        siteName: '',
        url,
      },
      { status: 200 } // Return empty data rather than error so the card can still be created
    )
  }
}
