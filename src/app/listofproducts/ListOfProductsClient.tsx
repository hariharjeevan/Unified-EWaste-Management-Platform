"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc , setDoc, serverTimestamp, query, where, getDocs, collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  desc: string;
}

const ListOfProductsClient = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const searchParams = useSearchParams();
  const [consumerId, setConsumerId] = useState<string | null>(null);

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

  const sendrequest = async (productId: string): Promise<void> => {
    if (!productId || !recyclerId || !consumerId) return;
  
    try {
      const existingQuerySnapshot = await getDocs(
        query(
          collection(db, "Queries", "cqueries", consumerId),
          where("productId", "==", productId)
        )
      );
  
      if (!existingQuerySnapshot.empty) {
        alert("You’ve already sent a request for this product.");
        return;
      }

      const product = products.find((p) => p.id === productId);
      if (!product) return;
  
      const queryId = uuidv4();
  
      const consumerQueryRef = doc(db, "Queries", "cqueries", consumerId, queryId);
  
      const queryPayload = {
        productId,
        productName: product.productName,
        category: product.category,
        price: product.price,
        desc: product.desc,
        status: "pending",
        timestamp: serverTimestamp(),
        recyclerId,
        consumerId,
      };

      await setDoc(consumerQueryRef, queryPayload);
  
      alert("Request sent successfully");
    } catch (error) {
      console.error("Error in sendrequest():", error);
      alert("Failed to send request.");
    }
  };
  
  return (
    <>
      <Navbar links={[{ label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" }]} />
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
                <h3 className="text-xl font-bold text-green-700 mb-2">{product.productName}</h3>
                <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                <p className="text-sm text-gray-600 mb-1">Price: ₹{product.price}</p>
                <p className="text-sm text-gray-700">{product.desc}</p>

                <button
                  className="mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300" onClick={
                    () =>{sendrequest(product.id)
                    }
                  }>Send Request</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ListOfProductsClient;
