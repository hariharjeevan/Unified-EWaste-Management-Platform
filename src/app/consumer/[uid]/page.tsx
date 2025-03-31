"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import Navbar from "@/components/Navbar";
import { Html5QrcodeScanner } from "html5-qrcode";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Consumer = () => {
  interface Product {
    id?: string;
    name: string;
    serialNumber: string;
    category: string;
    recyclability: string;
    recoverableMetals: string;
    secretKey: string;
    manufacturerId: string;
    registered?: boolean;
  }

  interface RegisterResponse {
    success: boolean;
    message?: string;
  }

  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [manufacturerUID, setManufacturerUID] = useState<string | null>(null);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchScannedProducts(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchScannedProducts = async (userId: string) => {
    try {
      console.log("Fetching scanned products for user:", userId);

      const userScansRef = collection(db, "consumers", userId, "scannedProducts");
      const snapshot = await getDocs(userScansRef);

      const products: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        if (!data || Object.keys(data).length === 0) {
          console.warn(`Skipping empty or invalid document: ${doc.id}`);
          return null; // Skip invalid or empty documents
        }
        return {
          id: doc.id,
          ...data,
        } as Product;
      }).filter((product) => product !== null) as Product[]; // Filter out null values

      const verifiedProducts: Product[] = [];

      for (const product of products) {
        // Validate manufacturerId and serialNumber
        if (!product.manufacturerId || !product.serialNumber) {
          console.error("Invalid product data:", product);
          continue; // Skip invalid products
        }

        const manufacturerRef = doc(
          db,
          "manufacturers",
          product.manufacturerId,
          "products",
          product.serialNumber
        );

        const manufacturerSnap = await getDoc(manufacturerRef);

        if (manufacturerSnap.exists()) {
          // Product exists in the manufacturer database, add to verified list
          verifiedProducts.push(product);
        } else {
          // Product does not exist in the manufacturer database, delete it
          console.warn(
            `Product ${product.serialNumber} not found in manufacturer database. Deleting from consumer database.`
          );
          const productRef = doc(
            db,
            "consumers",
            userId,
            "scannedProducts",
            product.id!
          );
          await deleteDoc(productRef);
        }
      }

      console.log("Verified products:", verifiedProducts);

      setScannedProducts(verifiedProducts);
    } catch (error) {
      console.error("Error fetching scanned products:", error);
      setErrorMessage("Failed to load registered products.");
    }
  };

  const startQRScanner = () => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 300, height: 300 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        scanner.clear();
        setErrorMessage(null);
        setProductDetails(null);

        try {
          const parts = decodedText.split("-");
          if (parts.length !== 2) {
            setErrorMessage("Invalid QR Code format.");
            return;
          }

          const [manufacturerUID, serialNumber] = parts;
          setManufacturerUID(manufacturerUID);

          const productRef = doc(
            db,
            "manufacturers",
            manufacturerUID,
            "products",
            serialNumber
          );
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data() as Product;
            setProductDetails(productData);
          } else {
            setErrorMessage("No product found for this QR code.");
          }
        } catch (error) {
          console.error("Error retrieving product details:", error);
          setErrorMessage("Failed to fetch product details.");
        }
      },
      (errorMessage) => {
        console.warn("QR Scan failed:", errorMessage);
      }
    );
  };

  const handleRegisterProduct = async () => {
    if (!productDetails || !manufacturerUID || !user) {
      setErrorMessage("Missing product details or user information.");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const registerProduct = httpsCallable<
        {
          manufacturerId: string;
          productId: string;
          serialNumber: string;
          modelNumber: string;
          secretKey: string;
        },
        RegisterResponse
      >(functions, "verifyAndRegisterConsumer");

      const response: HttpsCallableResult<RegisterResponse> =
        await registerProduct({
          manufacturerId: manufacturerUID,
          productId: productDetails.serialNumber,
          serialNumber: productDetails.serialNumber,
          modelNumber: productDetails.name,
          secretKey: secretKey,
        });

      if (response.data.success) {
        const userScansRef = collection(
          db,
          "consumers",
          user.uid,
          "scannedProducts"
        );
        await setDoc(doc(userScansRef, productDetails.serialNumber), {
          ...productDetails,
          registered: true,
        });

        alert("Product registered successfully!");
        setSecretKey("");
        await fetchScannedProducts(user.uid);
      } else {
        setErrorMessage(response.data.message || "Registration failed.");
      }
    } catch (error: unknown) {
      console.error("Error registering product:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to register product."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) {
      setErrorMessage("User is not authenticated.");
      return;
    }

    try {
      // Reference to the product in the consumer database
      const productRef = doc(
        db,
        "consumers",
        user.uid,
        "scannedProducts",
        productId
      );

      // Delete the product from the consumer database
      await deleteDoc(productRef);

      alert("Product deleted successfully!");
      await fetchScannedProducts(user.uid); // Refresh the list of scanned products
    } catch (error) {
      console.error("Error deleting product:", error);
      setErrorMessage("Failed to delete product.");
    }
  };

  return (
    <>
      <Navbar links={[{ label: "Home", href: "/" }]} />
      <div className="min-h-screen flex flex-col items-center bg-gray-100">
        <div className="relative flex flex-col items-center w-full max-w-2xl mt-[10px]">
          <Image
            src="/Cleaning Earth Environment.svg"
            alt="E-Waste Management"
            width={600}
            height={400}
            className="w-3/4 md:w-1/2 h-auto rounded-lg shadow-md"
          />
          {user && (
            <h2 className="text-xl text-black font-semibold mt-2">
              Hello, {user.email || "User"}
            </h2>
          )}
        </div>
        {scannedProducts.length > 0 ? (
          <div className="mt-6 w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-300">
            <h3 className="text-lg text-black font-semibold border-b pb-2">
              Registered Products
            </h3>
            {scannedProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center mt-2"
              >
                <p
                  className="text-black cursor-pointer underline"
                  onClick={() => setShowProductDetails(product)} // Set the selected product
                >
                  <strong>{product.name}</strong> - {product.serialNumber}
                </p>
                <button
                  onClick={() => handleDeleteProduct(product.id!)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-300">
            <h3 className="text-lg text-black font-semibold border-b pb-2">
              No Products Registered
            </h3>
            <p className="text-gray-500">You have not registered any products yet.</p>
          </div>
        )}

        <h2 className="text-xl text-black font-semibold mt-4">
          Scan Product QR Code
        </h2>
        <div ref={scannerRef} id="qr-reader" className="mt-4"></div>
        <button
          onClick={startQRScanner}
          className="bg-green-600 text-white px-4 py-2 mt-4 rounded"
        >
          Start Scanner
        </button>
        {showProductDetails && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">
                Product Details
              </h3>
              <p className="text-black">
                <strong>Name:</strong> {showProductDetails.name}
              </p>
              <p className="text-black">
                <strong>Serial Number:</strong> {showProductDetails.serialNumber}
              </p>
              <p className="text-black">
                <strong>Category:</strong> {showProductDetails.category}
              </p>
              <p className="text-black">
                <strong>Recyclability:</strong> {showProductDetails.recyclability}
              </p>
              <p className="text-black">
                <strong>Recoverable Metals:</strong> {showProductDetails.recoverableMetals}
              </p>
              <p className="text-black">
                <strong>Registered:</strong> {showProductDetails.registered ? "Yes" : "No"}
              </p>
              <button
                onClick={() => setShowProductDetails(null)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}

        {productDetails && (
          <div className="mt-6 w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-300">
            <h3 className="text-lg text-black font-semibold border-b pb-2">
              Product Details
            </h3>
            <p className="text-black mt-2">
              <strong>Name:</strong> {productDetails.name}
            </p>
            <p className="text-black">
              <strong>Serial Number:</strong> {productDetails.serialNumber}
            </p>
            <p className="text-black">
              <strong>Category:</strong> {productDetails.category}
            </p>
            <p className="text-black">
              <strong>Recyclability:</strong> {productDetails.recyclability}
            </p>
            <p className="text-black">
              <strong>Recoverable Metals:</strong>{" "}
              {productDetails.recoverableMetals}
            </p>

            {/* Secret Key Input */}
            <div className="mt-4">
              <label className="block text-black font-semibold">
                Enter Secret Key:
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="mt-2 w-full px-4 py-2 border rounded-lg text-black"
                  placeholder="Enter Secret Key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                >
                  {showSecretKey ? (
                    <span className="text-lg p-1 flex items-center justify-center"><AiOutlineEyeInvisible size={20} /></span>
                  ) : (
                    <span className="text-lg p-1 flex items-center justify-center"><AiOutlineEye size={20} /></span>
                  )}
                </button>
              </div>
              <button
                onClick={handleRegisterProduct}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={loading}
                style={{ minWidth: "150px" }}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : (
                  "Register Product"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Consumer;
