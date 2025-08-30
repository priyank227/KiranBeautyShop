import { useState, useEffect } from "react";
import QRCode from "qrcode";

export default function ReceiptQR({ bill }) {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    if (bill?.total_price) {
      const upiUrl = `upi://pay?pa=q458853545@ybl&pn=Kiran%20Beauty%20Shop&am=${bill.total_price.toFixed(
        2
      )}&cu=INR`;

      QRCode.toDataURL(upiUrl, { width: 100, margin: 1 })
        .then((url) => {
          setQrSrc(url);
        })
        .catch((err) => console.error("QR error:", err));
    }
  }, [bill]);

  return (
    <div className="flex justify-center mb-4">
      {qrSrc ? (
        <img
          src={qrSrc}
          alt="UPI QR"
          className="w-[100px] h-[100px] border border-gray-300"
        />
      ) : (
        <p>Loading QR...</p>
      )}
    </div>
  );
}
