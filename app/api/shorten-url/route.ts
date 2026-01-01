import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL gereklidir" },
        { status: 400 }
      );
    }

    // Simple URL shortening using base64 encoding
    // In production, you'd use a proper URL shortening service like:
    // - bit.ly API
    // - tinyurl.com API
    // - Your own database-backed service
    
    // For now, create a simple hash-based short URL
    const hash = Buffer.from(url).toString('base64')
      .substring(0, 10)
      .replace(/[+/=]/g, '')
      .toLowerCase();
    
    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/v/${hash}`;

    // In production, you'd save this mapping to a database
    // For now, we'll just return the short URL
    // The actual redirect would be handled by a route handler at /v/[hash]

    return NextResponse.json({
      success: true,
      shortUrl,
      originalUrl: url,
    });
  } catch (error: any) {
    logger.error("Error in shorten-url API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "URL kısaltılamadı",
      },
      { status: 500 }
    );
  }
}
