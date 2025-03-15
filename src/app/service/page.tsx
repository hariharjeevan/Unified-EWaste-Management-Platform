"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, wdb } from "@/firebaseConfig";
import "./service.css";
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

      // Reset fields
      setProductId("");
      setNameofProduct("");
      setSelectedValue("");
      setPriceValue("");
      setPointValue("");
      setProductdesc("");

      // Redirect to recycler page after successful save
      router.push("/recycler");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  return (
    <>
      <Navbar links={[{ label: "Recycler", href: "/recycler" }]} />
      <div className="Add-product">
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Enter name of product"
            value={nameofproduct}
            onChange={(e) => setNameofProduct(e.target.value)}
            required
          />
          <select value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
            <option value="">Choose a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Plastic">Plastic</option>
            <option value="Metal">Metal</option>
          </select>
          <input
            type="number"
            placeholder="Enter price of product customer gets"
            value={pricevalue}
            onChange={(e) => setPriceValue(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Enter points for product you receive"
            value={pointvalue}
            onChange={(e) => setPointValue(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Enter product description"
            value={productdesc}
            onChange={(e) => setProductdesc(e.target.value)}
            required
            style={{ width: "100%", height: "50px", fontSize: "16px" }}
          />
          <div className="button-group">
            <button onClick={savedata}>Add</button>
            <button className="close-btn" onClick={() => router.push("/recycler")}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicePage;
