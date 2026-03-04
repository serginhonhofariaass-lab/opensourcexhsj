import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Return success (in production, you'd set a session/cookie here)
    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso.',
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
