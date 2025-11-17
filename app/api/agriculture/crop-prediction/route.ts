import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { n, p, k, temperature, humidity, ph, rainfall } = body;

    // Validate inputs
    if (
      typeof n !== 'number' ||
      typeof p !== 'number' ||
      typeof k !== 'number' ||
      typeof temperature !== 'number' ||
      typeof humidity !== 'number' ||
      typeof ph !== 'number' ||
      typeof rainfall !== 'number'
    ) {
      return NextResponse.json(
        { error: 'All parameters must be numbers' },
        { status: 400 }
      );
    }

    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'ml', 'predict.py');

    // Execute Python script with arguments
    const command = `python3 ${scriptPath} ${n} ${p} ${k} ${temperature} ${humidity} ${ph} ${rainfall}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Python script error:', stderr);
    }

    // Parse the JSON output from Python
    const result = JSON.parse(stdout.trim());

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('Crop prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to predict crop',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
