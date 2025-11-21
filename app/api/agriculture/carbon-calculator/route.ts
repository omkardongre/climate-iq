import { NextRequest, NextResponse } from 'next/server';

// IPCC Emission Factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  // Fuel (kg CO2e per liter)
  diesel: 2.68,
  petrol: 2.31,
  lpg: 1.51,
  
  // Electricity (kg CO2e per kWh) - India average
  electricity: 0.82,
  
  // Fertilizers (kg CO2e per kg)
  urea: 1.57,
  dap: 1.33,
  potash: 0.65,
  organic: 0.15,
  
  // Livestock (kg CO2e per animal per year)
  cattle: 2100,
  buffalo: 2500,
  goat: 28,
  sheep: 28,
  poultry: 1.5,
  
  // Irrigation (kg CO2e per hour)
  electricPump: 2.5,
  dieselPump: 8.5,
};

interface CarbonInput {
  farmSize: number; // acres
  
  // Fuel usage (liters per month)
  diesel?: number;
  petrol?: number;
  lpg?: number;
  
  // Electricity (kWh per month)
  electricity?: number;
  
  // Fertilizers (kg per season)
  urea?: number;
  dap?: number;
  potash?: number;
  organic?: number;
  
  // Livestock (number of animals)
  cattle?: number;
  buffalo?: number;
  goat?: number;
  sheep?: number;
  poultry?: number;
  
  // Irrigation (hours per month)
  electricPump?: number;
  dieselPump?: number;
  
  // Crop type (for comparison)
  cropType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CarbonInput = await request.json();
    
    // Calculate emissions by category
    const fuelEmissions = 
      (data.diesel || 0) * EMISSION_FACTORS.diesel +
      (data.petrol || 0) * EMISSION_FACTORS.petrol +
      (data.lpg || 0) * EMISSION_FACTORS.lpg;
    
    const electricityEmissions = (data.electricity || 0) * EMISSION_FACTORS.electricity;
    
    const fertilizerEmissions = 
      (data.urea || 0) * EMISSION_FACTORS.urea +
      (data.dap || 0) * EMISSION_FACTORS.dap +
      (data.potash || 0) * EMISSION_FACTORS.potash +
      (data.organic || 0) * EMISSION_FACTORS.organic;
    
    const livestockEmissions = 
      ((data.cattle || 0) * EMISSION_FACTORS.cattle +
      (data.buffalo || 0) * EMISSION_FACTORS.buffalo +
      (data.goat || 0) * EMISSION_FACTORS.goat +
      (data.sheep || 0) * EMISSION_FACTORS.sheep +
      (data.poultry || 0) * EMISSION_FACTORS.poultry) / 12; // Monthly
    
    const irrigationEmissions = 
      (data.electricPump || 0) * EMISSION_FACTORS.electricPump +
      (data.dieselPump || 0) * EMISSION_FACTORS.dieselPump;
    
    // Total monthly emissions (kg CO2e)
    const totalMonthly = 
      fuelEmissions + 
      electricityEmissions + 
      fertilizerEmissions / 4 + // Assuming 4 months per season
      livestockEmissions + 
      irrigationEmissions;
    
    // Annual emissions
    const totalAnnual = totalMonthly * 12;
    
    // Per acre emissions
    const perAcre = totalAnnual / data.farmSize;
    
    // Breakdown by category (percentage)
    const breakdown = {
      fuel: totalMonthly > 0 ? (fuelEmissions / totalMonthly) * 100 : 0,
      electricity: totalMonthly > 0 ? (electricityEmissions / totalMonthly) * 100 : 0,
      fertilizer: totalMonthly > 0 ? ((fertilizerEmissions / 4) / totalMonthly) * 100 : 0,
      livestock: totalMonthly > 0 ? (livestockEmissions / totalMonthly) * 100 : 0,
      irrigation: totalMonthly > 0 ? (irrigationEmissions / totalMonthly) * 100 : 0,
    };
    
    // Benchmarks (kg CO2e per acre per year) - Based on crop type
    const benchmarks: Record<string, number> = {
      rice: 2500,
      wheat: 1800,
      sugarcane: 3200,
      cotton: 2200,
      vegetables: 1500,
      pulses: 1200,
      default: 2000,
    };
    
    const benchmark = benchmarks[data.cropType?.toLowerCase() || 'default'] || benchmarks.default;
    const comparison = ((perAcre - benchmark) / benchmark) * 100;
    
    // Efficiency rating
    let rating = 'Average';
    let ratingColor = 'orange';
    if (perAcre < benchmark * 0.8) {
      rating = 'Excellent';
      ratingColor = 'green';
    } else if (perAcre < benchmark) {
      rating = 'Good';
      ratingColor = 'lime';
    } else if (perAcre > benchmark * 1.2) {
      rating = 'Poor';
      ratingColor = 'red';
    }
    
    // Quick wins (top 3 reduction opportunities)
    const categories = [
      { name: 'Fuel', emissions: fuelEmissions, potential: 20 },
      { name: 'Electricity', emissions: electricityEmissions, potential: 15 },
      { name: 'Fertilizer', emissions: fertilizerEmissions / 4, potential: 25 },
      { name: 'Livestock', emissions: livestockEmissions, potential: 10 },
      { name: 'Irrigation', emissions: irrigationEmissions, potential: 30 },
    ];
    
    const quickWins = categories
      .sort((a, b) => (b.emissions * b.potential) - (a.emissions * a.potential))
      .slice(0, 3)
      .map(cat => ({
        category: cat.name,
        currentEmissions: parseFloat(cat.emissions.toFixed(1)),
        potentialReduction: parseFloat((cat.emissions * cat.potential / 100).toFixed(1)),
        percentage: cat.potential,
      }));
    
    return NextResponse.json({
      emissions: {
        monthly: parseFloat(totalMonthly.toFixed(1)),
        annual: parseFloat(totalAnnual.toFixed(1)),
        perAcre: parseFloat(perAcre.toFixed(1)),
      },
      breakdown: {
        fuel: parseFloat(breakdown.fuel.toFixed(1)),
        electricity: parseFloat(breakdown.electricity.toFixed(1)),
        fertilizer: parseFloat(breakdown.fertilizer.toFixed(1)),
        livestock: parseFloat(breakdown.livestock.toFixed(1)),
        irrigation: parseFloat(breakdown.irrigation.toFixed(1)),
      },
      comparison: {
        benchmark,
        difference: parseFloat(comparison.toFixed(1)),
        rating,
        ratingColor,
      },
      quickWins,
      emissionFactors: EMISSION_FACTORS, // For transparency
    });
    
  } catch (error: any) {
    console.error('Carbon calculator error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate carbon footprint' },
      { status: 500 }
    );
  }
}
