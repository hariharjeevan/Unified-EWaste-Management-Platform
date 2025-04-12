"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Ensure this is correctly pointing to your Firestore instance
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

  const recyclerId = searchParams.get("recyclerId");
  const idsParam = searchParams.get("ids");

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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ListOfProductsClient;
