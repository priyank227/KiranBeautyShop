'use client'

import { useState, useEffect } from 'react'
import { getProducts, addProduct } from '../../lib/supabase'

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [newProductName, setNewProductName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading products:', error)
      setMessage('Error loading products')
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    
    if (!newProductName.trim()) {
      setMessage('Product name is required')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await addProduct(newProductName.trim())
      setNewProductName('')
      setMessage('Product added successfully!')
      loadProducts() // Reload the list
    } catch (error) {
      console.error('Error adding product:', error)
      setMessage('Error adding product. It might already exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage Products</p>
      </div>

      {/* Add Product Form */}
      <div className="card max-w-md mx-auto">
        <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="input-field"
              placeholder="e.g., Lipstick, Powder, Eyeliner"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>

        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Current Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No products found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">
                  Added: {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="text-center">
        <a href="/" className="btn-secondary">
          Back to Billing
        </a>
      </div>
    </div>
  )
} 