"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { RiLogoutBoxFill } from "react-icons/ri";
import Link from "next/link";

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full bg-[#000500] text-white p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-10">
      <Link href="/" className="text-2xl font-bold">UEMP</Link>
      {user && (
        <div className="relative">
          <FaUserCircle
            className="text-3xl cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          />
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white text-black shadow-md rounded">
              <button onClick={onLogout} className="flex items-center block w-full px-4 py-2 hover:bg-gray-200"><RiLogoutBoxFill className="mr-2"/>Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

const Manufacturer = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [showProducts, setShowProducts] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [products, setProducts] = useState<{ [key: string]: any[] }>({});
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
    const categorizedProducts: { [key: string]: any[] } = {};

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!categorizedProducts[data.category]) {
        categorizedProducts[data.category] = [];
      }
      categorizedProducts[data.category].push({ id: doc.id, ...data });
    });
    setProducts(categorizedProducts);
    setShowProducts(true);
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
      
      const newProduct = { 
        ...productDetails, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp() 
      };
      await setDoc(serialRef, newProduct);
      setShowDialog(false);
      fetchProducts(); // Refresh the product list after adding a new product
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
    <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-16">
      <Navbar user={user} onLogout={handleLogout} />
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
                    <li key={product.id} className="border-b p-2 text-black">
                      {product.name} (SN: {product.serialNumber}) - {product.recyclability}
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
            <h3 className="text-lg font-semibold mb-4">Create New Product</h3>
            <input type="text" placeholder="Product Name" className="border text-black p-2 w-full mb-2" onChange={(e) => setProductDetails({ ...productDetails, name: e.target.value })} />
            <input type="text" placeholder="Serial Number" className="border text-black p-2 w-full mb-2" onChange={(e) => setProductDetails({ ...productDetails, serialNumber: e.target.value })} />
            <input type="text" placeholder="Category" className="border text-black p-2 w-full mb-2" onChange={(e) => setProductDetails({ ...productDetails, category: e.target.value })} />
            <input type="text" placeholder="Recyclability" className="border text-black p-2 w-full mb-2" onChange={(e) => setProductDetails({ ...productDetails, recyclability: e.target.value })} />
            <input type="text" placeholder="Recoverable Metals" className="border text-black p-2 w-full mb-2" onChange={(e) => setProductDetails({ ...productDetails, recoverableMetals: e.target.value })} />
            <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            <button onClick={() => setShowDialog(false)} className="ml-2 bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manufacturer;