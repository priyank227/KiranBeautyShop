"use client";

import { useState, useEffect } from "react";
import { getProducts, createBill, updateBill, supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNav from "./components/BottomNav";
import { useAuth } from "./contexts/AuthContext";
import QRCode from "qrcode";
import ReceiptQR from "./components/ReceiptQR";

export default function HomePage() {
  const { username, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editProductName, setEditProductName] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState("");
  const [lastSelectedProduct, setLastSelectedProduct] = useState("");
  const [lastSelectedPrice, setLastSelectedPrice] = useState("");
  const [repeatItemChecked, setRepeatItemChecked] = useState(false);

  useEffect(() => {
    // Generate or retrieve device ID
    const storedDeviceId = localStorage.getItem("device_id");
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = "device_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("device_id", newDeviceId);
      setDeviceId(newDeviceId);
    }

    // Load products
    loadProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const addToCart = () => {
    if (!selectedProduct || !price || quantity <= 0) {
      alert("Please fill in all fields correctly");
      return;
    }

    const newItem = {
      product_name: selectedProduct,
      quantity: quantity,
      price: parseFloat(price),
      subtotal: quantity * parseFloat(price),
    };

    setCartItems([...cartItems, newItem]);

    // Always store the last selected product and price for repeat functionality
    setLastSelectedProduct(selectedProduct);
    setLastSelectedPrice(price);

    // Clear the form for next item
    setSelectedProduct("");
    setQuantity(1);
    setPrice("");

    // If repeat is checked, automatically fill the product name for the next item
    if (repeatItemChecked && lastSelectedProduct) {
      setSelectedProduct(lastSelectedProduct);
    }
  };

  const handleRepeatCheckboxChange = (checked) => {
    setRepeatItemChecked(checked);

    if (checked) {
      // If checking and we have a last selected product, automatically fill it
      if (lastSelectedProduct) {
        setSelectedProduct(lastSelectedProduct);
      } else {
        // If no last selected product yet, show a message
        alert("Please add an item first to enable repeat functionality.");
        setRepeatItemChecked(false); // Uncheck the checkbox
        return;
      }
    } else {
      // If unchecking, clear the form but keep the last selected product for future use
      setSelectedProduct("");
      setPrice("");
      setQuantity(1);
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const editCartItem = (index) => {
    const item = cartItems[index];
    setEditingItem(index);
    setEditProductName(item.product_name);
    setEditQuantity(item.quantity);
    setEditPrice(item.price.toString());
  };

  const saveEdit = () => {
    if (!editProductName.trim() || !editPrice || editQuantity <= 0) {
      alert("Please fill in all fields correctly");
      return;
    }

    const newCart = [...cartItems];
    newCart[editingItem] = {
      ...newCart[editingItem],
      product_name: editProductName.trim(),
      quantity: editQuantity,
      price: parseFloat(editPrice),
      subtotal: editQuantity * parseFloat(editPrice),
    };

    setCartItems(newCart);
    setEditingItem(null);
    setEditProductName("");
    setEditQuantity(1);
    setEditPrice("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditProductName("");
    setEditQuantity(1);
    setEditPrice("");
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const selectProduct = (productName) => {
    setSelectedProduct(productName);
    setShowProductModal(false);
    setSearchTerm("");
  };

  const openProductModal = () => {
    setShowProductModal(true);
    setSearchTerm("");
  };

  const generateDirectPDF = (billData) => {
    try {
      console.log("Generating direct PDF for:", billData);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set font
      pdf.setFont("helvetica");

      // Header
      pdf.setFontSize(18);
      pdf.text("Kiran Beauty Shop", 105, 20, { align: "center" });

      pdf.setFontSize(12);
      pdf.text("--- Shine with Elegance ---", 105, 30, { align: "center" });

      // Bill details
      pdf.setFontSize(10);
      pdf.text(`Bill No: #${billData.bill_no}`, 20, 50);
      pdf.text(
        `Date: ${new Date(billData.created_at).toLocaleDateString("en-IN")}`,
        20,
        60
      );
      pdf.text(`Customer: ${billData.customer_name}`, 20, 70);

      // Items table header
      pdf.text("Items:", 20, 90);
      pdf.line(20, 95, 190, 95); // Header line

      // Table headers
      pdf.text("Item", 25, 105);
      pdf.text("Qty", 100, 105);
      pdf.text("Price", 130, 105);
      pdf.text("Subtotal", 160, 105);

      pdf.line(20, 110, 190, 110); // Separator line

      let yPosition = 120;

      // Items
      billData.items.forEach((item, index) => {
        pdf.text(item.product_name, 25, yPosition);
        pdf.text(item.quantity.toString(), 100, yPosition);
        pdf.text(`₹${item.price}`, 130, yPosition);
        pdf.text(`₹${item.subtotal.toFixed(2)}`, 160, yPosition);
        yPosition += 15;
      });

      // Total line
      pdf.line(20, yPosition + 5, 190, yPosition + 5);
      pdf.setFontSize(12);
      pdf.text("Total:", 20, yPosition + 15);
      pdf.text(`₹${billData.total_price.toFixed(2)}`, 160, yPosition + 15);

      // Footer
      pdf.setFontSize(10);
      pdf.text("✨ Thank you for shopping with us ✨", 105, yPosition + 35, {
        align: "center",
      });
      pdf.text("Visit Again 💖", 105, yPosition + 42, { align: "center" });

      console.log("Direct PDF generated successfully");
      return pdf;
    } catch (error) {
      console.error("Error generating direct PDF:", error);
      throw error;
    }
  };

  const generatePDF = async (billData) => {
    const receiptElement = document.getElementById("receipt-print");

    if (!receiptElement) {
      console.error("Receipt element not found");
      return generateDirectPDF(billData);
    }

    try {
      console.log("Starting PDF generation for bill:", billData);

      // Temporarily show the receipt element with proper positioning (same as test function)
      receiptElement.classList.remove("hidden");
      receiptElement.style.position = "absolute";
      receiptElement.style.top = "0";
      receiptElement.style.left = "0";
      receiptElement.style.zIndex = "9999";
      receiptElement.style.visibility = "visible";
      receiptElement.style.backgroundColor = "white";
      receiptElement.style.width = "220px";
      receiptElement.style.height = "auto";
      receiptElement.style.overflow = "visible";

      // Force a reflow to ensure the element is properly rendered
      receiptElement.offsetHeight;

      // Wait for rendering and ensure content is visible (same timing as test)
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Receipt element dimensions:", {
        offsetWidth: receiptElement.offsetWidth,
        offsetHeight: receiptElement.offsetHeight,
        scrollWidth: receiptElement.scrollWidth,
        scrollHeight: receiptElement.scrollHeight,
        clientWidth: receiptElement.clientWidth,
        clientHeight: receiptElement.clientHeight,
      });

      // Check if content is actually visible
      const contentCheck = receiptElement.innerHTML;
      console.log("Receipt content length:", contentCheck.length);
      console.log("Receipt content preview:", contentCheck.substring(0, 200));

      const canvas = await html2canvas(receiptElement, {
        width: 560, // 148mm = 560px at 96 DPI
        height: receiptElement.scrollHeight,
        scale: 1, // Use scale 1 for better compatibility (same as test)
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: true,
        logging: true, // Enable logging to debug
        removeContainer: false,
        ignoreElements: (element) => {
          // Don't ignore any elements
          return false;
        },
      });

      console.log("Canvas generated:", {
        width: canvas.width,
        height: canvas.height,
        dataURL: canvas.toDataURL().substring(0, 100) + "...",
      });

      // Hide the element again
      receiptElement.classList.add("hidden");
      receiptElement.style.position = "fixed";
      receiptElement.style.zIndex = "-1";
      receiptElement.style.visibility = "hidden";

      const imgData = canvas.toDataURL("image/png", 1.0);
      console.log("Image data generated, length:", imgData.length);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [148, receiptElement.scrollHeight * 0.264583], // 148mm width
      });

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        148,
        receiptElement.scrollHeight * 0.264583
      );
      console.log("PDF created successfully");

      return pdf;
    } catch (error) {
      // Make sure to hide the element even if there's an error
      receiptElement.classList.add("hidden");
      receiptElement.style.position = "fixed";
      receiptElement.style.zIndex = "-1";
      receiptElement.style.visibility = "hidden";
      console.error("Error generating PDF with html2canvas:", error);

      // Fallback: Generate direct PDF
      console.log("Falling back to direct PDF generation");
      return generateDirectPDF(billData);
    }
  };

  const generateSimplePDF = (billData) => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set font
    pdf.setFont("helvetica");

    // Header
    pdf.setFontSize(18);
    pdf.text("KIRAN BEAUTY SHOP", 105, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.text("Beauty Products & Cosmetics", 105, 30, { align: "center" });

    // Bill details
    pdf.setFontSize(10);
    pdf.text(`Bill No: #${billData.bill_no}`, 20, 50);
    pdf.text(
      `Date: ${new Date(billData.created_at).toLocaleDateString()}`,
      20,
      60
    );
    pdf.text(`Customer: ${billData.customer_name}`, 20, 70);

    // Items
    pdf.text("Items:", 20, 90);
    let yPosition = 100;

    billData.items.forEach((item, index) => {
      pdf.text(`${item.product_name}`, 25, yPosition);
      pdf.text(`Qty: ${item.quantity} × ₹${item.price}`, 25, yPosition + 5);
      pdf.text(`Subtotal: ₹${item.subtotal.toFixed(2)}`, 25, yPosition + 10);
      yPosition += 20;
    });

    // Total
    pdf.setFontSize(12);
    pdf.text(`TOTAL: ₹${billData.total_price.toFixed(2)}`, 20, yPosition + 10);

    // Footer
    pdf.setFontSize(10);
    pdf.text("Thank you for shopping!", 105, yPosition + 25, {
      align: "center",
    });
    pdf.text("Visit again", 105, yPosition + 32, { align: "center" });

    return pdf;
  };

  const uploadPDFToStorage = async (pdfBlob, billId) => {
    try {
      const fileName = `bill_${billId}_${Date.now()}.pdf`;
      const { data, error } = await supabase.storage
        .from("bill")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("bill").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading PDF to storage:", error);
      console.log(
        "PDF storage not available. Bill will be created without PDF storage."
      );
      return null;
    }
  };

  const confirmBill = async () => {
    if (cartItems.length === 0) {
      alert("Please add at least one item to the bill");
      return;
    }

    setLoading(true);

    try {
      // Create bill data - customer name is now optional
      const billData = {
        device_id: deviceId,
        customer_name: customerName.trim() || "Walk-in Customer", // Default name if empty
        items: cartItems,
        total_price: getTotalPrice(),
      };

      // Save bill to database
      const savedBill = await createBill(billData);

      // Generate PDF
      const pdf = await generatePDF(savedBill);
      const pdfBlob = pdf.output("blob");

      // Try to upload PDF to storage (optional)
      let pdfUrl = null;
      try {
        pdfUrl = await uploadPDFToStorage(pdfBlob, savedBill.id);
        if (pdfUrl) {
          // Update bill with PDF URL if upload was successful
          await updateBill(savedBill.id, { pdf_url: pdfUrl });
          console.log("PDF uploaded successfully:", pdfUrl);
        }
      } catch (storageError) {
        console.log("PDF storage failed, but bill was created successfully");
      }

      // Set current bill (with or without PDF URL)
      const finalBill = pdfUrl ? { ...savedBill, pdf_url: pdfUrl } : savedBill;
      setCurrentBill(finalBill);
      setShowReceipt(true);

      // Clear form
      setCartItems([]);
      setCustomerName("");
    } catch (error) {
      console.error("Error creating bill:", error);
      alert("Error creating bill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = async (billData) => {
    try {
      console.log("Printing receipt for bill:", billData);

      // First, populate the receipt element with the bill data
      populateReceiptElement(billData);

      const receiptElement = document.getElementById("receipt-print");
      if (!receiptElement) {
        console.error("Receipt element not found");
        alert("Receipt element not found. Please try again.");
        return;
      }

      // Create a new print window with only the receipt content
      const printWindow = window.open("", "_blank", "width=300,height=600");
      if (printWindow) {
        // Get the receipt HTML content
        const receiptContent = receiptElement.innerHTML;

        // Create a clean HTML document for printing
        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt Print - Bill #${billData.bill_no}</title>
          <style>
            @media print {
              body {
                width: 148mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 2mm !important;
                font-family: Arial, sans-serif !important;
                font-size: 14px !important;
                line-height: 1.4 !important;
                background: white !important;
                color: black !important;
              }
              
              .print-controls {
                display: none !important;
              }
              
              table {
                border-collapse: collapse !important;
                width: 100% !important;
                font-size: 14px !important;
              }
              
              th, td {
                border: 1px solid black !important;
                padding: 2mm !important;
                text-align: left !important;
              }
              
              th {
                font-weight: bold !important;
                background-color: #f3f4f6 !important;
              }
              
              h1 {
                font-size: 18px !important;
                margin: 3mm 0 !important;
                font-weight: bold !important;
                text-align: center !important;
              }
              
              p {
                font-size: 14px !important;
                margin: 2mm 0 !important;
                text-align: center !important;
              }
              
              .receipt-container {
                width: 148mm !important;
                max-width: 148mm !important;
                margin: 0 auto !important;
              }
              
              img {
                max-width: 100% !important;
                height: auto !important;
              }
            }
            
            /* Screen styles for preview */
            body {
              width: 148mm;
              height: 210mm;
              margin: 0 auto;
              padding: 2mm;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.4;
              background: white;
              color: black;
            }
            
            .print-controls {
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 1000;
            }
            
            .print-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin-right: 10px;
            }
            
            .print-button:hover {
              background: #0056b3;
            }
            
            .cancel-button {
              background: #dc3545;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            
            .cancel-button:hover {
              background: #c82333;
            }
            
            .receipt-container {
              width: 148mm;
              max-width: 148mm;
              margin: 0 auto;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
              font-size: 13px;
            }
            
            table th{
             font-size: 14px;
            }
            
            th, td {
              border: 1px solid black;
              padding: 2px !important;
              text-align: left;
            }
            
            th {
              font-weight: bold;
              background-color: #f3f4f6;
            }
            
            h1 {
              font-size: 18px;
              margin: 3mm 0;
              font-weight: bold;
              text-align: center;
            }
            
            p {
              font-size: 14px;
              margin: 2mm 0;
              text-align: center;
            }
            
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="cancel-button" onclick="window.close()">Cancel</button>
          </div>
          <div class="receipt-container">
            ${receiptContent}
          </div>
        </body>
        </html>
      `);

        printWindow.document.close();

        // Wait for content to load then focus the window
        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        // Fallback if popup is blocked - show print modal instead
        setPrintBillData(billData);
        setShowPrintModal(true);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("Error printing receipt. Please try again.");
    }
  };

  // Add this function to populate the receipt element
  const populateReceiptElement = (billData) => {
    try {
      // Populate bill info
      const billNoElement = document.getElementById("receipt-bill-no");
      const dateElement = document.getElementById("receipt-date");
      const customerElement = document.getElementById("receipt-customer");
      const totalElement = document.getElementById("receipt-total");
      const itemsElement = document.getElementById("receipt-items");

      if (billNoElement) billNoElement.textContent = billData.bill_no;
      if (dateElement)
        dateElement.textContent = new Date(
          billData.created_at
        ).toLocaleDateString("en-IN");
      if (customerElement)
        customerElement.textContent =
          billData.customer_name || "No Customer Name";
      if (totalElement)
        totalElement.textContent = billData.total_price.toFixed(2);

      // Populate items with proper styling
      if (itemsElement) {
        itemsElement.innerHTML = "";
        billData.items.forEach((item, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td class="text-center py-[2px]">${index + 1}</td>
          <td class="py-[2px]">${item.product_name}</td>
          <td class="text-center py-[2px]">${item.quantity}</td>
          <td class="text-right py-[2px]">₹${Number(item.price).toFixed(2)}</td>
          <td class="text-right py-[2px]">₹${Number(item.subtotal).toFixed(
            2
          )}</td>
        `;
          itemsElement.appendChild(row);
        });
      }

      // Generate QR code
      const upiId = "q458853545@ybl"; // Your UPI ID
      const amount = billData.total_price.toFixed(2);
      const upiUrl = `upi://pay?pa=${upiId}&pn=Kiran%20Beauty%20Shop&am=${50}&cu=INR`;

      QRCode.toDataURL(
        upiUrl,
        {
          width: 150,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        },
        function (error, url) {
          if (error) {
            console.error("QR Code generation error:", error);
          } else {
            const qrImg = document.getElementById("qrImage");
            if (qrImg) {
              qrImg.src = url; // यहाँ पर QR डाल देंगे
              qrImg.style.display = "block"; // ensure visible
            } else {
              console.warn("QR image element not found in receipt!");
            }
          }
        }
      );
      console.log("Receipt element populated with bill data:", billData);
    } catch (error) {
      console.error("Error populating receipt element:", error);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setCurrentBill(null);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-24">
        {/* Welcome Message */}

        {/* Page Title */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 sm:py-8 rounded-lg shadow-lg mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            Create New Bill
          </h1>
          <p className="text-purple-100 text-sm sm:text-lg">
            Kiran Beauty Shop
          </p>
        </div>

        {/* Add Item Form */}
        <div className="card bg-white shadow-lg border-0 rounded-xl">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </span>
                Add Item to Bill
              </div>
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
                    <span
                      className={`${
                        selectedProduct ? "text-gray-900" : "text-gray-500"
                      } text-sm sm:text-base`}
                    >
                      {selectedProduct || "Select Product"}
                    </span>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
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
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Repeat Item Checkbox */}
            <div className="mt-4 sm:mt-6 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatItemChecked}
                  onChange={(e) => handleRepeatCheckboxChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto-repeat product name
                </span>
              </label>
              {repeatItemChecked && lastSelectedProduct && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                    ✓ Repeat Active
                  </span>
                  <span className="text-xs text-gray-500">
                    Last: {lastSelectedProduct}
                  </span>
                </div>
              )}
            </div>

            {/* Add to Bill Button */}
            <div className="mt-4 sm:mt-6">
              <button
                onClick={addToCart}
                disabled={!selectedProduct || !price || quantity <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                <span className="flex items-center justify-center text-sm sm:text-base">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
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
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                  </svg>
                </span>
                Bill Items ({cartItems.length})
              </h2>

              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                  >
                    {editingItem === index ? (
                      // Edit Mode
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Product Name */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              Product
                            </label>
                            <input
                              type="text"
                              value={editProductName}
                              onChange={(e) =>
                                setEditProductName(e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              Quantity
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="1"
                                value={editQuantity}
                                onChange={(e) =>
                                  setEditQuantity(parseInt(e.target.value) || 1)
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                              />
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                                <button
                                  onClick={() =>
                                    setEditQuantity(
                                      Math.max(1, editQuantity - 1)
                                    )
                                  }
                                  className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() =>
                                    setEditQuantity(editQuantity + 1)
                                  }
                                  className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
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
                              <span className="font-semibold text-gray-900 text-sm sm:text-base block truncate">
                                {item.product_name}
                              </span>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                          <span className="font-bold text-base sm:text-lg text-gray-900">
                            ₹{item.subtotal.toFixed(2)}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => editCartItem(index)}
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center text-blue-600 transition-colors duration-200 flex-shrink-0"
                              title="Edit item"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-600 transition-colors duration-200 flex-shrink-0"
                              title="Remove item"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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
                    <span className="text-xl sm:text-2xl text-blue-600">
                      ₹{getTotalPrice().toFixed(2)}
                    </span>
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
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                Customer Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name{" "}
                    <span className="text-gray-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder="Enter customer name (or leave blank for walk-in)"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={confirmBill}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    <span className="flex items-center justify-center text-sm sm:text-base">
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating Bill...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg h-[85vh] overflow-y-auto shadow-2xl mt-10">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Select Product
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Products List */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-96">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-gray-500 text-base sm:text-lg">
                      No products found
                    </p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your search terms
                    </p>
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
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
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
                  <h3 className="text-lg font-semibold">
                    Bill Created Successfully!
                  </h3>
                  <button
                    onClick={closeReceipt}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Bill No: #{currentBill.bill_no}
                    </p>
                    <p className="text-sm text-gray-600">
                      Customer: {currentBill.customer_name}
                    </p>
                    <p className="text-lg font-semibold">
                      Total: ₹{currentBill.total_price.toFixed(2)}
                    </p>
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
          <div
            id="receipt-print"
            className="hidden fixed top-0 left-0 w-[148mm] h-[210mm] p-4 bg-white text-black z-[-1]"
          >
            {" "}
            <div className="w-[148mm] h-[210mm] p-4">
              {" "}
              {/* First line: Since 1992 + KHODALDHAM + Mo. */}{" "}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "10px",
                }}
              >
                {" "}
                <span>Since 1992</span>{" "}
                <span className="font-bold">KHODALDHAM</span>{" "}
                <span>Mo.: 8347134004</span>{" "}
              </div>
              {/* Second line: Logo + Shop Name */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingBottom: "5px",
                }}
              >
                <img
                  src="apple-touch-icon.png"
                  height={50}
                  width={50}
                  alt="Logo"
                  className="mr-2"
                />
                <span
                  className="font-bold text-2xl"
                  style={{
                    paddingTop: "19px",
                    marginLeft: "-8px",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  iran Beauty Shop
                </span>
              </div>
              {/* Third line: M/s (Customer) + Dt. (Date) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "5px",
                }}
              >
                <span>
                  Name:-{" "}
                  <span className="font-semibold">
                    {currentBill.customer_name}
                  </span>
                </span>
                <span>
                  Dt.:-{" "}
                  {new Date(currentBill.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              {/* Fourth line: Bill No */}
              <div className="text-sm mb-3" style={{ marginBottom: "3px" }}>
                <span>
                  No.:-{" "}
                  <span className="font-semibold">#{currentBill.bill_no}</span>
                </span>
              </div>
              {/* Items table */}
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-1">Sr.</th>
                    <th className="text-left py-2 px-1">Item</th>
                    <th className="text-center py-2 px-1">Qty</th>
                    <th className="text-right py-2 px-1">Price</th>
                    <th className="text-right py-2 px-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBill.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 px-1">{index + 1}</td>
                      <td className="py-2 px-1">{item.product_name}</td>
                      <td className="text-center py-2 px-1">{item.quantity}</td>
                      <td className="text-right py-2 px-1">
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td className="text-right py-2 px-1">
                        ₹{Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-3 px-1"></td>
                    <td
                      colSpan={3}
                      className="text-right font-bold py-3 px-1"
                      style={{ fontWeight: "bold" }}
                    >
                      Total
                    </td>
                    <td
                      className="text-right font-bold py-3 px-1"
                      style={{ fontWeight: "bold" }}
                    >
                      ₹{Number(currentBill.total_price).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {/* Fixed Rate, No Return, No Replacement */}
              <div
                className="text-sm text-center mb-4"
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  paddingTop: "20px",
                }}
              >
                <span className="font-semibold mb-1">✨ Fixed Rate ✨</span>
                <span className="mb-1">🚫 No Return</span>
                <span>🚫 No Replacement</span>
              </div>
              {/* QR Code */}
              <div style={{
                textAlign: "center",
                marginBottom: "10px",
                marginTop: "10px",
              }}>
                <div style={{ fontSize: "11px", marginBottom: "5px" }}>
                Scan to pay via UPI
              </div>
              <div className="mb-4" style={{"display":"flex","justifyContent":"center"}}>
                <ReceiptQR bill={currentBill} />
              </div>
              <div style={{ fontSize: "10px", marginTop: "5px" }}>
                Payment ID: q458853545@ybl
              </div>
              </div>
              {/* Footer with address and Instagram */}
              <div
                className="text-xs"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "15px",
                  marginTop: "15px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "4px" }}>📍</span>
                    <span>3, Gundawadi, Rajkot - 360002</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "4px" }}>
                      <img
                        src="instagram.png"
                        alt="Instagram"
                        width="20"
                        height="20"
                        style={{ paddingTop: "5px" }}
                      />
                    </span>
                    <span>kiran_beauty_rajkot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </ProtectedRoute>
  );
}
