"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";
import { onAuthStateChanged, User } from "firebase/auth";
import { Mona_Sans } from 'next/font/google';

const monaSansN = Mona_Sans({
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
});

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  points: number;
  desc: string;
  userId: string;
  timestamp: Timestamp;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [updatedProduct, setUpdatedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productRef = doc(db, "recyclers", user.uid, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const fetchedProduct = { id, ...(productSnap.data() as Omit<Product, "id">) };
          setProduct(fetchedProduct);
          setUpdatedProduct(fetchedProduct);
        } else {
          console.error("Product not found!");
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [user, id]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setUpdatedProduct(product);
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!updatedProduct) return;
    setUpdatedProduct({ ...updatedProduct, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user || !id || !updatedProduct) return;
    try {
      const productRef = doc(db, "recyclers", user.uid, "products", id);
      await updateDoc(productRef, {
        price: Number(updatedProduct.price),
        points: Number(updatedProduct.points),
        desc: updatedProduct.desc,
      });
      setProduct({
        ...updatedProduct,
        productName: product?.productName || "",
        category: product?.category || "",
      });
      setEditMode(false);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!user || !id) return;
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      const productRef = doc(db, "recyclers", user.uid, "products", id);
      await deleteDoc(productRef);
      alert("Product deleted successfully!");
      router.back();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading product details...</p>;
  if (!product) return <p className="text-center text-red-500">Product not found.</p>;

  return (
    <div className={`${monaSansN.className} min-h-screen bg-white text-black`}>
      <>
        <Navbar links={[{ label: "Home", href: "/", tooltip: "" }]} />
        <div className="w-screen h-screen p-6 item-center justify-center border rounded-lg bg-white shadow-md">
          {editMode ? (
            <div className="text-center mb-4">
              <>
                <input
                  type="text"
                  name="productName"
                  value={updatedProduct?.productName || ""}
                  readOnly
                  className="w-full p-2 border rounded mb-2 bg-gray-100"
                />
                <input
                  type="text"
                  name="category"
                  value={updatedProduct?.category || ""}
                  readOnly
                  className="w-full p-2 border rounded mb-2 bg-gray-100"
                />
                <input
                  type="number"
                  name="price"
                  value={updatedProduct?.price || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded mb-2"
                />
                <input
                  type="number"
                  name="points"
                  value={updatedProduct?.points || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded mb-2"
                />
                <input
                  type="text"
                  name="desc"
                  value={updatedProduct?.desc || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded mb-2"
                />
              </>
            </div>
          ) : (
            <div className="text-center mb-4">
              <>
                <h1 className="text-xl font-bold text-gray-800 mb-2">{product.productName}</h1>
                <p className="text-gray-600"><strong>Category:</strong> {product.category}</p>
                <p className="text-gray-600"><strong>Price:</strong> ₹{product.price}</p>
                <p className="text-gray-600"><strong>Total Price:</strong> {product.points}</p>
                <p className="text-gray-600 break-words"><strong>Description:</strong> {product.desc}</p>
              </>
            </div>
          )}

          <div className="flex gap-2 mt-4 justify-center">
            <button onClick={() => router.back()} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Go Back</button>
            {editMode ? (
              <>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Edit</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
              </>
            )}
          </div>
        </div>
      </>
    </div>
  );
};

export default ProductDetails;