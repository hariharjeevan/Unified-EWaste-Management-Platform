"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { IoMdInformationCircleOutline } from "react-icons/io";

interface Product {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  recyclability: string;
  recoverableMetals: string;
  qrCode: string;
  secretKey?: string;
  registered?: boolean;
  createdAt?: { seconds: number };
  userCount?: number;
}

const Manufacturer = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [showProducts, setShowProducts] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [products, setProducts] = useState<{ [key: string]: Product[] }>({});
  const [productDetails, setProductDetails] = useState({
    name: "",
    serialNumber: "",
    category: "",
    recyclability: "",
    recoverableMetals: "",
  });
  const [showSecretKey, setShowSecretKey] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchProducts = async () => {
    if (!user) return;
    const querySnapshot = await getDocs(collection(db, "manufacturers", user.uid, "products"));
    const categorizedProducts: { [key: string]: Product[] } = {};

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data() as Product;
      if (!categorizedProducts[data.category]) {
        categorizedProducts[data.category] = [];
      }
      categorizedProducts[data.category].push({ ...data, id: doc.id });
    });

    setProducts(categorizedProducts);
    setShowProducts(true);
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "manufacturers", user.uid, "products", productId));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const generateSecretKey = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secretKey = "";
    const randomValues = new Uint8Array(10);
    crypto.getRandomValues(randomValues);

    randomValues.forEach((value) => {
      secretKey += characters[value % characters.length];
    });

    return secretKey;
  };

  const addProduct = async () => {
    if (!user || !productDetails.serialNumber || !productDetails.category) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const serialRef = doc(db, "manufacturers", user.uid, "products", productDetails.serialNumber);
      const serialSnap = await getDoc(serialRef);

      if (serialSnap.exists()) {
        alert("A product with this serial number already exists!");
        return;
      }

      const qrData = `${user.uid}-${productDetails.serialNumber}`;
      const secretKey = generateSecretKey();

      const newProduct = {
        ...productDetails,
        qrCode: qrData,
        secretKey,
        registeredUsers: [],
        registered: false,
        userCount: 0,
        manufacturerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(serialRef, newProduct);
      setShowDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      <Navbar links={[{ label: "", href: "" }]} />
      <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-16">
        <h2 className="text-xl text-black font-semibold mt-4">Manufacturer Dashboard</h2>
        <div className="flex space-x-4 mt-4">
          <button onClick={fetchProducts} className="bg-blue-600 text-white px-4 py-2 rounded">View Products</button>
          <button onClick={() => setShowDialog(true)} className="bg-green-600 text-white px-4 py-2 rounded">Create Product</button>
        </div>

        {showProducts && (
          <div className="mt-6 w-full max-w-2xl bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg text-black font-semibold">Products</h3>
            {Object.keys(products).length > 0 ? (
              Object.entries(products).map(([category, items]) => (
                <div key={category} className="mt-4">
                  <h4 className="text-md font-bold text-gray-700">{category}</h4>
                  <ul>
                    {items.map((product) => (
                      <li key={product.id} className="border-b p-3 text-black flex justify-between items-center">
                        <div className="flex items-center space-x-3 relative group">
                          <span
                            className="cursor-pointer text-blue-600 hover:underline hover:text-blue-800 transition-all duration-200"
                            onClick={() => setShowProductDetails(product)}
                          >
                            {product.name}
                          </span>
                          <span className="text-gray-700">({product.serialNumber})</span>
                          <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20">
                            <QRCode value={product.qrCode} size={100} bgColor="white" fgColor="black" />
                          </div>
                        </div>
                        <button onClick={() => deleteProduct(product.id)} className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-all duration-200">
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No products found.</p>
            )}
          </div>
        )}

        {showDialog && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-black">Create New Product</h3>
              {["name", "serialNumber", "category", "recyclability", "recoverableMetals"].map((field) => (
                <div key={field} className="relative mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={field.replace(/([A-Z])/g, " $1")}
                      className="border text-black p-2 w-full"
                      onChange={(e) => setProductDetails({ ...productDetails, [field]: e.target.value })}
                    />
                    <div className="relative group">
                      <IoMdInformationCircleOutline
                        size={20}
                        className="text-gray-500 cursor-pointer hover:text-gray-700"
                      />
                      <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                        {field === "name" && <p className="text-sm text-gray-700">Enter the product&apos;s name (e.g., &quot;Samsung Galaxy S25&quot;).</p>}
                        {field === "serialNumber" && <p className="text-sm text-gray-700">Enter the unique serial number for the product.</p>}
                        {field === "category" && <p className="text-sm text-gray-700">Enter the product category (e.g., &quot;Electronics&quot;).</p>}
                        {field === "recyclability" && <p className="text-sm text-gray-700">Enter the recyclability percentage (e.g., &quot;80%&quot;).</p>}
                        {field === "recoverableMetals" && <p className="text-sm text-gray-700">Enter the recoverable metals (e.g., &quot;Gold, Silver&quot;).</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addProduct}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all duration-200"
              >
                Save
              </button>
              <button
                onClick={() => setShowDialog(false)}
                className="ml-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showProductDetails && (
          <div className="fixed top-16 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 mb-10">
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">Product Details</h3>
              <p className="text-black"><strong>Name:</strong> {showProductDetails.name}</p>
              <p className="text-black"><strong>Serial Number:</strong> {showProductDetails.serialNumber}</p>
              <p className="text-black"><strong>Category:</strong> {showProductDetails.category}</p>
              <p className="text-black"><strong>Recyclability:</strong> {showProductDetails.recyclability}</p>
              <p className="text-black"><strong>Recoverable Metals:</strong> {showProductDetails.recoverableMetals}</p>
              <p className="text-black"><strong>Registered:</strong> {showProductDetails.registered ? "Yes" : "No"}</p>

              {/* Secret Key Section */}
              <div className="flex items-center space-x-2 mt-2">
          <p className="text-black font-bold">Secret Key:</p>
          <span
            className="text-black border px-2 py-1 rounded bg-gray-200 w-[120px] text-center overflow-hidden"
            style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
          >
            {showSecretKey ? showProductDetails.secretKey : "**********"}
          </span>
          <button
            onClick={() => setShowSecretKey(!showSecretKey)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            {showSecretKey ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
          </button>
              </div>

              {/* QR Code */}
              <p className="text-red-500 text-center mt-4"><strong>Product QR Code</strong></p>
              <div className="mt-2 flex justify-center">
          <QRCode value={showProductDetails.qrCode} size={100} bgColor="white" fgColor="black" />
              </div>

              {/* Timeline */}
              <div className="mt-4">
          <h4 className="text-red-500 text-center font-semibold mb-2">Product Timeline</h4>
          <div className="relative">
            <div className="flex flex-col items-center space-y-4">
              {/* Created Date */}
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="text-black">
            Created:{" "}
            {showProductDetails.createdAt?.seconds
              ? new Date(showProductDetails.createdAt.seconds * 1000).toLocaleDateString()
              : "N/A"}
                </div>
              </div>

              {/* Time Since Creation */}
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="text-black">
            Time Since Creation:{" "}
            {showProductDetails.createdAt?.seconds
              ? (() => {
                  const createdAtDate = new Date(showProductDetails.createdAt.seconds * 1000);
                  const now = new Date();
                  const timeDifference = Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
                  return timeDifference > 0 ? `${timeDifference} days ago` : "Today";
                })()
              : "N/A"}
                </div>
              </div>

              {/* User Count */}
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="text-black">
            Users Count: {showProductDetails.userCount || 0}
                </div>
              </div>
            </div>
          </div>
              </div>

              <button
          onClick={() => setShowProductDetails(null)}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition-all duration-200"
              >
          Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manufacturer;