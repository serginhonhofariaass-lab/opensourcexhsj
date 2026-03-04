import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.siteSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: "No Abraço do Pai",
          primaryColor: "#004642",
          secondaryColor: "#E5D4C8",
          backgroundColor: "#FFFFFF",
          textColor: "#1A1A1A",
          heroTitle: "Criado para promover suas experiências",
          heroSubtitle: "Descubra os melhores eventos religiosos e culturais perto de você",
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    const settings = await prisma.siteSettings.upsert({
      where: { id: body.id || 'default' },
      update: body,
      create: {
        siteName: body.siteName || "No Abraço do Pai",
        primaryColor: body.primaryColor || "#004642",
        secondaryColor: body.secondaryColor || "#E5D4C8",
        backgroundColor: body.backgroundColor || "#FFFFFF",
        textColor: body.textColor || "#1A1A1A",
        footerText: body.footerText,
        contactEmail: body.contactEmail,
        heroTitle: body.heroTitle || "Criado para promover suas experiências",
        heroSubtitle: body.heroSubtitle || "Descubra os melhores eventos",
        logoUrl: body.logoUrl,
        mpAccessToken: body.mpAccessToken,
        mpWebhookUrl: body.mpWebhookUrl,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
