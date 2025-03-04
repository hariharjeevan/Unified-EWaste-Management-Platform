"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { QRCodeCanvas as QRCode } from "qrcode.react";

interface Product {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  recyclability: string;
  recoverableMetals: string;
  qrHash: string;
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
      const { id, ...rest } = data;
      categorizedProducts[data.category].push({ id: doc.id, ...rest });
    });
    setProducts(categorizedProducts);
    setShowProducts(true);
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "manufacturers", user.uid, "products", productId));
      fetchProducts(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const generateHash = async (input: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const addProduct = async () => {
    if (!user || !productDetails.name || !productDetails.serialNumber || !productDetails.category) {
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

      const hash = await generateHash(productDetails.name + productDetails.serialNumber);
      const newProduct = {
        ...productDetails,
        qrHash: hash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(serialRef, newProduct);
      setShowDialog(false);
      fetchProducts(); // Refresh product list
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
      {/* Navbar */}
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
                      <li
                        key={product.id}
                        className="border-b p-3 text-black flex justify-between items-center"
                      >
                        {/* Product Name & Serial Number Group */}
                        <div className="flex items-center space-x-3 relative group">
                          <span
                            className="cursor-pointer text-blue-600 hover:underline hover:text-blue-800 transition-all duration-200"
                            onClick={() => setShowProductDetails(product)}
                          >
                            {product.name}
                          </span>

                          <span className="text-gray-700">({product.serialNumber})</span>

                          <div
                            className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20"
                          >
                            <QRCode value={product.qrHash} size={100} bgColor="white" fgColor="black" />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-all duration-200"
                        >
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
                <input
                  key={field}
                  type="text"
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  className="border text-black p-2 w-full mb-2"
                  onChange={(e) => setProductDetails({ ...productDetails, [field]: e.target.value })}
                />
              ))}
              <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
              <button onClick={() => setShowDialog(false)} className="ml-2 bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        )}

        {showProductDetails && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              {Object.entries(showProductDetails).map(([key, value]) => (
                <p key={key} className="text-black">
                  <strong>{key}:</strong>{" "}
                  {typeof value === "object" && value?.seconds
                    ? new Date(value.seconds * 1000).toLocaleString()
                    : value}
                </p>
              ))}

              <button onClick={() => setShowProductDetails(null)} className="mt-4 bg-gray-400 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manufacturer;