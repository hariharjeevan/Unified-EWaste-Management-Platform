//Consumer Page
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, app } from "@/firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User, getAuth } from "firebase/auth";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { AiOutlineEye, AiOutlineEyeInvisible, AiFillBell } from "react-icons/ai";

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
    recycleStatus: string;
    id?: string;
    productId?: string;
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
  const [consumerQueries, setConsumerQueries] = useState<any[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [consumerName, setConsumerName] = useState<string>("User");
  const [showCameraPermissionPopup, setShowCameraPermissionPopup] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const maxDistance = 500; // Maximum distance in kmx
  const recyclerSectionRef = useRef<HTMLDivElement | null>(null);
  const [hasError, setHasError] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const fetchConsumerName = useCallback(async (uid: string) => {
    if (!consumerId) return;
    try {
      const userdocref = doc(db, "users", uid);
      const userDoc = await getDoc(userdocref);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data && data.name) {
          setConsumerName(data.name);
        } else {
          console.warn("No name found for the consumer.");
        }
      }
    } catch (error) {
      console.error("Error fetching consumer name:", error);
    }

  }, [consumerId]);

  useEffect(() => {
    if (consumerId) {
      fetchConsumerName(consumerId);
    }
  }, [consumerId, fetchConsumerName]);

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

        const scannedProducts = scannedSnap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              productId: (data.productId ?? "").toString().trim(),
              serialNumber: (data.serialNumber ?? "").toString().trim(),
              recycleStatus: data.recycleStatus,
            };
          })
          .filter(
            (p) =>
              !!p.productId &&
              !!p.serialNumber &&
              p.recycleStatus !== "finished" && p.recycleStatus !== "started"
          );

        const productsRef = collection(db, "recyclers", recyclerId, "products");
        const productsSnap = await getDocs(productsRef);

        const allProducts: Product[] = productsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.productName || "",
            productId: (data.productId ?? "").toString().trim(),
            serialNumber: (data.serialNumber ?? "").toString().trim(),
            category: data.category || "Unknown",
            recycleStatus: data.recycleStatus || "uninitiated",
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

        const matchingProducts = allProducts.filter((product) =>
          scannedProducts.some(
            (sp) =>
              sp.productId === product.productId
          )
        );

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
      }).filter((product) => product !== null && product.recycleStatus !== "finished" && product.recycleStatus != "started") as Product[];

      const verifiedProducts: Product[] = [];

      for (const product of products) {
        if (!product.manufacturerId || !product.productId || !product.serialNumber) {
          console.error("Invalid product data:", product);
          continue;
        }

        const manufacturerRef = doc(
          db,
          "manufacturers",
          product.manufacturerId,
          product.productId,
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
        console.error("No home location found for this user.");
      }
    } catch (error) {
      console.error("Error fetching home location:", error);
    }
  };

  const fetchConsumerQueries = useCallback(async () => {
  if (!consumerId) return;
  setLoadingQueries(true);
  try {
    const scannedProductsRef = collection(db, "consumers", consumerId, "scannedProducts");
    const scannedProductsSnap = await getDocs(scannedProductsRef);

    let allQueries: any[] = [];

    scannedProductsSnap.forEach(productDoc => {
      const productData = productDoc.data();
      const serialNumber = productDoc.id;

      const recyclingstatus = productData.recycleStatus || "uninitiated";
      const finshedat = productData.finishedAt || null;

      const request = productData.recyclingRequest;
      if (request) {
        allQueries.push({
          id: request.queryId || "",
          recyclerId: request.recyclerId || "",
          serialNumber,
          productName: request.productName || "",
          recycleStatus: recyclingstatus || "uninitiated",
          finishedAt: finshedat,
          ...request,
        });
      }
    });

    setConsumerQueries(allQueries);
  } catch (error) {
    console.error("Error fetching consumer queries:", error);
  } finally {
    setLoadingQueries(false);
  }
}, [consumerId]);


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
        setHasError(false);

        let qrValue = decodedText;

        try {
          const url = new URL(decodedText);
          const qrParam = url.searchParams.get("qr");
          if (qrParam) qrValue = qrParam;
        } catch (e) {
        }

        const parts = qrValue.split("|");
        if (parts.length === 3) {
          const [manufacturerUID, productId, serialNumber] = parts;
          setManufacturerUID(manufacturerUID);
          fetchMinimalProductDetails(manufacturerUID, productId, serialNumber);
        } else {
          setErrorMessage("Invalid QR Code format.");
        }
      },
      (errorMessage: string) => {
        setErrorMessage(null);
        setHasError(true);
      }
    );
  };

  const fetchMinimalProductDetails = async (manufacturerUID: string, productId: string, serialNumber: string) => {
    try {
      const publicProductRef = doc(
        db,
        "manufacturers",
        manufacturerUID,
        "publicProducts",
        serialNumber
      );
      const publicProductSnap = await getDoc(publicProductRef);

      if (publicProductSnap.exists()) {
        const data = publicProductSnap.data() as Product;
        setProductDetails({
          ...data,
          productId,
        });
        setErrorMessage(null);
      } else {
        setProductDetails(null);
        setErrorMessage("No product found for this QR code.");
      }
    } catch (error) {
      setProductDetails(null);
      setErrorMessage("Failed to fetch product details.");
    }
  };

  const stopQRScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
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
      const functions = getFunctions(app, "asia-east2");
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
          productId: productDetails.productId ?? "",
          serialNumber: productDetails.serialNumber,
          modelNumber: productDetails.name,
          secretKey: secretKey,
        });

      if (response.data.success) {
        if (!productDetails.productId) {
          setErrorMessage("Product ID is missing. Cannot fetch full product details.");
          setLoading(false);
          return;
        }
        const fullProductRef = doc(
          db,
          "manufacturers",
          manufacturerUID,
          productDetails.productId,
          productDetails.serialNumber
        );
        const fullProductSnap = await getDoc(fullProductRef);

        if (fullProductSnap.exists()) {
          const fullProductData = fullProductSnap.data();
          await setDoc(
            doc(db, "consumers", user.uid, "scannedProducts", productDetails.serialNumber),
            {
              ...fullProductData,
              registered: true,
              manufacturerId: manufacturerUID,
              productId: productDetails.productId,
              serialNumber: productDetails.serialNumber,
              name: productDetails.name,
            }
          );
          alert("Product registered successfully!");
          window.location.reload();
          setSecretKey("");
          await fetchScannedProducts(user.uid);
        } else {
          setErrorMessage("Full product details not found after registration.");
        }
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
    const fetchProductDetails = async (manufacturerUID: string, productId: string, serialNumber: string) => {
      try {
        const productRef = doc(
          db,
          "manufacturers",
          manufacturerUID,
          productId,
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
      const parts = qrParam.split("|");
      if (parts.length === 3) {
        setManufacturerUID(parts[0]);
        fetchProductDetails(parts[0], parts[1], parts[2]);
      }
    }
  }, [qrParam, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <p className="text-white text-lg mb-4">Loading Google Maps...</p>
          <Spinner size={30} color="white" />
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
        onClick={() => {
          setShowQueryModal(true);
          fetchConsumerQueries();
        }}
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
        {scannedProducts.filter(p => p.recycleStatus !== "finished" && p.recycleStatus != "started").length > 0 ? (
          <div className="mt-6 w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-300">
            <h3 className="text-lg text-black font-semibold border-b pb-2">
              Registered Products
            </h3>
            {scannedProducts
              .filter(product => product.recycleStatus !== "finished" && product.recycleStatus != "started")
              .map((product) => (
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
                      <p className="text-black text-center mb-2 font-medium">
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
                <strong>Product Id:</strong> {showProductDetails.productId}
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
                  className="mt-2 w-full px-4 py-2 border rounded-lg text-black font"
                  style={{ fontFamily: "'Consolas'" }}
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
                  <Spinner size={20} color="white" />
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
              {nearbyRecyclers.map((recycler) => {
                const filteredProducts = recycler.products.filter(
                  (product) => product.recycleStatus !== "finished" && product.recycleStatus != "started"
                );
                return (
                  <Link
                    href={{
                      pathname: "/listofproducts",
                      query: {
                        recyclerId: recycler.userId,
                        ids: filteredProducts.map((p) => p.id).join(","),
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
                      {filteredProducts.length === 0 ? (
                        <p className="text-sm text-red-400">No product matches your scanned items.</p>
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {filteredProducts.map((product: Product, index: number) => (
                            <li key={index} className="text-sm text-gray-700">
                              <span className="font-semibold">{product.name}</span>
                              {product.price && <> – ₹{product.price}</>}
                              <span className="ml-2 text-xs text-gray-500">(Product ID: {product.productId})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {showQueryModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-black rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-center mb-4">Your Recycling Requests</h3>
              {loadingQueries ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : consumerQueries.length === 0 ? (
                <p className="text-center text-gray-500">No requests found.</p>
              ) : (
                <ul className="divide-y">
                  {consumerQueries.map((q) => (
                    <li key={q.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{q.productName}</span>
                        <span className="text-sm text-gray-600">Status: <span className={
                          q.status === "accepted"
                            ? "text-green-600"
                            : q.status === "rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }>{q.status}</span></span>
                        <span className="text-sm text-gray-600">
                          Recycling Status:{" "}
                          <span className={
                            q.recycleStatus === "started"
                              ? "text-yellow-600"
                              : q.recycleStatus === "finished"
                                ? "text-green-600"
                                : "text-blue-600"
                          }>
                            {q.recycleStatus || "uninitiated"}
                          </span>
                          {q.recycleStatus === "finished" &&
                            q.finishedAt &&
                            typeof q.finishedAt === "object" &&
                            "seconds" in q.finishedAt && (
                              <> at: <span className="text-gray-500">{new Date(q.finishedAt.seconds * 1000).toLocaleString()}</span></>
                            )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => setShowQueryModal(false)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {hasError && (
          <p className="text-red-600 mt-2 font-semibold">
            Something went wrong while scanning the QR code. Please try again.
          </p>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Consumer;