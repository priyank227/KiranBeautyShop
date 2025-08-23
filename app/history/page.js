'use client'

import { useState, useEffect } from 'react'
import { getBills, supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function HistoryPage() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [filteredBills, setFilteredBills] = useState([])
  const [showBillDetails, setShowBillDetails] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)

  useEffect(() => {
    loadBills()
  }, [])

  useEffect(() => {
    filterBills()
  }, [bills, dateFilter, customStartDate, customEndDate])

  const loadBills = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBills(data || [])
      console.log('Bills loaded:', data)
    } catch (error) {
      console.error('Error loading bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBills = () => {
    let filtered = [...bills]

    if (dateFilter === 'today') {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      
      filtered = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate >= startOfDay && billDate < endOfDay
      })
    } else if (dateFilter === 'week') {
      const today = new Date()
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      filtered = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate >= startOfWeek
      })
    } else if (dateFilter === 'month') {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      filtered = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate >= startOfMonth
      })
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999) // End of day
      
      filtered = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate >= startDate && billDate <= endDate
      })
    }

    setFilteredBills(filtered)
  }

  const clearDateFilter = () => {
    setDateFilter('all')
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const viewBillDetails = (bill) => {
    setSelectedBill(bill)
    setShowBillDetails(true)
  }

  const closeBillDetails = () => {
    setShowBillDetails(false)
    setSelectedBill(null)
  }

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Today'
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          const end = new Date(customEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          return `${start} - ${end}`
        }
        return 'Custom Range'
      default:
        return 'All Time'
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

  const populateReceiptElement = (billData) => {
    try {
      // Populate bill info
      const billNoElement = document.getElementById('receipt-bill-no')
      const dateElement = document.getElementById('receipt-date')
      const customerElement = document.getElementById('receipt-customer')
      const totalElement = document.getElementById('receipt-total')
      const itemsElement = document.getElementById('receipt-items')
      
      if (billNoElement) billNoElement.textContent = billData.bill_no
      if (dateElement) dateElement.textContent = new Date(billData.created_at).toLocaleDateString('en-IN')
      if (customerElement) customerElement.textContent = billData.customer_name || 'No Customer Name'
      if (totalElement) totalElement.textContent = billData.total_price.toFixed(2)
      
      // Populate items
      if (itemsElement) {
        itemsElement.innerHTML = ''
        billData.items.forEach((item, index) => {
          const row = document.createElement('tr')
          row.innerHTML = `
            <td>${item.product_name}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${item.price}</td>
            <td class="text-right">₹${item.subtotal.toFixed(2)}</td>
          `
          itemsElement.appendChild(row)
        })
      }
      
      console.log('Receipt element populated with bill data:', billData)
    } catch (error) {
      console.error('Error populating receipt element:', error)
    }
  }

  const generatePDF = async (billData) => {
    try {
      console.log('Starting PDF generation for bill:', billData)
      
      // First, populate the receipt element with the bill data
      populateReceiptElement(billData)
      
      const receiptElement = document.getElementById('receipt-print-history')
      if (!receiptElement) {
        console.error('Receipt element not found')
        return generateDirectPDF(billData)
      }
      
      // Temporarily show the receipt element with proper positioning
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
      
      const canvas = await html2canvas(receiptElement, {
        width: 220, // 58mm = 220px at 96 DPI
        height: receiptElement.scrollHeight,
        scale: 1, // Use scale 1 for better compatibility
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
      const receiptElement = document.getElementById('receipt-print-history')
      if (receiptElement) {
        receiptElement.classList.add('hidden')
        receiptElement.style.position = 'fixed'
        receiptElement.style.zIndex = '-1'
        receiptElement.style.visibility = 'hidden'
      }
      
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

  const downloadPDF = async (billData) => {
    try {
      const pdf = await generatePDF(billData)
      const pdfBlob = pdf.output('blob')
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill_${billData.bill_no}_${billData.customer_name || 'customer'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Error downloading PDF. Please try again.')
    }
  }

  const printReceipt = async (billData) => {
    try {
      console.log('Printing receipt for bill:', billData)
      
      // First, populate the receipt element with the bill data
      populateReceiptElement(billData)
      
      const receiptElement = document.getElementById('receipt-print-history')
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
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Print the receipt
      window.print()
      
      // Hide the element again after printing
      setTimeout(() => {
        receiptElement.classList.remove('show')
      }, 1000)
      
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('Error printing receipt. Please try again.')
    }
  }

  const downloadStoredPDF = (pdfUrl, billData) => {
    if (!pdfUrl) {
      alert('No PDF available for this bill. Please regenerate the PDF.')
      return
    }

    // Create a download link for the stored PDF
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `bill_${billData.bill_no}_${billData.customer_name || 'customer'}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 sm:py-8 rounded-lg shadow-lg mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Bill History</h1>
        <p className="text-blue-100 text-sm sm:text-lg">View and manage all your bills</p>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white rounded-xl shadow-lg border-0 mb-6">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Filter by Date
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Date Filters */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    dateFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    dateFilter === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    dateFilter === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    dateFilter === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Custom Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="End Date"
                />
              </div>
              <button
                onClick={() => setDateFilter('custom')}
                disabled={!customStartDate || !customEndDate}
                className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  customStartDate && customEndDate
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Custom Filter
              </button>
            </div>

            {/* Filter Summary */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Results</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{filteredBills.length}</span> bills found
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getDateFilterLabel()}
                </div>
                {dateFilter !== 'all' && (
                  <button
                    onClick={clearDateFilter}
                    className="mt-2 w-full px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {/* Bills Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
            Bills ({filteredBills.length})
          </h2>
          {dateFilter !== 'all' && (
            <div className="text-sm text-gray-600">
              Showing {filteredBills.length} of {bills.length} total bills
            </div>
          )}
        </div>

        {filteredBills.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              {bills.length === 0 ? 'No Bills Found' : `No Bills Found for ${getDateFilterLabel()}`}
            </h2>
            <p className="text-gray-600 mb-6">
              {bills.length === 0 
                ? "You haven't created any bills yet."
                : `No bills found within the selected date range.`
              }
            </p>
            {bills.length === 0 ? (
              <a href="/" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Bill
              </a>
            ) : (
              <button
                onClick={clearDateFilter}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBills.map((bill) => (
              <div 
                key={bill.id} 
                className="card bg-white shadow-md border-0 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer hover:bg-gray-50"
                onClick={() => viewBillDetails(bill)}
              >
                <div className="p-3">
                  {/* Compact Bill Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        #{bill.bill_no}
                      </span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900 text-sm truncate max-w-32">
                          {bill.customer_name || 'No Customer Name'}
                        </h3>
                        <p className="text-xs text-gray-500">{formatDate(bill.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{bill.total_price.toFixed(2)}</p>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <span className="text-xs text-gray-600">
                          {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                        </span>
                        {bill.pdf_url && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="PDF Available"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {showBillDetails && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bill Details #{selectedBill.bill_no}</h3>
                <button
                  onClick={closeBillDetails}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Bill No:</span>
                    <p className="text-gray-900">#{selectedBill.bill_no}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <p className="text-gray-900">{formatDate(selectedBill.created_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>
                    <p className="text-gray-900">{selectedBill.customer_name || 'No Customer Name'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total:</span>
                    <p className="text-gray-900 font-semibold">₹{selectedBill.total_price.toFixed(2)}</p>
                  </div>
                </div>
                
                {selectedBill.pdf_url && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>PDF Available:</strong> This bill has a stored PDF that can be downloaded anytime.
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {selectedBill.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-gray-600 ml-2">
                            Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                        <span className="font-semibold">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  {selectedBill.pdf_url ? (
                    <button
                      onClick={() => downloadStoredPDF(selectedBill.pdf_url, selectedBill)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Download Stored PDF
                    </button>
                  ) : (
                    <button
                      onClick={() => downloadPDF(selectedBill)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Generate & Download PDF
                    </button>
                  )}
                  <button
                    onClick={() => printReceipt(selectedBill)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={closeBillDetails}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
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
      <div id="receipt-print-history" className="hidden fixed top-0 left-0 w-[58mm] p-2 text-center bg-white z-[-1]">
        <div className="w-[58mm] p-2">
          {/* Shop Name */}
          <h1 className="text-center font-bold text-lg">Kiran Beauty Shop</h1>
          <p className="text-center text-xs mb-2">--- Shine with Elegance ---</p>

          {/* Bill Info */}
          <div className="flex justify-between text-xs mb-2">
            <span>Bill No: #<span id="receipt-bill-no">-</span></span>
            <span>Date: <span id="receipt-date">-</span></span>
          </div>
          <div className="text-xs mb-2">
            Customer: <span id="receipt-customer">-</span>
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
            <tbody id="receipt-items">
              {/* Items will be populated dynamically */}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-between border-t border-black pt-1 text-sm font-bold">
            <span>Total</span>
            <span>₹<span id="receipt-total">-</span></span>
          </div>

          {/* Thank You Note */}
          <p className="text-center text-xs mt-2">✨ Thank you for shopping with us ✨</p>
          <p className="text-center text-xs">Visit Again 💖</p>
        </div>
      </div>
    </div>
  )
} 