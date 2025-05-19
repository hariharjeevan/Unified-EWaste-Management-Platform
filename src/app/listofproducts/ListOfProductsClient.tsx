//ListOfProductsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";

interface Product {
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

const ListOfProductsClient = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const searchParams = useSearchParams();
  const [consumerId, setConsumerId] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [consumerDetails, setConsumerDetails] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [showModal, setShowModal] = useState(false);

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
      if (!recyclerId || !idsParam) return;

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
    };
    fetchProducts();
  }, [recyclerId, idsParam]);

  const handleSendRequestClick = (productId: string) => {
    setSelectedProductId(productId);
    setShowModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConsumerDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitDetails = async () => {
    if (!selectedProductId) return;
    if (
      !consumerDetails.name ||
      !consumerDetails.phone ||
      !consumerDetails.address
    ) {
      alert("Please fill in all the fields.");
      return;
    }

    await sendRequestCloudFunction(selectedProductId, consumerDetails);
    setShowModal(false);
    setConsumerDetails({ name: "", phone: "", address: "" });
  };

  const sendRequestCloudFunction = async (
    productId: string,
    details: { name: string; phone: string; address: string }
  ): Promise<void> => {
    if (!productId || !recyclerId || !consumerId) {
      alert("Missing Recycler or Consumer Details");
      return;
    }

    try {
      const functions = getFunctions();
      const sendRecyclerRequest = httpsCallable(
        functions,
        "sendRecyclerRequest"
      );

      const product = products.find((p) => p.id === productId);
      if (!product) {
        alert("Product not found.");
        return;
      }

      const result = await sendRecyclerRequest({
        recyclerId,
        productId,
        details,
        productName: product.productName,
        category: product.category,
        price: product.price,
      });

      const data = result.data as SendRequestResponse;

      if (data && data.success) {
        alert("Request sent successfully");
      } else {
        alert(data?.message || "Failed to send request.");
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
        {products.length === 0 ? (
          <p className="text-gray-600 text-lg">No products available.</p>
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
                  onClick={() => handleSendRequestClick(product.id)}
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
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Enter Your Details
            </h2>
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
          </div>
        </div>
      )}
    </>
  );
};

export default ListOfProductsClient;
