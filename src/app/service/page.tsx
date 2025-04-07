"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, wdb } from "@/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";

const ServicePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [productId, setProductId] = useState("");
  const [nameofproduct, setNameofProduct] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [pricevalue, setPriceValue] = useState("");
  const [pointvalue, setPointValue] = useState("");
  const [productdesc, setProductdesc] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const savedata = async () => {
    if (!user) {
      alert("User not authenticated.");
      return;
    }

    const price = parseFloat(pricevalue);
    const points = parseInt(pointvalue, 10);

    if (!productId.trim() || !nameofproduct.trim() || !selectedValue || isNaN(price) || isNaN(points) || !productdesc.trim()) {
      alert("Please enter all fields.");
      return;
    }

    try {
      const docRef = doc(wdb, "recyclers", user.uid, "products", productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("Product ID already exists. Please choose another ID.");
        return;
      }

      const newProduct = {
        id: productId,
        productName: nameofproduct,
        category: selectedValue || "Default Category",
        price,
        points,
        desc: productdesc,
        userId: user.uid,
        timestamp: new Date(),
      };

      await setDoc(docRef, newProduct);
      alert("Data saved successfully with ID: " + productId);

      setProductId("");
      setNameofProduct("");
      setSelectedValue("");
      setPriceValue("");
      setPointValue("");
      setProductdesc("");

      router.push("/recycler");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  return (
    <>
      <Navbar links={[{ label: "Recycler", href: "/recycler", tooltip:"Visit the recycler dashboard" }]} />
      <div className="flex justify-center items-center h-screen bg-white p-4">
        <div className="w-80 bg-white p-4 rounded-lg shadow-lg">
          <input type="text" placeholder="Enter Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full p-2 mb-2 border border-gray-300 rounded text-black" />
          <input type="text" placeholder="Enter name of product" value={nameofproduct} onChange={(e) => setNameofProduct(e.target.value)} required className="w-full p-2 mb-2 border border-gray-300 rounded text-black" />
          <select value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} className="w-full p-2 mb-2 border border-gray-300 rounded text-black">
            <option value="">Choose a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Plastic">Plastic</option>
            <option value="Metal">Metal</option>
          </select>
          <input type="number" placeholder="Enter price of product customer gets" value={pricevalue} onChange={(e) => setPriceValue(e.target.value)} required className="w-full p-2 mb-2 border border-gray-300 rounded text-black" />
          <input type="number" placeholder="Enter price for product you receive" value={pointvalue} onChange={(e) => setPointValue(e.target.value)} required className="w-full p-2 mb-2 border border-gray-300 rounded text-black" />
          <input type="text" placeholder="Enter product description" value={productdesc} onChange={(e) => setProductdesc(e.target.value)} required className="w-full h-12 p-2 mb-2 border border-gray-300 rounded text-black" />
          <div className="flex gap-2">
            <button onClick={savedata} className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
            <button className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => router.push("/recycler")}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicePage;