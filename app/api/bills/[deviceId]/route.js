import { NextResponse } from 'next/server'
import { getBillsByDevice } from '../../../../lib/supabase'

export async function GET(request, { params }) {
  try {
    const { deviceId } = params
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    const bills = await getBillsByDevice(deviceId)
    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
} 