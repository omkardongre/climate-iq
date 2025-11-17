import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Water carbon factor: 0.3 kg CO2e per m³ (1000 liters)
const WATER_CARBON_FACTOR = 0.3 / 1000; // per liter

export async function POST(request: NextRequest) {
  try {
    const { userId, waterLiters, date } = await request.json();

    if (!waterLiters) {
      return NextResponse.json(
        { error: 'Water usage required' },
        { status: 400 }
      );
    }

    const usageDate = date || new Date().toISOString().split('T')[0];

    // Calculate carbon footprint (not stored in DB, calculated on demand)
    const carbonFootprint = waterLiters * WATER_CARBON_FACTOR;

    // Save to database (using correct column names from schema)
    const insertData: any = {
      usage_date: usageDate,
      liters_used: waterLiters,
      source: 'manual',
    };

    // Only add user_id if it's a valid UUID
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      insertData.user_id = userId;
    }

    // Check if entry exists for this date
    const { data: existing } = await supabase
      .from('water_usage')
      .select('id')
      .eq('usage_date', usageDate)
      .eq('user_id', insertData.user_id || null)
      .single();

    let data, error;
    if (existing) {
      // Update existing entry
      const result = await supabase
        .from('water_usage')
        .update(insertData)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new entry
      const result = await supabase
        .from('water_usage')
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
    });

  } catch (error: any) {
    console.error('Water usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save water usage' },
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
      .from('water_usage')
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
    const totalWater = data?.reduce((sum, entry) => sum + entry.liters_used, 0) || 0;
    const totalCarbon = totalWater * WATER_CARBON_FACTOR; // Calculate on demand
    const avgDaily = data && data.length > 0 ? totalWater / data.length : 0;

    // Average household water usage in India: 135 liters per person per day
    const nationalAvg = 135;
    const comparison = avgDaily > 0 ? ((avgDaily - nationalAvg) / nationalAvg) * 100 : 0;

    return NextResponse.json({
      usage: data || [],
      stats: {
        totalWater,
        totalCarbon,
        avgDaily,
        nationalAvg,
        comparison, // percentage above/below average
        daysTracked: data?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('Fetch water usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch water usage' },
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
      .from('water_usage')
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
    console.error('Delete water usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete water usage' },
      { status: 500 }
    );
  }
}
