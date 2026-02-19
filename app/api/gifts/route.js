import { NextResponse } from 'next/server';
import gifts from '../../../data/gifts.json';

export async function GET() {
  return NextResponse.json(gifts);
}
