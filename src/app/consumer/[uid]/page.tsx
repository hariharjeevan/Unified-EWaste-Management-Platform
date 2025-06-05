//Consumer Page
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User, getAuth } from "firebase/auth";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible, AiFillBell } from "react-icons/ai";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.7041,
  lng: 77.1025,
};

const libraries = ["geometry", "drawing"] as any[];

const Consumer = () => {

  const auth = getAuth();
  const consumerId = auth.currentUser?.uid;
  const searchParams = useSearchParams();
  const qrParam = searchParams.get("qr");

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
    location?: { lat: number; lng: number };
    price?: number;
    points?: number;
    productName?: string;
    desc?: string;
    userId?: string;
  }

  interface RegisterResponse {
    success: boolean;
    message?: string;
  }

  type RecyclerInfo = {
    userId: string;
    lat: number;
    lng: number;
    distance: number;
    products: Product[];
    organization: string;
    address: string;
  };

  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [manufacturerUID, setManufacturerUID] = useState<string | null>(null);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [consumerLocation, setConsumerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRecyclers, setNearbyRecyclers] = useState<RecyclerInfo[]>([]);
  const [homeAddress, setHomeAddress] = useState<string | null>(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [consumerName, setConsumerName] = useState<string>("User");
  const [showCameraPermissionPopup, setShowCameraPermissionPopup] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const maxDistance = 500; // Maximum distance in kmx
  const recyclerSectionRef = useRef<HTMLDivElement | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const toggleQueryModal = () => {
    setShowQueryModal((prev) => !prev);
  };

  const fetchConsumerLocation = async (uid: string) => {
    try {
      const consumerDocRef = doc(db, "consumers", uid, "maps", "homeLocation");
      const consumerDoc = await getDoc(consumerDocRef);

      if (consumerDoc.exists()) {
        const data = consumerDoc.data();
        if (data.location) {
          setConsumerLocation({ lat: data.location.lat, lng: data.location.lng });
        }
      } else {
        console.warn("No consumer document found.");
      }
    } catch (error) {
      console.error("Error fetching consumer location:", error);
    }
  };

  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth’s radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, []);

  const fetchRecyclerProducts = useCallback(
    async (recyclerId: string, consumerId: string): Promise<Product[]> => {
      try {
        const scannedRef = collection(db, "consumers", consumerId, "scannedProducts");
        const scannedSnap = await getDocs(scannedRef);

        const scannedNames = scannedSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.name?.toLowerCase().trim() || "",
            category: data.category?.toLowerCase().trim() || "",
          };
        }).filter(
          (item) => item.name && item.category
        );

        const productsRef = collection(db, "recyclers", recyclerId, "products");
        const productsSnap = await getDocs(productsRef);

        const allProducts: Product[] = productsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.productName || "",
            serialNumber: data.serialNumber || "",
            category: data.category || "Unknown",
            recyclability: data.recyclability || "Unknown",
            recoverableMetals: data.recoverableMetals || "Unknown",
            secretKey: data.secretKey || "",
            manufacturerId: data.manufacturerId || "",
            registered: data.registered ?? false,
            location: data.location || { lat: 0, lng: 0 },
            price: data.price || 0,
            points: data.points || 0,
            productName: data.productName || "",
            desc: data.desc || "",
            userId: data.userId || "",
          };
        });

        const getStringSimilarity = (str1: string, str2: string): number => {
          let commonChars = 0;
          const minLength = Math.min(str1.length, str2.length);

          for (let i = 0; i < minLength; i++) {
            if (str1[i] === str2[i]) {
              commonChars++;
            }
          }

          return commonChars / Math.max(str1.length, str2.length);
        };

        const similarityThreshold = 0.50; // Adjust this threshold as needed

        const matchingProducts = allProducts.filter((product) => {
          const productName = product.productName?.toLowerCase() || "";
          const productCategory = product.category?.toLowerCase() || "";

          return scannedNames.some((scanned) => {
            const Namesimilarity = getStringSimilarity(scanned.name, productName);
            const categorySimilarity = getStringSimilarity(scanned.category, productCategory);
            return Namesimilarity >= similarityThreshold && categorySimilarity >= 1;
          });
        });

        return matchingProducts;
      } catch (error) {
        console.error(`Error fetching products for recycler ${recyclerId}:`, error);
        return [];
      }
    },
    []
  );

  const fetchNearbyRecyclers = useCallback(async () => {
    try {
      const recyclerSnapshot = await getDocs(collection(db, "recyclers"));
      const filtered: RecyclerInfo[] = [];

      recyclerSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.location && consumerLocation) {
          const distance = calculateDistance(
            consumerLocation.lat,
            consumerLocation.lng,
            data.location.lat,
            data.location.lng
          );

          if (distance <= maxDistance) {
            filtered.push({
              userId: docSnap.id,
              lat: data.location.lat,
              lng: data.location.lng,
              distance,
              address: data.address,
              products: [],
              organization: "",
            });
          }
        }
      });

      filtered.sort((a, b) => a.distance - b.distance);

      if (!consumerId) {
        alert("Consumer Not Logged In.");
        return;
      }

      const fullRecyclerList = await Promise.all(
        filtered.map(async (recycler) => {
          const [products, organization] = await Promise.all([
            fetchRecyclerProducts(recycler.userId, consumerId),
            fetchNameofRecycler(recycler.userId),
          ]);

          return {
            ...recycler,
            products,
            organization,
          };
        })
      );

      setNearbyRecyclers(fullRecyclerList);
    } catch (error) {
      console.error("Error fetching recyclers:", error);
    }
  }, [consumerLocation, consumerId, calculateDistance, fetchRecyclerProducts]);

  const fetchNameofRecycler = async (userId: string) => {
    try {
      const recyclerRef = doc(db, "users", userId);
      const docSnap = await getDoc(recyclerRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data && data.organization) {
          return data.organization;
        }
      }

      console.warn("No recycler document found or missing organization field.");
      return null;
    } catch (error) {
      console.error("Error fetching recycler name:", error);
      return null;
    }
  };

  const fetchScannedProducts = useCallback(async (userId: string) => {
    try {
      const userScansRef = collection(db, "consumers", userId, "scannedProducts");
      const snapshot = await getDocs(userScansRef);

      const products: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        if (!data || Object.keys(data).length === 0) {
          console.warn(`Skipping empty or invalid document: ${doc.id}`);
          return null;
        }
        return {
          id: doc.id,
          ...data,
        } as Product;
      }).filter((product) => product !== null) as Product[];

      const verifiedProducts: Product[] = [];

      for (const product of products) {
        if (!product.manufacturerId || !product.serialNumber) {
          console.error("Invalid product data:", product);
          continue;
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
          verifiedProducts.push(product);
        } else {
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

      setScannedProducts(verifiedProducts);
    } catch (error) {
      console.error("Error fetching scanned products:", error);
      setErrorMessage("Failed to load registered products.");
    }
  }, []);

  const fetchHomeLocation = async (userId: string) => {
    try {
      const homeLocationRef = doc(db, "consumers", userId, "maps", "homeLocation");
      const docSnapshot = await getDoc(homeLocationRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setHomeLocation(data.location || null);
        setHomeAddress(data.address || null);
      } else {
        console.log("No home location found for this user.");
      }
    } catch (error) {
      console.error("Error fetching home location:", error);
    }
  };

  useEffect(() => {
    if (consumerLocation && consumerId) {
      fetchNearbyRecyclers();
    }
  }, [consumerLocation, consumerId, fetchNearbyRecyclers]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchScannedProducts(currentUser.uid);
        await fetchHomeLocation(currentUser.uid);
      } else {

        router.push("/login");

        setConsumerLocation(null);
        setScannedProducts([]);
        setNearbyRecyclers([]);
        setHomeLocation(null);
        setHomeAddress(null);
      }
    });

    return () => unsubscribe();
  }, [auth, fetchScannedProducts, router]);


  useEffect(() => {
    if (consumerId) {
      fetchConsumerLocation(consumerId);
    }
  }, [consumerId]);

  const startQRScanner = () => {
    if (!qrContainerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 300, height: 300 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        await scanner.clear();
        setScannerStarted(false);
        setErrorMessage(null);
        setProductDetails(null);
        let qrValue = decodedText;

        try {
          const url = new URL(decodedText);
          const qrParam = url.searchParams.get("qr");
          if (qrParam) {
            qrValue = qrParam;
          }

          const parts = qrValue.split("-");
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

    scannerRef.current = scanner;
    setScannerStarted(true);
  };

  const stopQRScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear()
        setScannerStarted(false);
        scannerRef.current = null;
      } catch (error) {
        console.error("Failed to stop QR scanner:", error);
      }
    }
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
        window.location.reload();
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
      const productRef = doc(
        db,
        "consumers",
        user.uid,
        "scannedProducts",
        productId
      );

      await deleteDoc(productRef);

      alert("Product deleted successfully!");
      await fetchScannedProducts(user.uid);
    } catch (error) {
      console.error("Error deleting product:", error);
      setErrorMessage("Failed to delete product.");
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const selectedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      setHomeLocation(selectedLocation);
      await fetchAddressFromCoords(selectedLocation.lat, selectedLocation.lng);
    }
  };

  useEffect(() => {
    const fetchProductDetails = async (manufacturerUID: string, serialNumber: string) => {
      try {
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
    };
    if (qrParam && user) {
      // Parse manufacturerUID and serialNumber
      const parts = qrParam.split("-");
      if (parts.length === 2) {
        setManufacturerUID(parts[0]);
        // Fetch product details and show registration UI as you do in QR scan
        fetchProductDetails(parts[0], parts[1]);
      }
    }
  }, [qrParam, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <p className="text-white text-lg mb-4">Loading Google Maps...</p>
          <svg
            className="animate-spin h-8 w-8 text-white"
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
        </div>
      </div>
    );
  }

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing.");
      return;
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        setHomeAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const saveHomeLocation = async () => {
    if (!user || !homeLocation || !homeAddress) return;

    try {
      await setDoc(
        doc(db, "consumers", user.uid, "maps", "homeLocation"),
        {
          location: homeLocation,
          address: homeAddress,
        },
        { merge: true }
      );

      alert("Home location and address saved successfully!");
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location. Please try again.");
    }
  };

  const exploreRecyclers = () => {
    recyclerSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" }, { label: "About", href: "/about", tooltip: "About the team behind UEMP" }]} />
      <button
        onClick={toggleQueryModal}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-50"
        aria-label="Show Query Details"
      >
        <AiFillBell size={24} />
      </button>

      <div className="min-h-screen flex flex-col items-center bg-gray-100">
        <div className="relative flex flex-col items-center w-full max-w-2xl mt-[10px]">
          <Image
            src="/Cleaning Earth Environment.svg"
            alt="E-Waste Management"
            width={600}
            height={400}
            className="w-3/4 md:w-1/2 h-auto rounded-lg shadow-md"
            priority
          />
          {user && (
            <h2 className="text-xl text-black font-semibold mt-2">
              Hello, {consumerName}
            </h2>
          )}
        </div>

        {/* Registered products section */}
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
                  onClick={() => setShowProductDetails(product)}
                >
                  <strong>{product.name}</strong> - {product.serialNumber}
                </p>
                <button
                  onClick={() => handleDeleteProduct(product.id!)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
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

        <div className="flex flex-col gap-4 items-center">
          <div ref={qrContainerRef} id="qr-reader" className="mt-2 text-black"></div>

          {!scannerStarted ? (
            <div className="flex gap-16 items-start mt-2">
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-black font-bold text-lg">Scan QR</h1>
                <button
                  onClick={async () => {
                    try {
                      setShowCameraPermissionPopup(true);
                      await navigator.mediaDevices.getUserMedia({ video: true });
                      startQRScanner();
                    } catch (err) {
                      setErrorMessage("Camera access denied. Please allow camera permission to scan QR codes.");
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Start Scanner
                </button>
                {/* Camera Permission Popup */}
                {typeof window !== "undefined" && showCameraPermissionPopup && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center max-w-xs">
                      <Image
                        src="/camera_permission.png"
                        alt="Allow Camera Permission"
                        width={200}
                        height={200}
                        className="mb-3"
                      />
                      <p className="text-black text-center mb-2 font-semibold">
                        Please allow camera access at the top of your browser to scan QR codes.
                      </p>
                      <button
                        onClick={() => setShowCameraPermissionPopup(false)}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-black font-bold text-lg">Explore Recyclers</h2>
                <button
                  onClick={exploreRecyclers}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
                >
                  Explore Recyclers
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={stopQRScanner}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-[30px]"
            >
              Stop Scanner
            </button>
          )}
        </div>

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
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700">
                Close
              </button>
            </div>
          </div>
        )}
        {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}

        {/* Product Details Section */}
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
        <div className="w-full max-w-4xl p-6 mt-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Set Your Home Location</h2>
          <div style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={homeLocation || defaultCenter}
              zoom={10}
              onClick={handleMapClick}
              options={{
                disableDefaultUI: false,
                gestureHandling: "auto",
                draggable: true,
              }}
            >
              {homeLocation && <Marker position={homeLocation} />}
            </GoogleMap>
            {homeAddress && (
              <p className="text-gray-700 mt-3">Selected Address: {homeAddress}</p>
            )}
          </div>

          <button
            onClick={saveHomeLocation}
            className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Save Location
          </button>
        </div>

        {/* Nearby Recyclers Section */}
        <div
          ref={recyclerSectionRef}
          className="text-black px-4 md:px-8 mb-6">
          {loading ? (
            <p className="text-gray-600 text-center text-lg mt-6">Loading nearby recyclers...</p>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center text-gray-900 mt-6">
                Nearby Recyclers
              </h2>
              <p className="text-gray-600 text-center text-sm mt-1">(based on your location and registered products)</p>
            </>
          )}
          {nearbyRecyclers.length === 0 ? (
            <p className="text-gray-500 text-center mt-6 text-base">
              No nearby recyclers found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {nearbyRecyclers.map((recycler) => (
                <Link
                  href={{
                    pathname: "/listofproducts",
                    query: {
                      recyclerId: recycler.userId,
                      ids: recycler.products.map((p) => p.id).join(","),
                    },
                  }}
                  passHref
                  key={recycler.userId}
                  className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-green-700 mb-1">
                      {recycler.organization || "Unknown"}
                    </h2>
                    <p className="text-sm text-gray-600 mb-2">{recycler.address}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">Distance:</span>{" "}
                      {recycler.distance.toFixed(2)} km
                    </p>
                    <h3 className="font-medium text-gray-800 mb-2">Matching Products:</h3>
                    {recycler.products.length === 0 ? (
                      <p className="text-sm text-red-400">No product matches your scanned items.</p>
                    ) : (
                      <ul className="list-disc ml-5 space-y-1">
                        {recycler.products.map((product: Product, index: number) => (
                          <li key={index} className="text-sm text-gray-700">
                            <span className="font-semibold">{product.name}</span>
                            {product.price && <> – ₹{product.price}</>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Consumer;