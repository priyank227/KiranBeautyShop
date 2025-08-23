'use client'

import { useState, useEffect } from 'react'
import { getBillsByDevice, getBillById } from '../../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function HistoryPage() {
  const [bills, setBills] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)
  const [showBillDetails, setShowBillDetails] = useState(false)

  useEffect(() => {
    // Get device ID from localStorage
    const storedDeviceId = localStorage.getItem('device_id')
    if (storedDeviceId) {
      setDeviceId(storedDeviceId)
      loadBills(storedDeviceId)
    } else {
      setLoading(false)
    }
  }, [])

  const loadBills = async (deviceId) => {
    try {
      setLoading(true)
      const billsData = await getBillsByDevice(deviceId)
      setBills(billsData)
    } catch (error) {
      console.error('Error loading bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewBillDetails = async (billId) => {
    try {
      const billData = await getBillById(billId)
      setSelectedBill(billData)
      setShowBillDetails(true)
    } catch (error) {
      console.error('Error loading bill details:', error)
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
      
      // Temporarily show the receipt element for printing
      receiptElement.classList.remove('hidden')
      receiptElement.style.position = 'static'
      receiptElement.style.zIndex = '9999'
      receiptElement.style.visibility = 'visible'
      receiptElement.style.backgroundColor = 'white'
      receiptElement.style.width = '58mm'
      receiptElement.style.height = 'auto'
      receiptElement.style.overflow = 'visible'
      receiptElement.style.margin = '0'
      receiptElement.style.padding = '2mm'
      
      // Wait a bit for the element to render
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Print the receipt
      window.print()
      
      // Hide the element again after printing
      setTimeout(() => {
        receiptElement.classList.add('hidden')
        receiptElement.style.position = 'fixed'
        receiptElement.style.zIndex = '-1'
        receiptElement.style.visibility = 'hidden'
        receiptElement.style.margin = ''
        receiptElement.style.padding = ''
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

  const closeBillDetails = () => {
    setShowBillDetails(false)
    setSelectedBill(null)
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
    
    // Populate the receipt element with test data
    populateReceiptElement(testBill)
    
    const receiptElement = document.getElementById('receipt-print-history')
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
        const receiptElement = document.getElementById('receipt-print-history')
        if (!receiptElement) {
          console.error('Test receipt element not found')
          return
        }
        
        // First, populate the receipt element with test data
        populateReceiptElement(testBill)
        
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

  if (!deviceId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Device ID Found</h2>
        <p className="text-gray-600 mb-6">Please create a bill first to generate a device ID.</p>
        <a href="/" className="btn-primary">
          Go to New Bill
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill History</h1>
        <p className="text-gray-600">Device ID: {deviceId}</p>
        <div className="mt-4 space-x-2">
          <button
            onClick={testReceiptDisplay}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Test Receipt Display
          </button>
          <button
            onClick={testPDFGeneration}
            className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Test PDF Generation
          </button>
        </div>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bills Found</h2>
          <p className="text-gray-600 mb-6">You haven't created any bills yet.</p>
          <a href="/" className="btn-primary">
            Create Your First Bill
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewBillDetails(bill.id)}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg font-semibold text-primary-600">#{bill.bill_no}</span>
                    <span className="text-sm text-gray-500">{formatDate(bill.created_at)}</span>
                  </div>
                  <p className="text-gray-900 font-medium">{bill.customer_name || 'No Customer Name'}</p>
                  <p className="text-sm text-gray-600">
                    {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                  </p>
                  {bill.pdf_url && (
                    <p className="text-xs text-green-600">✓ PDF Available</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">₹{bill.total_price.toFixed(2)}</p>
                  <div className="flex space-x-2 mt-2">
                    {bill.pdf_url ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadStoredPDF(bill.pdf_url, bill)
                        }}
                        className="btn-primary text-sm"
                      >
                        Download PDF
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadPDF(bill)
                        }}
                        className="btn-secondary text-sm"
                      >
                        Generate PDF
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        printReceipt(bill)
                      }}
                      className="btn-secondary text-sm"
                    >
                      Reprint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Details Modal */}
      {showBillDetails && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bill Details #{selectedBill.bill_no}</h3>
                <button
                  onClick={closeBillDetails}
                  className="text-gray-400 hover:text-gray-600"
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
                      className="btn-primary flex-1"
                    >
                      Download Stored PDF
                    </button>
                  ) : (
                    <button
                      onClick={() => downloadPDF(selectedBill)}
                      className="btn-primary flex-1"
                    >
                      Generate & Download PDF
                    </button>
                  )}
                  <button
                    onClick={() => printReceipt(selectedBill)}
                    className="btn-secondary flex-1"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={closeBillDetails}
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