//Recycler Page
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebaseConfig";
import { AiOutlineSearch } from "react-icons/ai";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc, query } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(undefined, "asia-east2");

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.7041,
  lng: 77.1025,
};

const libraries = ["geometry", "drawing"] as any[];

const RecyclerPage = () => {
  const router = useRouter();
  const updateRecycleStatus = httpsCallable(functions, "updateRecycleStatus");

  interface Product {
    id: string;
    productId: string;
    serialNumber: string;
    productName: string;
    category: string;
    price: number;
    points: number;
    userId: string;
    desc: string;
    location?: { lat: number; lng: number };
    manufacturerId?: string;
  }

  interface QueryDetails {
    id: string;
    productId: string;
    serialNumber: string;
    productName: string;
    category: string;
    status: string;
    timestamp?: any;
    consumerName: string;
    consumerPhone: string;
    consumerAddress: string;
    recyclerId: string;
    consumerId: string;
    recyclingStatus: string;
    manufacturerId: string;
  }

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [productArray, setProductArray] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [facilityLocation, setFacilityLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [queries, setQueries] = useState<QueryDetails[]>([]);
  const [facilityAddress, setFacilityAddress] = useState<string | null>(null);
  const [selectedProductdetails, setSelectedProductDetails] = useState<{ label: string; value: any }[] | null>(null);
  const [inspectedQuery, setInspectedQuery] = useState<QueryDetails | null>(null);
  const activeQueries = queries.filter(q => q.status !== "rejected");
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [modalQuery, setModalQuery] = useState<QueryDetails | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const fetchFacilityLocation = useCallback(async (userId: string) => {
    try {
      const facilityDocRef = doc(db, "recyclers", userId);
      const docSnapshot = await getDoc(facilityDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data?.location) {
          setFacilityLocation(data.location);
          setFacilityAddress(data.address || null);
        }
      }
    } catch (error) {
      console.error("Error fetching facility location:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchFacilityLocation(currentUser.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router, fetchFacilityLocation]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const productsRef = collection(db, "recyclers", user.uid, "products");
        const querySnapshot = await getDocs(productsRef);

        const products: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          serialNumber: doc.id,
          ...(doc.data() as Omit<Product, "id" | "serialNumber">),
        }));

        setProductArray(products);
        setFilteredProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchQueries = useCallback(async () => {
    if (!user) return;

    try {
      const docRef = doc(db, "Queries", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedQueries: QueryDetails[] = Object.entries(data.queries || {}).map(
          ([queryId, queryData]: [string, any]) => ({
            id: queryId,
            ...queryData,
          })
        );

        setQueries(fetchedQueries);
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQueries();
  }, [user, fetchQueries]);

  const inspectqueryproductdetails = async (consumerId: string, serialNumber: string, queryId: string) => {
    const query = queries.find(q => q.id === queryId);
    setInspectedQuery(query || null);

    if (!user) {
      return;
    }
    if (!consumerId) {
      console.error("Consumer ID not found.");
      return;
    }
    try {
      const consumerdbref = doc(db, "consumers", consumerId, "scannedProducts", serialNumber);
      const consumerSnapshot = await getDoc(consumerdbref);
      if (consumerSnapshot.exists()) {
        const consumerData = consumerSnapshot.data();
        const productDetails = [
          { label: "Product ID", value: consumerData?.productId },
          { label: "Serial Number", value: consumerData?.serialNumber },
          { label: "Product Name", value: consumerData?.name },
          { label: "Category", value: consumerData?.category },
          { label: "Created At", value: consumerData?.createdAt },
          { label: "Recoverable Metals", value: consumerData?.recoverableMetals },
          { label: "Recyclability", value: consumerData?.recyclability },
          { label: "Consumer Scanned At", value: consumerData?.updatedAt },
        ];
        setSelectedProductDetails(productDetails);
      } else {
        setSelectedProductDetails([{ label: "Error", value: "Product not found." }]);
      }
    } catch (error) {
      console.error("Error inspecting product details:", error);
      setSelectedProductDetails([{ label: "Error", value: "Failed to fetch product details." }]);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const filtered = productArray.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue)
    );

    setFilteredProducts(filtered);
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const selectedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      setFacilityLocation(selectedLocation);
      await fetchAddressFromCoords(selectedLocation.lat, selectedLocation.lng);
    }
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        setFacilityAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const saveFacilityLocation = async () => {
    if (!user || !facilityLocation || !facilityAddress) return;

    try {
      await setDoc(
        doc(db, "recyclers", user.uid),
        { location: facilityLocation, address: facilityAddress },
        { merge: true }
      );
      alert("Facility location and address saved successfully!");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  useEffect(() => {
    if (!showQRScanner) return;

    const scanner = new Html5QrcodeScanner(
      "manufacturer-qr-reader",
      { fps: 10, qrbox: { width: 300, height: 300 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        setScanLoading(true);
        scanner.clear();
        setShowQRScanner(false);

        let qrValue = decodedText;
        try {
          const url = new URL(decodedText);
          const qrParam = url.searchParams.get("qr");
          if (qrParam) qrValue = qrParam;
        } catch (e) { }

        const parts = qrValue.split("|");
        if (parts.length === 3) {
          const [manufacturerId, productId, serialNumber] = parts;

          const acceptedQuery = queries.find(
            (q) =>
              q.status === "accepted" &&
              q.productId === productId &&
              q.serialNumber === serialNumber
          );

          if (!acceptedQuery) {
            alert("No accepted recycling request found for this product.");
            setScanLoading(false);
            return;
          }

          const productRef = doc(db, "manufacturers", manufacturerId, productId, serialNumber);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const data = productSnap.data();
            if (
              data.productId !== acceptedQuery.productId ||
              data.serialNumber !== acceptedQuery.serialNumber
            ) {
              alert("Scanned product details do not match the accepted recycling request.");
              setScanLoading(false);
              return;
            }

            const consumerId =
              Array.isArray(data.registeredUsers) && data.registeredUsers.length > 0
                ? data.registeredUsers[0]
                : "";

            if (!user) {
              alert("User not authenticated.");
              setScanLoading(false);
              return;
            }

            await updateRecycleStatus({
              manufacturerId,
              productId,
              serialNumber,
              status: "started",
              consumerId,
              recyclerId: user.uid,
              queryId: acceptedQuery.id,
            });

            alert("Recycling process started for this product!");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            alert("Product not found.");
          }
        } else {
          alert("Invalid QR code.");
        }
        setScanLoading(false);
      },
      (errorMessage: string) => { }
    );

    return () => {
      scanner.clear().catch(() => { });
    };
  }, [showQRScanner]);

  const updateQueryStatus = async (queryId: string, status: "accepted" | "rejected") => {
    if (!user) return;
    try {
      const queriesDocRef = doc(db, "Queries", user.uid);
      const queriesDocSnap = await getDoc(queriesDocRef);
      if (!queriesDocSnap.exists()) return;
      const data = queriesDocSnap.data();
      const queries = data.queries || {};
      if (!queries[queryId]) return;
      queries[queryId].status = status;
      await updateDoc(queriesDocRef, { queries });
      setQueries((prev) =>
        prev.map((q) => (q.id === queryId ? { ...q, status } : q))
      );
    } catch (error) {
      alert("Failed to update query status.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-white text-lg">Loading Google Maps...</p>
        <Spinner size={30} color="white" />
      </div>
    );
  }

  return (
    <>
      <Navbar
        links={[
          { label: "Find Manufacturer", href: "/manufacturerdetails", tooltip: "Find your manufacturer and their manufactured products." },
          { label: "Query Status", href: "/querystatus", tooltip: "Showes the Query Status" },
          { label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" },
          { label: "About", href: "/about", tooltip: "About the team behind UEMP" },
        ]}
      />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
        <div className="relative w-full max-w-2xl p-4">
          <div className="flex items-center border rounded-lg shadow-md bg-white p-2">
            <AiOutlineSearch className="text-gray-600 mx-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full mx-4 px-4">
          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} passHref>
                <div className="p-4 bg-white rounded shadow hover:shadow-lg cursor-pointer">
                  <h3 className="font-bold text-lg">{product.productName}</h3>
                  <p>Category: {product.category}</p>
                  <p>Price: ₹{product.price}</p>
                  <p>Points: {product.points}</p>
                  <p className="line-clamp-1 text-gray-500">{product.desc}</p>
                </div>
              </Link>
            ))
          ) : (
            <p>No products found ☹️.</p>
          )}
        </div>

        <button
          onClick={() => router.push("/service")}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Product
        </button>

        <div className="w-full max-w-4xl p-6 mt-6 mb-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Your Recycling Facility Address</h2>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={facilityLocation || defaultCenter}
            zoom={10} onClick={handleMapClick}>
            {facilityLocation && <Marker position={facilityLocation} />}
          </GoogleMap>
          {facilityAddress && (
            <p className="mt-3 text-gray-700">Selected Address: {facilityAddress}</p>
          )}
          <button
            onClick={saveFacilityLocation}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Location
          </button>
        </div>

        {/* Recycling Requests */}
        <div className="w-full max-w-4xl bg-white p-6 mt-10 mb-10 rounded shadow text-black">
          <h2 className="text-xl font-bold mb-4">Recycling Requests: </h2>
          {loading ? (
            <p>Loading...</p>
          ) : activeQueries.length === 0 ? (
            <p>No queries found.</p>
          ) : (
            <ul className="space-y-4">
              {activeQueries
                .filter(query => query.recyclingStatus !== "finished")
                .map((query) => (
                  <li
                    key={query.id || query.productId}
                    className="p-4 border rounded shadow bg-white cursor-pointer hover:shadow-lg transition"
                    onClick={() => {
                      setModalQuery(query);
                      setShowQueryModal(true);
                      setInspectedQuery(null);
                      setSelectedProductDetails(null);
                    }}
                  >
                    <h3 className="font-bold text-lg mb-2">{query.productName}</h3>
                    <p><strong>Consumer:</strong> {query.consumerName}</p>
                    <p><strong>Phone:</strong> {query.consumerPhone}</p>
                    <p><strong>Address:</strong> {query.consumerAddress}</p>
                    <p><strong>Status:</strong> {query.status}</p>
                    <p><strong>Recycling Status:</strong> {query.recyclingStatus}</p>
                    {(query.recyclingStatus !== "started" && query.recyclingStatus !== "finished") && (
                      <button
                        className="mt-2 bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800"
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowQRScanner(true);
                        }}
                      >
                        Start Recycling
                      </button>
                    )}
                    {query.recyclingStatus === "started" && (
                      <button
                        className="mt-2 bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800"
                        type="button"
                        onClick={async e => {
                          e.preventDefault();
                          e.stopPropagation();
                          await updateRecycleStatus({
                            manufacturerId: query.manufacturerId,
                            productId: query.productId,
                            serialNumber: query.serialNumber,
                            status: "finished",
                            consumerId: query.consumerId,
                            recyclerId: user?.uid || "",
                            queryId: query.id,
                          });
                          alert("Recycling process finished for this product!");
                          window.location.reload();
                        }}
                      >
                        Finish Recycling
                      </button>
                    )}
                    {query.recyclingStatus === "finished" && (
                      <span className="mt-2 text-green-700 font-bold">Recycling Completed!</span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Query Modal */}
        {showQueryModal && modalQuery && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mx-2 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">
                Recycling Request Actions
              </h3>
              <p className="text-black"><strong>Product:</strong> {modalQuery.productName}</p>
              <p className="text-black"><strong>Product Id:</strong> {modalQuery.productId}</p>
              <p className="text-black"><strong>Consumer:</strong> {modalQuery.consumerName}</p>
              <p className="text-black"><strong>Phone:</strong> {modalQuery.consumerPhone}</p>
              <p className="text-black"><strong>Address:</strong> {modalQuery.consumerAddress}</p>
              <p className="text-black"><strong>Status:</strong> {modalQuery.status}</p>
              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mt-4">
                {modalQuery.status !== "accepted" && modalQuery.status !== "rejected" && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to accept this Request?")) {
                          updateQueryStatus(modalQuery.id, "accepted");
                          setShowQueryModal(false);
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to reject this query?")) {
                          updateQueryStatus(modalQuery.id, "rejected");
                          setQueries(prev => prev.filter(q => q.id !== modalQuery.id));
                          setShowQueryModal(false);
                        }
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full sm:w-auto"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    inspectqueryproductdetails(modalQuery.consumerId, modalQuery.serialNumber, modalQuery.id)
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full sm:w-auto"
                >
                  Inspect Product
                </button>
              </div>
              {/* Inspected Product Details */}
              {inspectedQuery && inspectedQuery.id === modalQuery.id && selectedProductdetails && (
                <div className="bg-gray-100 p-4 rounded mb-2 mt-4">
                  <h4 className="font-semibold mb-2">Inspected Product Details</h4>
                  <ul>
                    {selectedProductdetails.map((detail) => (
                      <li key={detail.label} className="mb-1 text-black">
                        <strong>{detail.label}:</strong>{" "}
                        {detail.value && typeof detail.value === "object" && detail.value.seconds
                          ? new Date(detail.value.seconds * 1000).toLocaleString()
                          : String(detail.value)}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-2 bg-gray-300 px-3 py-1 rounded"
                    onClick={() => {
                      setInspectedQuery(null);
                      setSelectedProductDetails(null);
                    }}
                  >
                    Close Details
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setShowQueryModal(false);
                  setInspectedQuery(null);
                  setSelectedProductDetails(null);
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-black text-center">Scan Product QR Code</h3>
              {scanLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Spinner size={32} color="#2563eb" />
                  <span className="mt-4 text-blue-700 font-semibold">Processing...</span>
                </div>
              ) : (
                <div id="manufacturer-qr-reader" className="mb-4" />
              )}
              <button
                onClick={() => setShowQRScanner(false)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
                disabled={scanLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </>
  );
};

export default RecyclerPage;
