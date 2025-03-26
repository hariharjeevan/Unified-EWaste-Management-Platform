"use client";

import { useState, useEffect, useRef } from "react";
import { rdb, auth } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Html5QrcodeScanner } from "html5-qrcode";

const Consumer = () => {
    const [user, setUser] = useState<User | null>(null);
    const [mounted, setMounted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const scannerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const params = useParams();
    const uid = params?.uid;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    if (!mounted || !uid) {
        return <p className="text-center text-black mt-20">Loading...</p>;
    }

    const startQRScanner = () => {
        if (!scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            async (decodedText: string) => {
                scanner.clear();

                try {
                    const docRef = collection(rdb, "manufacturer", user?.uid || "", "products", decodedText);
                    const docSnap = await getDocs(docRef);

                    if (docSnap.size > 0) {
                        router.push(`/product-details/${decodedText}`);
                    } else {
                        setErrorMessage("No product found for this QR code.");
                    }
                } catch (error) {
                    setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
                }
            },
            (error) => {
                setErrorMessage(error?.toString() || "QR scanning error.");
            }
        );

        // Wait for scanner to render, then modify text color
        setTimeout(() => {
            const qrTextElements = document.querySelectorAll("#qr-reader__scan_region, #qr-reader__scan_region div, #qr-reader span");
            qrTextElements.forEach((el) => {
                if (el instanceof HTMLElement) {
                    el.style.color = "black";
                }
            });
        }, 1000);
        
    };

    return (
        <>
            <Navbar links={[{ label: "", href: "" }]} />
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-4">
                
                {/* Image Section */}
                <div className="relative flex justify-center w-full max-w-lg mt-[-100px]">
                    <img 
                        src="/Cleaning Earth Environment.svg" 
                        alt="E-Waste Management" 
                        className="w-3/4 md:w-1/2 h-auto rounded-lg shadow-md"
                    />
                </div>

                {/* Welcome Text */}
                <h1 className="text-black font-bold text-lg sm:text-xl mt-2 text-center">
                    {user ? `Welcome, ${user.email}` : "Not signed in"}
                </h1>

                {/* Buttons Below Text */}
                <div className="flex justify-center space-x-4 w-full mt-2">
                    <button
                        onClick={() => router.push(`/addproduct/${uid}`)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition w-40 sm:w-44 font-bold"
                    >
                        Add Product
                    </button>

                    <button
                        onClick={startQRScanner}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition w-40 sm:w-44 font-bold"
                    >
                        Scan QR
                    </button>
                </div>

                {/* QR Scanner Section */}
                <div className="flex flex-col items-center w-full max-w-md mt-6">
                    <div id="qr-reader" ref={scannerRef} className="w-full h-60 max-h-[250px]"></div>
                    {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
                </div>
            </div>

            {/* Global Styles for QR Text */}
            <style jsx global>{`
                #qr-reader__scan_region, #qr-reader__scan_region div, #qr-reader span {
                    color: black !important;
                    fill: black !important;
                }
            `}</style>
        </>
    );
}

export default Consumer;
