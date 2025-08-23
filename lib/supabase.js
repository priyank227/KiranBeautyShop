import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for database operations
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const addProduct = async (name) => {
  const { data, error } = await supabase
    .from('products')
    .insert([{ name }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const createBill = async (billData) => {
  const { data, error } = await supabase
    .from('bills')
    .insert([billData])
    .select('*')
  
  if (error) throw error
  return data[0]
}

export const updateBill = async (billId, updates) => {
  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', billId)
    .select()
  
  if (error) throw error
  return data[0]
}

export const getBillsByDevice = async (deviceId) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getBillById = async (id) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
} 