import { NextResponse } from 'next/server'
import { createBill } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const billData = await request.json()
    
    // Validate required fields
    if (!billData.device_id || !billData.items || billData.items.length === 0) {
      return NextResponse.json(
        { error: 'Device ID and items are required' },
        { status: 400 }
      )
    }

    if (!billData.total_price || billData.total_price <= 0) {
      return NextResponse.json(
        { error: 'Valid total price is required' },
        { status: 400 }
      )
    }

    const bill = await createBill(billData)
    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
} 