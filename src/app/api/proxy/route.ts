import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('Missing video URL', { status: 400 });
  }

  try {
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!videoResponse.ok) {
      return new NextResponse(`Failed to fetch video: ${videoResponse.statusText}`, { status: videoResponse.status });
    }

    // Create new headers, copying from the original response
    const headers = new Headers();
    videoResponse.headers.forEach((value, key) => {
        // Don't copy content-encoding, as Next.js will handle compression.
        if (key.toLowerCase() !== 'content-encoding') {
            headers.set(key, value);
        }
    });
    headers.set('Access-Control-Allow-Origin', '*');

    if (!videoResponse.body) {
      return new NextResponse('Video stream not available', { status: 500 });
    }
    
    // Stream the video content
    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      statusText: videoResponse.statusText,
      headers: headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    if (error instanceof Error) {
        return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Error proxying video', { status: 500 });
  }
}
