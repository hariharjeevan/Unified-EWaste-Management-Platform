//Recycler Page
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebaseConfig";
import { AiOutlineSearch } from "react-icons/ai";
import { collection, doc, getDocs, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

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

  interface Product {
    id: string;
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
    productName: string;
    category: string;
    status: string;
    timestamp?: any;
    consumerName: string;
    consumerPhone: string;
    consumerAddress: string;
    recyclerId: string;
    consumerId: string;
  }

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [productArray, setProductArray] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [facilityLocation, setFacilityLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [queries, setQueries] = useState<QueryDetails[]>([]);
  const [facilityAddress, setFacilityAddress] = useState<string | null>(null);
  const [showRecycleDialog, setShowRecycleDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedConsumer, setSelectedConsumer] = useState<string | null>(null);
  const [selectedProductdetails, setSelectedProductDetails] = useState<{ label: string; value: any }[] | null>(null);
  const [inspectedQuery, setInspectedQuery] = useState<QueryDetails | null>(null);
  const [consumerId, setConsumerId] = useState<string | null>(null);
  const activeQueries = queries.filter(q => q.status !== "rejected");
  const historyQueries = queries.filter(q => q.status === "rejected");
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [modalQuery, setModalQuery] = useState<QueryDetails | null>(null);

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
          ...(doc.data() as Omit<Product, "id">),
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

  useEffect(() => {
    const fetchQueries = async () => {
      if (!user) return;

      try {
        // Reference the document using the recycler's user ID
        const docRef = doc(db, "Queries", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedQueries: QueryDetails[] = Object.entries(data.queries || {}).map(
            ([queryId, queryData]: [string, any]) => ({
              id: queryId, // Use the key as the queryId
              ...queryData, // Spread the rest of the query data
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
    };

    fetchQueries();
  }, [user]);

  const inspectqueryproductdetails = async (consumerId: string, productId: string, queryId: string) => {
    const query = queries.find(q => q.id === queryId);
    setInspectedQuery(query || null);

    if (!user) {
      return;
    }

    const queryRef = doc(db, "Queries", user.uid);
    const querySnapshot = await getDoc(queryRef);
    if (querySnapshot.exists()) {
      const data = querySnapshot.data();
      setConsumerId(data.consumerId);
    }

    if (!consumerId) {
      console.error("Consumer ID not found.");
      return;
    }
    try {
      const consumerdbref = doc(db, "consumers", consumerId, "scannedProducts", productId);
      const consumerSnapshot = await getDoc(consumerdbref);
      if (consumerSnapshot.exists()) {
        const consumerData = consumerSnapshot.data();
        const productDetails = [
          { label: "Product ID", value: consumerData?.serialNumber },
          { label: "Product Name", value: consumerData?.name },
          { label: "Category", value: consumerData?.category },
          { label: "Created At", value: consumerData?.createdAt },
          { label: "Recoverable Metals", value: consumerData?.recoverableMetals },
          { label: "Recyclability", value: consumerData?.recyclability },
          { label: "Consumer Scanned At: ", value: consumerData?.updatedAt },
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

  const updateQueryStatus = async (queryId: string, newStatus: "accepted" | "rejected") => {
    if (!user || !queryId) {
      console.error("Invalid user or queryId:", { user, queryId });
      alert("Failed to update query status. Invalid user or query ID.");
      return;
    }

    try {
      // Reference the document using the recycler's user ID
      const docRef = doc(db, "Queries", user.uid);

      console.log("Updating Firestore document:", {
        userId: user.uid,
        queryId,
        newStatus,
      });

      // Update the specific query inside the `queries` object
      await updateDoc(docRef, {
        [`queries.${queryId}.status`]: newStatus,
      });
      console.log(`Firestore updated: Query ${queryId} set to ${newStatus}`);

      // If rejected, delete the product from recycler's products collection
      if (newStatus === "rejected") {
        // Find the productId from the query
        const rejectedQuery = queries.find(q => q.id === queryId);
        if (rejectedQuery && rejectedQuery.productId) {
          const productDocRef = doc(db, "recyclers", user.uid, "products", rejectedQuery.productId);
          try {
            await deleteDoc(productDocRef);
            setProductArray(prev => prev.filter(p => p.id !== rejectedQuery.productId));
            setFilteredProducts(prev => prev.filter(p => p.id !== rejectedQuery.productId));
            console.log(`Product ${rejectedQuery.productId} deleted from recycler's products`);
          } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete product after rejection.");
          }
        }
      }

      // Update the local state
      setQueries((prevQueries) =>
        prevQueries.map((q) =>
          q.id === queryId ? { ...q, status: newStatus } : q
        )
      );

      // Show success alert
      alert(`Query ${newStatus === "accepted" ? "accepted" : "rejected"} successfully!`);
    } catch (error) {
      console.error("Error updating query status:", error);

      // Show error alert
      alert("Failed to update query status. Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white text-lg">Loading Google Maps...</p>
      </div>
    );
  }

  const handleOpenRecycleDialog = (product: Product) => {
    // Find the consumer name from queries for this product
    const query = queries.find(q => q.productId === product.id && q.status === "accepted");
    setSelectedProduct(product);
    setSelectedConsumer(query ? query.consumerName : "N/A");
    setShowRecycleDialog(true);
  };

  // Handler to complete recycle
  const handleCompleteRecycle = async () => {
    if (!selectedProduct) return;
    try {
      // Update recycleStatus in manufacturer's database
      const manufacturerId = selectedProduct.userId || selectedProduct.manufacturerId;
      if (!manufacturerId) {
        alert("Manufacturer ID not found for this product.");
        return;
      }
      const productRef = doc(db, "manufacturers", manufacturerId, "products", selectedProduct.id);
      await updateDoc(productRef, { recycleStatus: "completed" });
      alert("Recycle status updated to completed!");
      setShowRecycleDialog(false);
      // Refresh product list
    } catch (error) {
      alert("Failed to update recycle status.");
      console.error(error);
    }
  };

  return (
    <>
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" }]} />
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
            <p>No products found.</p>
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
              {queries.map((query) => (
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
                  <button
                    className="mt-2 bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800"
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const product = productArray.find(p => p.id === query.productId);
                      if (product) {
                        handleOpenRecycleDialog(product);
                      } else {
                        alert("Product not found for this query.");
                      }
                    }}
                  >
                    Complete Recycle
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Recycling History */}
        <div className="w-full max-w-4xl bg-white p-6 mt-10 mb-10 rounded shadow text-black">
          <h2 className="text-xl font-bold mb-4">Recycling History</h2>
          {loading ? (
            <p>Loading...</p>
          ) : historyQueries.length === 0 ? (
            <p>No history found.</p>
          ) : (
            <ul className="space-y-4">
              {historyQueries.map((query) => (
                <li key={query.id || query.productId} className="p-4 border rounded shadow">
                  <p><strong>Product:</strong> {query.productName}</p>
                  <p><strong>Consumer:</strong> {query.consumerName}</p>
                  <p><strong>Status:</strong> {query.status}</p>
                  {/* Add more details if needed */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {showQueryModal && modalQuery && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">
                Recycling Request Actions
              </h3>
              <p className="text-black"><strong>Product:</strong> {modalQuery.productName}</p>
              <p className="text-black"><strong>Consumer:</strong> {modalQuery.consumerName}</p>
              <p className="text-black"><strong>Phone:</strong> {modalQuery.consumerPhone}</p>
              <p className="text-black"><strong>Address:</strong> {modalQuery.consumerAddress}</p>
              <p className="text-black"><strong>Status:</strong> {modalQuery.status}</p>
              <div className="flex flex-row space-x-2 mt-4">
                {modalQuery.status !== "accepted" && modalQuery.status !== "rejected" && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to accept this query?")) {
                          updateQueryStatus(modalQuery.id, "accepted");
                          setShowQueryModal(false);
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
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
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    inspectqueryproductdetails(modalQuery.consumerId, modalQuery.productId, modalQuery.id);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
        <Footer />
      </div>
    </>
  );
};

export default RecyclerPage;
