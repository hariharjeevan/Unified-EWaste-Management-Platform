"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, wdb } from "@/firebaseConfig";
import "./recpage.css";
import { AiOutlineSearch } from "react-icons/ai";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Navbar from "@/components/Navbar";

const Nav = () => {
  const { uid } = useParams();
  const router = useRouter();

  if (!uid) {
    return <p>Loading...</p>;
  }

  interface Product {
    id: string;
    productName: string;
    category: string;
    price: number;
    points: number;
    userId: string;
    timestamp: any;
  }

  const [user, setUser] = useState<User | null>(null);
  const [productArray, setProductArray] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      try {
        const productsCollectionRef = collection(wdb, "recyclers", user.uid, "products");
        const querySnapshot = await getDocs(productsCollectionRef);

        const products: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, "id">),
        }));

        setProductArray(products);
        setFilteredProducts(products);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const Search = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const filtered = productArray.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue)
    );

    setFilteredProducts(filtered);
  };

  return (
    <>
      <Navbar links={[{ label: "", href: "" }]} />
      <div className="mid_header">
        <div className="search_box">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={Search}
          />
          <button>
            <AiOutlineSearch />
          </button>
        </div>
      </div>
      <div className="product-container">
        {loading ? (
          <p>Loading products...</p>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => router.push(`/product/${product.id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{product.productName}</h3>
              <p>Category: {product.category}</p>
              <p>Price: {product.price}</p>
              <p>Total Price: {product.points}</p>
            </div>
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>
      <div className="Add-Product">
        <button onClick={() => (window.location.href = "/service")}>Add Product</button>
      </div>
    </>
  );
};

export default Nav;

