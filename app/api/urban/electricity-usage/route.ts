import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// India electricity grid carbon factor: 0.82 kg CO2e per kWh
const ELECTRICITY_CARBON_FACTOR = 0.82;

// Average electricity cost in India: ₹7 per kWh
const ELECTRICITY_COST_PER_KWH = 7;

export async function POST(request: NextRequest) {
  try {
    const { userId, electricityKwh, date } = await request.json();

    if (electricityKwh === undefined) {
      return NextResponse.json(
        { error: 'Electricity usage required' },
        { status: 400 }
      );
    }

    const usageDate = date || new Date().toISOString().split('T')[0];

    // Calculate carbon footprint and cost (not stored, calculated on demand)
    const carbonFootprint = electricityKwh * ELECTRICITY_CARBON_FACTOR;
    const cost = electricityKwh * ELECTRICITY_COST_PER_KWH;

    // Save to database (using correct column names from schema)
    const insertData: any = {
      usage_date: usageDate,
      kwh_used: electricityKwh,
      carbon_emissions: carbonFootprint,
      cost: cost,
      source: 'manual',
    };

    // Only add user_id if it's a valid UUID
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      insertData.user_id = userId;
    }

    // Check if entry exists for this date
    const { data: existing } = await supabase
      .from('electricity_usage')
      .select('id')
      .eq('usage_date', usageDate)
      .eq('user_id', insertData.user_id || null)
      .single();

    let data, error;
    if (existing) {
      // Update existing entry
      const result = await supabase
        .from('electricity_usage')
        .update(insertData)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new entry
      const result = await supabase
        .from('electricity_usage')
        .insert(insertData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      carbonFootprint,
      cost,
    });

  } catch (error: any) {
    console.error('Electricity usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save electricity usage' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    // Get usage for last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('electricity_usage')
      .select('*')
      .gte('usage_date', startDate.toISOString().split('T')[0])
      .order('usage_date', { ascending: false });

    // Only filter by user_id if it's a valid UUID
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics (using correct column names)
    const totalElectricity = data?.reduce((sum, entry) => sum + entry.kwh_used, 0) || 0;
    const totalCarbon = data?.reduce((sum, entry) => sum + entry.carbon_emissions, 0) || 0;
    const totalCost = data?.reduce((sum, entry) => sum + entry.cost, 0) || 0;
    const avgDaily = data && data.length > 0 ? totalElectricity / data.length : 0;

    // Average household electricity usage in India: 90 kWh per month = 3 kWh per day
    const nationalAvg = 3;
    const comparison = avgDaily > 0 ? ((avgDaily - nationalAvg) / nationalAvg) * 100 : 0;

    return NextResponse.json({
      usage: data || [],
      stats: {
        totalElectricity,
        totalCarbon,
        totalCost,
        avgDaily,
        nationalAvg,
        comparison, // percentage above/below average
        daysTracked: data?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('Fetch electricity usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch electricity usage' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('electricity_usage')
      .delete()
      .eq('usage_date', date);

    // Only filter by user_id if it's a valid UUID
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete electricity usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete electricity usage' },
      { status: 500 }
    );
  }
}
