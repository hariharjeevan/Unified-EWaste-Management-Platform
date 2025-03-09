"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./prod.css";
import { auth, rdb } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";
import { onAuthStateChanged, User } from "firebase/auth";

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  points: number;
  desc : string;
  userId: string;
  timestamp: any;
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
        const productRef = doc(rdb, "recyclers", user.uid, "products", id);
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

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!updatedProduct) return;
    setUpdatedProduct({
      ...updatedProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user || !id || !updatedProduct) return;

    try {
      const productRef = doc(rdb, "recyclers", user.uid, "products", id);
      await updateDoc(productRef, {
        productName: updatedProduct.productName,
        category: updatedProduct.category,
        price: Number(updatedProduct.price),
        points: Number(updatedProduct.points),
        desc : updatedProduct.desc,
      });

      setProduct(updatedProduct);
      setEditMode(false);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleCancel = () => {
    setUpdatedProduct(product);
    setEditMode(false);
  };

  if (loading) return <p>Loading product details...</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <>
      <Navbar links={[{ label: "Home", href: "/" }]} />
      <div className="product-details">
        {editMode ? (
          <>
            <input
              type="text"
              name="productName"
              value={updatedProduct?.productName || ""}
              onChange={handleChange}
            />
            <input
              type="text"
              name="category"
              value={updatedProduct?.category || ""}
              onChange={handleChange}
            />
            <input
              type="number"
              name="price"
              value={updatedProduct?.price || ""}
              onChange={handleChange}
            />
            <input
              type="number"
              name="points"
              value={updatedProduct?.points || ""}
              onChange={handleChange}
            />
             <input
              type="text"
              name="desc"
              value={updatedProduct?.desc || ""}
              onChange={handleChange}
            />
          </>
        ) : (
          <>
            <h1>{product.productName}</h1>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Total Price:</strong> {product.points}</p>
            <p><strong>Description:</strong> {product.desc}</p>
          </>
        )}

        <div className="buttons">
        <button onClick={() => router.back()}>Go Back</button>
          {editMode ? (
            <>
              <button className="save-btn" onClick={handleSave}>Save</button>
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button className="edit-btn" onClick={handleEdit}>Edit</button>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
