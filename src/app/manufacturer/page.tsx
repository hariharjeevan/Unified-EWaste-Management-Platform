"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import crypto from "crypto";
import { FaUserCircle } from "react-icons/fa";
import { RiLogoutBoxFill } from "react-icons/ri";

const Navbar = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full bg-[#000500] text-white p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-10">
      <a href="/" className="text-2xl font-bold">UEMP</a>
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
  const [productName, setProductName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [products, setProducts] = useState<
    { id: string; name: string; serial: string; hash: string; createdAt: any }[]
  >([]);
  const [qrCode, setQrCode] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        fetchProducts(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchProducts = async (uid: string) => {
    const querySnapshot = await getDocs(collection(db, "manufacturers", uid, "products"));
    const productList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        name: string;
        serial: string;
        hash: string;
        createdAt: any;
      }),
    }));
    setProducts(productList);
  };
  
  const generateHash = (name: string, serial: string) => {
    const data = `${name}-${serial}`;
    return crypto.createHash("sha256").update(data).digest("hex").slice(0, 10);
  };

  const addProduct = async () => {
    if (!productName || !serialNumber || !user) return;
  
    const hash = generateHash(productName, serialNumber);
  
    try {
      const newProduct = {
        name: productName,
        serial: serialNumber,
        hash: hash,
        createdAt: serverTimestamp(),
      };
  
      const docRef = await addDoc(collection(db, "manufacturers", user.uid, "products"), newProduct);
  
      setProducts((prev) => [
        ...prev,
        { id: docRef.id, ...newProduct },
      ]);
  
      setProductName("");
      setSerialNumber("");
      setQrCode(hash);
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
      <h2 className="text-xl font-semibold mt-4 text-gray-800">Welcome to your product dashboard!</h2>
      <h2 className="text-xl font-semibold mt-2 text-gray-800">Products:</h2>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="mb-4 flex flex-col items-center space-y-2">
        <input
          type="text"
          placeholder="Enter Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="border p-2 rounded w-64 text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Enter Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="border p-2 rounded w-64 text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addProduct}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Add Product
        </button>
      </div>

      <ul className="w-full max-w-md bg-white shadow-md rounded-lg p-4">
        {products.length > 0 ? (
          products.map((product) => (
            <li key={product.id} className="border-b last:border-0 p-2 text-black">
              {product.name} (SN: {product.serial}) - <span className="text-blue-600">{product.hash}</span>
            </li>
          ))
        ) : (
          <p className="text-gray-500">No products added yet.</p>
        )}
      </ul>

      {qrCode && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">QR Code:</h2>
          <QRCodeCanvas value={qrCode} className="mt-4 border p-2 bg-white rounded-lg shadow-md" />
        </div>
      )}
    </div>
  );
};

export default Manufacturer;
