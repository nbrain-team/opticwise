import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/audit-tool - Submit audit request (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      firstName,
      lastName,
      company,
      title,
      phone,
      propertyType,
      propertySize,
      numberOfUnits,
      independentSystems,
      physicalNetworks,
      currentVendors,
      painPoints,
      decisionMaker,
      budget,
      timeline,
      source,
      campaignId,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Calculate lead score based on responses
    let score = 0;
    
    // Property type scoring
    if (propertyType) score += 10;
    
    // Size/units scoring
    if (numberOfUnits) {
      if (numberOfUnits >= 100) score += 20;
      else if (numberOfUnits >= 50) score += 15;
      else if (numberOfUnits >= 20) score += 10;
      else score += 5;
    }
    
    // Systems complexity scoring
    if (independentSystems) {
      if (independentSystems >= 5) score += 20;
      else if (independentSystems >= 3) score += 15;
      else score += 10;
    }
    
    if (physicalNetworks) {
      if (physicalNetworks >= 3) score += 15;
      else if (physicalNetworks >= 2) score += 10;
      else score += 5;
    }
    
    // Pain points scoring
    if (painPoints && painPoints.length > 50) score += 15;
    
    // Decision maker scoring
    if (decisionMaker) score += 20;
    
    // Budget scoring
    if (budget) score += 10;
    
    // Timeline scoring
    if (timeline) score += 10;

    // Determine qualification
    let qualification = 'new';
    if (score >= 70) qualification = 'qualified';
    else if (score >= 40) qualification = 'qualified';
    else qualification = 'not-qualified';

    // Check if person exists in CRM
    const existingPerson = await prisma.person.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    // Check if organization exists
    let organizationId = existingPerson?.organizationId;
    if (!organizationId && company) {
      const existingOrg = await prisma.organization.findFirst({
        where: { name: company },
      });
      organizationId = existingOrg?.id;
    }

    // Create audit request
    const auditRequest = await prisma.auditRequest.create({
      data: {
        email,
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || null,
        firstName,
        lastName,
        company,
        title,
        phone,
        personId: existingPerson?.id,
        organizationId,
        propertyType,
        propertySize,
        numberOfUnits,
        independentSystems,
        physicalNetworks,
        currentVendors,
        painPoints,
        decisionMaker,
        budget,
        timeline,
        score,
        qualification,
        source,
        campaignId,
        utmSource,
        utmMedium,
        utmCampaign,
        status: 'pending',
      },
    });

    // Generate Calendly link (you'll need to configure this)
    const calendlyLink = process.env.CALENDLY_LINK || 'https://calendly.com/opticwise/consultation';

    // Return response with insights
    const insights = generateInsights({
      propertyType,
      numberOfUnits,
      independentSystems,
      physicalNetworks,
      painPoints,
    });

    return NextResponse.json({
      success: true,
      auditRequest: {
        id: auditRequest.id,
        score,
        qualification,
      },
      insights,
      bookingUrl: calendlyLink,
      message: 'Thank you for your interest! Based on your responses, we\'ve identified several opportunities to optimize your property infrastructure.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit request:', error);
    return NextResponse.json(
      { error: 'Failed to submit audit request' },
      { status: 500 }
    );
  }
}

// GET /api/audit-tool - List audit requests (authenticated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) where.status = status;

    const auditRequests = await prisma.auditRequest.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        convertedToDeal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ auditRequests });
  } catch (error) {
    console.error('Error fetching audit requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit requests' },
      { status: 500 }
    );
  }
}

// Helper function to generate insights
function generateInsights(data: any) {
  const insights = [];

  if (data.independentSystems >= 5) {
    insights.push({
      title: 'System Consolidation Opportunity',
      description: `With ${data.independentSystems} independent systems, you could save 30-40% on maintenance costs through consolidation.`,
      potentialSavings: 'High',
    });
  }

  if (data.physicalNetworks >= 3) {
    insights.push({
      title: 'Network Optimization',
      description: `Multiple physical networks increase complexity and cost. A unified digital infrastructure could reduce operational overhead by 25%.`,
      potentialSavings: 'Medium-High',
    });
  }

  if (data.numberOfUnits >= 100) {
    insights.push({
      title: 'Scale Advantage',
      description: `Properties of your size typically see $6-12 per door in additional revenue through tenant services and 10%+ utility savings.`,
      potentialSavings: 'Very High',
    });
  }

  if (data.propertyType === 'apartment') {
    insights.push({
      title: 'Tenant Revenue Opportunity',
      description: 'Apartment properties can generate significant recurring revenue through internet, cable, and smart home services.',
      potentialSavings: 'High',
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Infrastructure Assessment',
      description: 'We\'ve identified opportunities to optimize your property\'s digital infrastructure. Let\'s discuss your specific needs.',
      potentialSavings: 'To Be Determined',
    });
  }

  return insights;
}

