import { NextResponse } from 'next/server';
import { getModelNames } from '@/utils/getModels';

export async function GET() {
  const models = getModelNames();
  return NextResponse.json({ models });
}
