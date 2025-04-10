"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { rdb } from "@/firebaseConfig";
import Navbar from "@/components/Navbar";

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  desc: string;
}

const ListOfProducts = () => {
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
          const docRef = doc(rdb, "recyclers", recyclerId, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetched.push({ id, ...docSnap.data() } as Product);
          }
        })
      );

      setProducts(fetched);
    };

    fetchProducts();
  }, [recyclerId, idsParam]);

  return (
    <>
      <Navbar links={[{ label: "Home", href: "/" }]} />
      <div className="min-h-screen flex flex-col items-center bg-gray-100 text-black">
        <h1 className="text-3xl font-semibold mb-6">List of Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <p>No products available.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow-lg w-full"
              >
                <h3 className="text-xl font-bold mb-2">{product.productName}</h3>
                <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                <p className="text-sm text-gray-600 mb-1">Price: ₹{product.price}</p>
                <p className="text-sm text-gray-600">{product.desc}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ListOfProducts;
