import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user email from cookie
    const userEmail = request.cookies.get('userEmail');

    if (userEmail) {
      return NextResponse.json({
        email: userEmail.value,
      });
    }

    return NextResponse.json({ email: null });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ email: null });
  }
}
