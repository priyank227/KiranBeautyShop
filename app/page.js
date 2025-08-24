'use client'

import { useState, useEffect } from 'react'
import { getProducts, createBill, updateBill, supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'
import { useAuth } from './contexts/AuthContext'

export default function HomePage() {
  const { username, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentBill, setCurrentBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [editProductName, setEditProductName] = useState('')
  const [editQuantity, setEditQuantity] = useState(1)
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    // Generate or retrieve device ID
    const storedDeviceId = localStorage.getItem('device_id')
    if (storedDeviceId) {
      setDeviceId(storedDeviceId)
    } else {
      const newDeviceId = 'device_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('device_id', newDeviceId)
      setDeviceId(newDeviceId)
    }

    // Load products
    loadProducts()
  }, [])

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const loadProducts = async () => {
    try {
      const productsData = await getProducts()
      setProducts(productsData)
      setFilteredProducts(productsData)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const addToCart = () => {
    if (!selectedProduct || !price || quantity <= 0) {
      alert('Please fill in all fields correctly')
      return
    }

    const newItem = {
      product_name: selectedProduct,
      quantity: quantity,
      price: parseFloat(price),
      subtotal: quantity * parseFloat(price)
    }

    setCartItems([...cartItems, newItem])
    
    // Clear the form for next item
    setSelectedProduct('')
    setQuantity(1)
    setPrice('')
  }

  const removeFromCart = (index) => {
    const newCart = [...cartItems]
    newCart.splice(index, 1)
    setCartItems(newCart)
  }

  const editCartItem = (index) => {
    const item = cartItems[index]
    setEditingItem(index)
    setEditProductName(item.product_name)
    setEditQuantity(item.quantity)
    setEditPrice(item.price.toString())
  }

  const saveEdit = () => {
    if (!editProductName.trim() || !editPrice || editQuantity <= 0) {
      alert('Please fill in all fields correctly')
      return
    }

    const newCart = [...cartItems]
    newCart[editingItem] = {
      ...newCart[editingItem],
      product_name: editProductName.trim(),
      quantity: editQuantity,
      price: parseFloat(editPrice),
      subtotal: editQuantity * parseFloat(editPrice)
    }

    setCartItems(newCart)
    setEditingItem(null)
    setEditProductName('')
    setEditQuantity(1)
    setEditPrice('')
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditProductName('')
    setEditQuantity(1)
    setEditPrice('')
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0)
  }

  const selectProduct = (productName) => {
    setSelectedProduct(productName)
    setShowProductModal(false)
    setSearchTerm('')
  }

  const openProductModal = () => {
    setShowProductModal(true)
    setSearchTerm('')
  }

  const testReceiptDisplay = () => {
    // Create a test bill for demonstration
    const testBill = {
      bill_no: 'TEST001',
      created_at: new Date().toISOString(),
      customer_name: 'Test Customer',
      items: [
        { product_name: 'Test Product 1', quantity: 2, price: 100, subtotal: 200 },
        { product_name: 'Test Product 2', quantity: 1, price: 150, subtotal: 150 }
      ],
      total_price: 350
    }
    
    const receiptElement = document.getElementById('receipt-print-test')
    if (receiptElement) {
      receiptElement.classList.remove('hidden')
      receiptElement.style.position = 'fixed'
      receiptElement.style.top = '50px'
      receiptElement.style.left = '50px'
      receiptElement.style.zIndex = '9999'
      receiptElement.style.visibility = 'visible'
      receiptElement.style.backgroundColor = 'white'
      receiptElement.style.border = '2px solid black'
      receiptElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
      console.log('Test receipt element shown')
      
      // Hide after 5 seconds
      setTimeout(() => {
        receiptElement.classList.add('hidden')
        receiptElement.style.position = 'fixed'
        receiptElement.style.top = '0'
        receiptElement.style.left = '0'
        receiptElement.style.zIndex = '-1'
        receiptElement.style.visibility = 'hidden'
        receiptElement.style.border = 'none'
        receiptElement.style.boxShadow = 'none'
        console.log('Test receipt element hidden again')
      }, 5000)
    } else {
      console.error('Test receipt element not found')
    }
  }

  const generateDirectPDF = (billData) => {
    try {
      console.log('Generating direct PDF for:', billData)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Set font
      pdf.setFont('helvetica')
      
      // Header
      pdf.setFontSize(18)
      pdf.text('Kiran Beauty Shop', 105, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text('--- Shine with Elegance ---', 105, 30, { align: 'center' })
      
      // Bill details
      pdf.setFontSize(10)
      pdf.text(`Bill No: #${billData.bill_no}`, 20, 50)
      pdf.text(`Date: ${new Date(billData.created_at).toLocaleDateString('en-IN')}`, 20, 60)
      pdf.text(`Customer: ${billData.customer_name}`, 20, 70)
      
      // Items table header
      pdf.text('Items:', 20, 90)
      pdf.line(20, 95, 190, 95) // Header line
      
      // Table headers
      pdf.text('Item', 25, 105)
      pdf.text('Qty', 100, 105)
      pdf.text('Price', 130, 105)
      pdf.text('Subtotal', 160, 105)
      
      pdf.line(20, 110, 190, 110) // Separator line
      
      let yPosition = 120
      
      // Items
      billData.items.forEach((item, index) => {
        pdf.text(item.product_name, 25, yPosition)
        pdf.text(item.quantity.toString(), 100, yPosition)
        pdf.text(`₹${item.price}`, 130, yPosition)
        pdf.text(`₹${item.subtotal.toFixed(2)}`, 160, yPosition)
        yPosition += 15
      })
      
      // Total line
      pdf.line(20, yPosition + 5, 190, yPosition + 5)
      pdf.setFontSize(12)
      pdf.text('Total:', 20, yPosition + 15)
      pdf.text(`₹${billData.total_price.toFixed(2)}`, 160, yPosition + 15)
      
      // Footer
      pdf.setFontSize(10)
      pdf.text('✨ Thank you for shopping with us ✨', 105, yPosition + 35, { align: 'center' })
      pdf.text('Visit Again 💖', 105, yPosition + 42, { align: 'center' })
      
      console.log('Direct PDF generated successfully')
      return pdf
      
    } catch (error) {
      console.error('Error generating direct PDF:', error)
      throw error
    }
  }

  const testPDFGeneration = async () => {
    try {
      console.log('Testing PDF generation...')
      
      // Create a test bill for demonstration
      const testBill = {
        bill_no: 'TEST001',
        created_at: new Date().toISOString(),
        customer_name: 'Test Customer',
        items: [
          { product_name: 'Test Product 1', quantity: 2, price: 100, subtotal: 200 },
          { product_name: 'Test Product 2', quantity: 1, price: 150, subtotal: 150 }
        ],
        total_price: 350
      }
      
      // Try html2canvas method first
      try {
        console.log('Attempting html2canvas method...')
        
        // Generate PDF using the test receipt element
        const receiptElement = document.getElementById('receipt-print-test')
        if (!receiptElement) {
          console.error('Test receipt element not found')
          return
        }
        
        // Temporarily show the test receipt element with proper positioning
        receiptElement.classList.remove('hidden')
        receiptElement.style.position = 'absolute'
        receiptElement.style.top = '0'
        receiptElement.style.left = '0'
        receiptElement.style.zIndex = '9999'
        receiptElement.style.visibility = 'visible'
        receiptElement.style.backgroundColor = 'white'
        receiptElement.style.width = '220px'
        receiptElement.style.height = 'auto'
        receiptElement.style.overflow = 'visible'
        
        // Force a reflow to ensure the element is properly rendered
        receiptElement.offsetHeight
        
        // Wait for rendering and ensure content is visible
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Receipt element dimensions:', {
          offsetWidth: receiptElement.offsetWidth,
          offsetHeight: receiptElement.offsetHeight,
          scrollWidth: receiptElement.scrollWidth,
          scrollHeight: receiptElement.scrollHeight,
          clientWidth: receiptElement.clientWidth,
          clientHeight: receiptElement.clientHeight
        })
        
        // Check if content is actually visible
        const contentCheck = receiptElement.innerHTML
        console.log('Receipt content length:', contentCheck.length)
        console.log('Receipt content preview:', contentCheck.substring(0, 200))
        
        console.log('Generating PDF from test receipt...')
        const canvas = await html2canvas(receiptElement, {
          width: 220,
          height: receiptElement.scrollHeight,
          scale: 1, // Use scale 1 for better compatibility
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: true,
          logging: true,
          removeContainer: false,
          ignoreElements: (element) => {
            // Don't ignore any elements
            return false
          }
        })
        
        // Hide the element again
        receiptElement.classList.add('hidden')
        receiptElement.style.position = 'fixed'
        receiptElement.style.zIndex = '-1'
        receiptElement.style.visibility = 'hidden'
        
        console.log('Canvas generated:', { 
          width: canvas.width, 
          height: canvas.height,
          dataURL: canvas.toDataURL().substring(0, 100) + '...'
        })
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png', 1.0)
        console.log('Image data generated, length:', imgData.length)
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [58, receiptElement.scrollHeight * 0.264583]
        })
        
        pdf.addImage(imgData, 'PNG', 0, 0, 58, receiptElement.scrollHeight * 0.264583)
        
        // Download the test PDF
        const pdfBlob = pdf.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'test_receipt_html2canvas.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('html2canvas PDF generated and downloaded successfully!')
        alert('html2canvas PDF generated successfully! Check your downloads folder.')
        
      } catch (html2canvasError) {
        console.log('html2canvas failed, trying direct method:', html2canvasError)
        
        // Fallback to direct PDF generation
        const pdf = generateDirectPDF(testBill)
        
        // Download the direct PDF
        const pdfBlob = pdf.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'test_receipt_direct.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('Direct PDF generated and downloaded successfully!')
        alert('Direct PDF generated successfully! Check your downloads folder.')
      }
      
    } catch (error) {
      console.error('Error testing PDF generation:', error)
      alert('Error testing PDF generation: ' + error.message)
    }
  }

  const generatePDF = async (billData) => {
    const receiptElement = document.getElementById('receipt-print')
    
    if (!receiptElement) {
      console.error('Receipt element not found')
      return generateDirectPDF(billData)
    }
    
    try {
      console.log('Starting PDF generation for bill:', billData)
      
      // Temporarily show the receipt element with proper positioning (same as test function)
      receiptElement.classList.remove('hidden')
      receiptElement.style.position = 'absolute'
      receiptElement.style.top = '0'
      receiptElement.style.left = '0'
      receiptElement.style.zIndex = '9999'
      receiptElement.style.visibility = 'visible'
      receiptElement.style.backgroundColor = 'white'
      receiptElement.style.width = '220px'
      receiptElement.style.height = 'auto'
      receiptElement.style.overflow = 'visible'
      
      // Force a reflow to ensure the element is properly rendered
      receiptElement.offsetHeight
      
      // Wait for rendering and ensure content is visible (same timing as test)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Receipt element dimensions:', {
        offsetWidth: receiptElement.offsetWidth,
        offsetHeight: receiptElement.offsetHeight,
        scrollWidth: receiptElement.scrollWidth,
        scrollHeight: receiptElement.scrollHeight,
        clientWidth: receiptElement.clientWidth,
        clientHeight: receiptElement.clientHeight
      })
      
      // Check if content is actually visible
      const contentCheck = receiptElement.innerHTML
      console.log('Receipt content length:', contentCheck.length)
      console.log('Receipt content preview:', contentCheck.substring(0, 200))
      
      const canvas = await html2canvas(receiptElement, {
        width: 220, // 58mm = 220px at 96 DPI
        height: receiptElement.scrollHeight,
        scale: 1, // Use scale 1 for better compatibility (same as test)
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true,
        logging: true, // Enable logging to debug
        removeContainer: false,
        ignoreElements: (element) => {
          // Don't ignore any elements
          return false
        }
      })

      console.log('Canvas generated:', { 
        width: canvas.width, 
        height: canvas.height,
        dataURL: canvas.toDataURL().substring(0, 100) + '...'
      })

      // Hide the element again
      receiptElement.classList.add('hidden')
      receiptElement.style.position = 'fixed'
      receiptElement.style.zIndex = '-1'
      receiptElement.style.visibility = 'hidden'

      const imgData = canvas.toDataURL('image/png', 1.0)
      console.log('Image data generated, length:', imgData.length)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [58, receiptElement.scrollHeight * 0.264583] // 58mm width
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 58, receiptElement.scrollHeight * 0.264583)
      console.log('PDF created successfully')
      
      return pdf
    } catch (error) {
      // Make sure to hide the element even if there's an error
      receiptElement.classList.add('hidden')
      receiptElement.style.position = 'fixed'
      receiptElement.style.zIndex = '-1'
      receiptElement.style.visibility = 'hidden'
      console.error('Error generating PDF with html2canvas:', error)
      
      // Fallback: Generate direct PDF
      console.log('Falling back to direct PDF generation')
      return generateDirectPDF(billData)
    }
  }

  const generateSimplePDF = (billData) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set font
    pdf.setFont('helvetica')
    
    // Header
    pdf.setFontSize(18)
    pdf.text('KIRAN BEAUTY SHOP', 105, 20, { align: 'center' })
    
    pdf.setFontSize(12)
    pdf.text('Beauty Products & Cosmetics', 105, 30, { align: 'center' })
    
    // Bill details
    pdf.setFontSize(10)
    pdf.text(`Bill No: #${billData.bill_no}`, 20, 50)
    pdf.text(`Date: ${new Date(billData.created_at).toLocaleDateString()}`, 20, 60)
    pdf.text(`Customer: ${billData.customer_name}`, 20, 70)
    
    // Items
    pdf.text('Items:', 20, 90)
    let yPosition = 100
    
    billData.items.forEach((item, index) => {
      pdf.text(`${item.product_name}`, 25, yPosition)
      pdf.text(`Qty: ${item.quantity} × ₹${item.price}`, 25, yPosition + 5)
      pdf.text(`Subtotal: ₹${item.subtotal.toFixed(2)}`, 25, yPosition + 10)
      yPosition += 20
    })
    
    // Total
    pdf.setFontSize(12)
    pdf.text(`TOTAL: ₹${billData.total_price.toFixed(2)}`, 20, yPosition + 10)
    
    // Footer
    pdf.setFontSize(10)
    pdf.text('Thank you for shopping!', 105, yPosition + 25, { align: 'center' })
    pdf.text('Visit again', 105, yPosition + 32, { align: 'center' })
    
    return pdf
  }

  const uploadPDFToStorage = async (pdfBlob, billId) => {
    try {
      const fileName = `bill_${billId}_${Date.now()}.pdf`
      const { data, error } = await supabase.storage
        .from('bill')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf'
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('bill')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading PDF to storage:', error)
      console.log('PDF storage not available. Bill will be created without PDF storage.')
      return null
    }
  }

  const confirmBill = async () => {
    if (!customerName.trim()) {
      alert('Please enter customer name')
      return
    }

    if (cartItems.length === 0) {
      alert('Please add at least one item to the bill')
      return
    }

    setLoading(true)

    try {
      // Create bill data
      const billData = {
        device_id: deviceId,
        customer_name: customerName.trim(),
        items: cartItems,
        total_price: getTotalPrice()
      }

      // Save bill to database
      const savedBill = await createBill(billData)

      // Generate PDF
      const pdf = await generatePDF(savedBill)
      const pdfBlob = pdf.output('blob')

      // Try to upload PDF to storage (optional)
      let pdfUrl = null
      try {
        pdfUrl = await uploadPDFToStorage(pdfBlob, savedBill.id)
        if (pdfUrl) {
          // Update bill with PDF URL if upload was successful
          await updateBill(savedBill.id, { pdf_url: pdfUrl })
          console.log('PDF uploaded successfully:', pdfUrl)
        }
      } catch (storageError) {
        console.log('PDF storage failed, but bill was created successfully')
      }

      // Set current bill (with or without PDF URL)
      const finalBill = pdfUrl ? { ...savedBill, pdf_url: pdfUrl } : savedBill
      setCurrentBill(finalBill)
      setShowReceipt(true)

      // Clear form
      setCartItems([])
      setCustomerName('')

    } catch (error) {
      console.error('Error creating bill:', error)
      alert('Error creating bill. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    try {
      console.log('Printing receipt...')
      
      const receiptElement = document.getElementById('receipt-print')
      if (!receiptElement) {
        console.error('Receipt element not found')
        alert('Receipt element not found. Please try again.')
        return
      }
      
      // Show the receipt element for printing using the show class
      receiptElement.classList.add('show')
      
      // Force a reflow to ensure the element is properly rendered
      receiptElement.offsetHeight
      
      // Wait a bit for the element to render
      setTimeout(() => {
        // Print the receipt
        window.print()
        
        // Hide the element again after printing
        setTimeout(() => {
          receiptElement.classList.remove('show')
        }, 1000)
      }, 500)
      
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('Error printing receipt. Please try again.')
    }
  }

  const closeReceipt = () => {
    setShowReceipt(false)
    setCurrentBill(null)
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-24">
        {/* Welcome Message */}

        {/* Page Title */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 sm:py-8 rounded-lg shadow-lg mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">Create New Bill</h1>
          <p className="text-purple-100 text-sm sm:text-lg">Kiran Beauty Shop</p>
        </div>

        {/* Add Item Form */}
        <div className="card bg-white shadow-lg border-0 rounded-xl">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
              <span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              Add Item to Bill
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product
                </label>
                <div className="relative">
                  <button
                    onClick={openProductModal}
                    className="w-full text-left px-3 sm:px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 flex items-center justify-between"
                  >
                    <span className={`${selectedProduct ? 'text-gray-900' : 'text-gray-500'} text-sm sm:text-base`}>
                      {selectedProduct || 'Select Product'}
                    </span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Add to Bill Button */}
            <div className="mt-4 sm:mt-6">
              <button
                onClick={addToCart}
                disabled={!selectedProduct || !price || quantity <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                <span className="flex items-center justify-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  Add to Bill
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        {cartItems.length > 0 && (
          <div className="card bg-white shadow-lg border-0 rounded-xl">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </span>
                Bill Items ({cartItems.length})
              </h2>
              
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200">
                    {editingItem === index ? (
                      // Edit Mode
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Product Name */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Product</label>
                            <input
                              type="text"
                              value={editProductName}
                              onChange={(e) => setEditProductName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                            />
                          </div>
                          
                          {/* Quantity */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Quantity</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                              />
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                                <button
                                  onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                  className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => setEditQuantity(editQuantity + 1)}
                                  className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Edit Actions */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-xs sm:text-sm flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-gray-900 text-sm sm:text-base block truncate">{item.product_name}</span>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                          <span className="font-bold text-base sm:text-lg text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => editCartItem(index)}
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center text-blue-600 transition-colors duration-200 flex-shrink-0"
                              title="Edit item"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-600 transition-colors duration-200 flex-shrink-0"
                              title="Remove item"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-lg">
                    <span>Total Amount:</span>
                    <span className="text-xl sm:text-2xl text-blue-600">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details */}
        {cartItems.length > 0 && (
          <div className="card bg-white shadow-lg border-0 rounded-xl mb-6 sm:mb-8">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Customer Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={confirmBill}
                    disabled={loading || !customerName.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    <span className="flex items-center justify-center text-sm sm:text-base">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Bill...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Confirm Bill
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Selection Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Select Product</h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Products List */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-96">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-500 text-base sm:text-lg">No products found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product.name)}
                        className="w-full text-left p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && currentBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Bill Created Successfully!</h3>
                  <button
                    onClick={closeReceipt}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Bill No: #{currentBill.bill_no}</p>
                    <p className="text-sm text-gray-600">Customer: {currentBill.customer_name}</p>
                    <p className="text-lg font-semibold">Total: ₹{currentBill.total_price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={printReceipt}
                      className="btn-primary flex-1"
                    >
                      Print Receipt
                    </button>
                    <button
                      onClick={closeReceipt}
                      className="btn-secondary flex-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Receipt for Printing */}
        {currentBill && (
          <div id="receipt-print" className="hidden fixed top-0 left-0 w-[58mm] p-2 text-center bg-white z-[-1]">
            <div className="w-[58mm] p-2">
              {/* Shop Name */}
              <h1 className="text-center font-bold text-lg">Kiran Beauty Shop</h1>
              <p className="text-center text-xs mb-2">--- Shine with Elegance ---</p>

              {/* Bill Info */}
              <div className="flex justify-between text-xs mb-2">
                <span>Bill No: #{currentBill.bill_no}</span>
                <span>Date: {new Date(currentBill.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="text-xs mb-2">
                Customer: {currentBill.customer_name}
              </div>

              {/* Items Table */}
              <table className="w-full text-xs mb-2">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBill.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₹{item.price}</td>
                      <td className="text-right">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-between border-t border-black pt-1 text-sm font-bold">
                <span>Total</span>
                <span>₹{currentBill.total_price.toFixed(2)}</span>
              </div>

              {/* Thank You Note */}
              <p className="text-center text-xs mt-2">✨ Thank you for shopping with us ✨</p>
              <p className="text-center text-xs">Visit Again 💖</p>
            </div>
          </div>
        )}

        {/* Test Receipt Element (Always Available) */}
        <div id="receipt-print-test" className="hidden fixed top-0 left-0 w-[58mm] p-2 text-center bg-white z-[-1]">
          <div className="w-[58mm] p-2">
            {/* Shop Name */}
            <h1 className="text-center font-bold text-lg">Kiran Beauty Shop</h1>
            <p className="text-center text-xs mb-2">--- Shine with Elegance ---</p>

            {/* Bill Info */}
            <div className="flex justify-between text-xs mb-2">
              <span>Bill No: #TEST001</span>
              <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="text-xs mb-2">
              Customer: Test Customer
            </div>

            {/* Items Table */}
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Test Product 1</td>
                  <td className="text-center">2</td>
                  <td className="text-right">₹100</td>
                  <td className="text-right">₹200</td>
                </tr>
                <tr>
                  <td>Test Product 2</td>
                  <td className="text-center">1</td>
                  <td className="text-right">₹150</td>
                  <td className="text-right">₹150</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-between border-t border-black pt-1 text-sm font-bold">
              <span>Total</span>
              <span>₹350</span>
            </div>

            {/* Thank You Note */}
            <p className="text-center text-xs mt-2">✨ Thank you for shopping with us ✨</p>
            <p className="text-center text-xs">Visit Again 💖</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </ProtectedRoute>
  )
} 