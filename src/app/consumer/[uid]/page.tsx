"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Navbar from "@/components/Navbar";
import { Html5QrcodeScanner } from "html5-qrcode";

const Consumer = () => {
    const [user, setUser] = useState<User | null>(null);
    const [mounted, setMounted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [productDetails, setProductDetails] = useState<any | null>(null);
    const [scannedProducts, setScannedProducts] = useState<any[]>([]);
    const scannerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setMounted(true);
    }, []);

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
        const userScansRef = collection(db, "consumers", userId, "scannedProducts");
        const snapshot = await getDocs(userScansRef);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScannedProducts(products);
    };

    const saveScannedProduct = async (userId: string, product: any) => {
        const productRef = doc(db, "consumers", userId, "scannedProducts", product.serialNumber);
        await setDoc(productRef, product);
        await fetchScannedProducts(userId);
    };

    const deleteScannedProduct = async (userId: string, productId: string) => {
        await deleteDoc(doc(db, "consumers", userId, "scannedProducts", productId));
        await fetchScannedProducts(userId);
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

                console.log("Scanned QR Code:", decodedText);

                try {
                    if (!decodedText.includes("-")) {
                        setErrorMessage("Invalid QR Code format.");
                        return;
                    }

                    const parts = decodedText.split("-");
                    if (parts.length !== 2) {
                        setErrorMessage("Invalid QR Code format.");
                        return;
                    }

                    const [manufacturerUID, serialNumber] = parts;
                    console.log("Extracted:", { manufacturerUID, serialNumber });

                    const productRef = doc(db, "manufacturers", manufacturerUID, "products", serialNumber);
                    const productSnap = await getDoc(productRef);

                    if (productSnap.exists()) {
                        const productData = productSnap.data();
                        setProductDetails(productData);
                        if (user) {
                            await saveScannedProduct(user.uid, productData);
                        }
                    } else {
                        setErrorMessage("No product found for this QR code.");
                    }
                } catch (error) {
                    console.error("Error retrieving product details:", error);
                    setErrorMessage("Failed to fetch product details. Please try again.");
                }
            },
            (errorMessage) => {
                console.warn("QR Scan failed:", errorMessage);
            }
        );
    };

    return (
    <>
        <Navbar links={[{ label: "Home", href: "/" }]} />
        <div className="min-h-screen flex flex-col items-center bg-gray-100">
            <div className="relative flex flex-col items-center w-full max-w-2xl mt-[10px]">
                <img
                    src="/Cleaning Earth Environment.svg"
                    alt="E-Waste Management"
                    className="w-3/4 md:w-1/2 h-auto rounded-lg shadow-md"
                />
                {user && <h2 className="text-xl text-black font-semibold mt-2">Hello, {user.email || "User"}</h2>}
            </div>

            <h2 className="text-xl text-black font-semibold mt-4">Scan Product QR Code</h2>
            <div ref={scannerRef} id="qr-reader" className="mt-4" style={{color: "black" }}></div>
            <button onClick={startQRScanner} className="bg-green-600 text-white px-4 py-2 mt-4 rounded">
                Start Scanner
            </button>
            
            {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            
            {productDetails && (
                <div className="mt-6 w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-300">
                    <h3 className="text-lg text-black font-semibold border-b pb-2">Product Details</h3>
                    <p className="text-black mt-2"><strong>Name:</strong> {productDetails.name}</p>
                    <p className="text-black"><strong>Serial Number:</strong> {productDetails.serialNumber}</p>
                    <p className="text-black"><strong>Category:</strong> {productDetails.category}</p>
                    <p className="text-black"><strong>Recyclability:</strong> {productDetails.recyclability}</p>
                    <p className="text-black"><strong>Recoverable Metals:</strong> {productDetails.recoverableMetals}</p>
                </div>
            )}

            <h2 className="text-xl text-black font-semibold mt-6">Scanned Products</h2>
            <div className="w-full max-w-2xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedProducts.length > 0 ? (
                    scannedProducts.map((product) => (
                        <div key={product.id} className="bg-white shadow-lg rounded-xl p-4 border border-gray-300 w-full">
                            <p className="text-black"><strong>Name:</strong> {product.name}</p>
                            <p className="text-black"><strong>Serial Number:</strong> {product.serialNumber}</p>
                            <p className="text-black"><strong>Category:</strong> {product.category}</p>
                            <button onClick={() => deleteScannedProduct(user?.uid!, product.id)} className="mt-2 bg-red-600 text-white px-3 py-1 rounded">
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-black">No scanned products yet.</p>
                )}
            </div>
        </div>
    </>
    );
};

export default Consumer;