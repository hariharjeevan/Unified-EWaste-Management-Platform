"use client";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { useRouter } from "next/navigation";

const QRPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState("");
  const [qrCode, setQrCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Redirect if not logged in
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const generateQRCode = () => {
    if (!product || !user) return;
    const qrData = JSON.stringify({ product, user: user.uid });
    setQrCode(qrData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">QR Code Generator</h1>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <input
            type="text"
            placeholder="Enter Product Name"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="border p-2 rounded mb-4"
          />
          <button
            onClick={generateQRCode}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Generate QR Code
          </button>
          {qrCode && <QRCodeCanvas value={qrCode} className="mt-4" />}
        </>
      ) : (
        <p className="text-red-500">Please log in to generate a QR code.</p>
      )}
    </div>
  );
};

export default QRPage;
