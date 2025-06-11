//ListOfProductsClient.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";

interface Product {
  recycleStatus: string;
  id: string;
  productName: string;
  category: string;
  price: number;
  desc: string;
}

interface SendRequestResponse {
  success: boolean;
  message?: string;
}

const auth = getAuth();

const ListOfProductsClientInner = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const searchParams = useSearchParams();
  const [consumerId, setConsumerId] = useState<string | null>(auth.currentUser?.uid || null);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<string | null>(null);
  const [consumerDetails, setConsumerDetails] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<
    {
      recycleStatus: string; id: string; name: string; productId: string; manufacturerId?: string
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const recyclerId = searchParams.get("recyclerId");
  const idsParam = searchParams.get("ids");

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      if (user) {
        setConsumerId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      if (!recyclerId || !idsParam) {
        setProductsLoading(false);
        return;
      }
      const ids = idsParam.split(",").map((id) => id.trim());
      const fetched: Product[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            const docRef = doc(db, "recyclers", recyclerId, "products", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const productData = docSnap.data() as Product;
              fetched.push({ ...productData, id });
            }
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
          }
        })
      );
      setProducts(fetched);
      setProductsLoading(false);
    };
    fetchProducts();
  }, [recyclerId, idsParam]);

  useEffect(() => {
    if (!consumerId) return;
    const fetchScannedProducts = async () => {
      try {
        const scannedRef = collection(db, "consumers", consumerId, "scannedProducts");
        const scannedSnap = await getDocs(scannedRef);
        const scanned = scannedSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unnamed Product",
            productId: data.productId,
            manufacturerId: data.manufacturerId,
            recycleStatus: data.recycleStatus || "uninitiated",
          };
        });

        setScannedProducts(scanned);
      } catch (error) {
        console.error("Error fetching scanned products:", error);
      }
    };
    fetchScannedProducts();
  }, [consumerId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConsumerDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendRequestClick = () => {
    setShowModal(true);
    setConsumerDetails({ name: "", phone: "", address: "", email: "" });
    setSelectedSerialNumber(null);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSerialNumber(e.target.value);
  };

  const handleSubmitDetails = async () => {
    if (
      !selectedSerialNumber ||
      !consumerDetails.name ||
      !consumerDetails.phone ||
      !consumerDetails.address ||
      !consumerDetails.email
    ) {
      alert("Please fill in all the fields and select a product.");
      return;
    }

    if (isNaN(Number(consumerDetails.phone))) {
      alert("Please enter a valid numeric phone number.");
      return;
    }
    setLoading(true);
    await sendRequestCloudFunction(selectedSerialNumber, consumerDetails);
    setLoading(false);
    setShowModal(false);
    setConsumerDetails({ name: "", phone: "", address: "", email: "" });
    setSelectedSerialNumber(null);
  };

  const sendRequestCloudFunction = async (
    serialNumber: string,
    details: { name: string; phone: string; address: string, email: string }
  ): Promise<void> => {
    if (!serialNumber || !recyclerId || !consumerId || !details) {
      alert("Missing Recycler or Consumer Details");
      return;
    }

    try {
      if (window.confirm("Do you want to send this request?")) {
        const functions = getFunctions(app, "asia-east2");
        const sendRecyclerRequest = httpsCallable(functions, "sendRecyclerRequest");
        const scannedProduct = scannedProducts.find((p) => p.id === serialNumber);
        if (!scannedProduct) {
          alert("Product not found in your scanned products.");
          return;
        }
        const result = await sendRecyclerRequest({
          recyclerId,
          serialNumber: scannedProduct.id,
          productId: scannedProduct.productId,
          details,
          productName: scannedProduct.name,
          manufacturerId: scannedProduct.manufacturerId,
        });
        const data = result.data as SendRequestResponse;
        if (data && data.success) {
          alert("Request sent successfully");
        } else {
          alert(data?.message || "Failed to send request.");
        }
      }
    } catch (error: any) {
      if (
        error.code === "already-exists" ||
        error.code === "functions/already-exists"
      ) {
        alert("You’ve already sent a request for this product.");
      } else if (error.message) {
        alert(error.message);
      } else {
        alert("Failed to send request.");
      }
    }

  };

  return (
    <>
      <Navbar
        links={[
          {
            label: "Docs",
            href: "/docs",
            tooltip: "Refer to the website's documentation",
          },
        ]}
      />
      <div className="min-h-screen flex flex-col items-center bg-gray-100 text-black px-4 py-8">
        <h1 className="text-3xl font-semibold mb-8">List of Products</h1>
        {productsLoading ? (
          <div className="flex items-center justify-center h-64 w-full">
            <Spinner size={25} color="blue" />
            <span className="ml-4 text-lg">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-600 text-lg">No Products available similar to your Products☹️.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
              >
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  {product.productName}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  Category: {product.category}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  Price: ₹{product.price}
                </p>
                <p className="text-sm text-gray-700">{product.desc}</p>
                <button
                  className="mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
                  onClick={handleSendRequestClick}
                >
                  Send Request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-700 mb-1">Sending request...</p>
                <Spinner size={25} color="blue" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Enter Your Details
                </h2>
                <select
                  className="w-full mb-3 px-3 py-2 border rounded"
                  value={selectedSerialNumber || ""}
                  onChange={handleDropdownChange}
                >
                  <option value="" disabled>
                    Select a scanned product
                  </option>
                  {scannedProducts
                    .filter(
                      (prod) =>
                        prod.recycleStatus !== "finished" &&
                        prod.recycleStatus !== "started"
                    ).length === 0 ? (
                    <option disabled>No eligible products found</option>
                  ) : (
                    scannedProducts
                      .filter(
                        (prod) =>
                          prod.recycleStatus !== "finished" &&
                          prod.recycleStatus !== "started"
                      )
                      .map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.id})
                        </option>
                      ))
                  )}
                </select>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full mb-3 px-3 py-2 border rounded"
                  value={consumerDetails.name}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  className="w-full mb-3 px-3 py-2 border rounded"
                  value={consumerDetails.phone}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="email"
                  placeholder="email"
                  className="w-full mb-3 px-3 py-2 border rounded"
                  value={consumerDetails.email}
                  onChange={handleInputChange}
                />
                <textarea
                  name="address"
                  placeholder="Address"
                  className="w-full mb-4 px-3 py-2 border rounded"
                  value={consumerDetails.address}
                  onChange={handleInputChange}
                ></textarea>
                <div className="flex justify-end gap-3">
                  <button
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    onClick={handleSubmitDetails}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default function ListOfProductsClient() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Redirecting...</div>}>
      <ListOfProductsClientInner />
    </Suspense>
  );
}
