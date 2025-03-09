"use client";

import { useEffect, useState } from "react";
import { auth , wdb } from "@/firebaseConfig";
import "./service.css";
import {onAuthStateChanged, User } from "firebase/auth";
import {doc , getDoc , setDoc} from "firebase/firestore";
import Navbar from "@/components/Navbar";

const Nav = () => {
    const [user, setUser] = useState<User | null>(null);
    const [productId, setProductId] = useState("");
    const [nameofproduct, setNameofProduct] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const [pricevalue, setPriceValue] = useState("");
    const [pointvalue, setPointValue] = useState("");
    const [productdesc , setProdudesc] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

const savedata = async () => {
  if (!user || !productId.trim() || !nameofproduct.trim() || !selectedValue || !pricevalue || !pointvalue || !productdesc) {
    alert("Please enter all the fields.");
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
      price: pricevalue || 0,
      points: pointvalue || 0,
      desc : productdesc,
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
    setProdudesc("");
  } catch (error) {
    console.error("Error saving data:", error);
    alert("Failed to save data.");
  }
};

  return (
    <>
      <Navbar links={[{ label: "", href: "" }]} />
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
      <option value="">Choose an option</option>
      <option value="product1">Product 1</option>
      <option value="product2">Product 2</option>
      <option value="product3">Product 3</option>
    </select>
    <input
      type="text"
      placeholder="Enter price of product Customer gets"
      value={pricevalue}
      onChange={(e) => setPriceValue(e.target.value)}
      required
    />
    <input
      type="text"
      placeholder="Enter points for product you recieve"
      value={pointvalue}
      onChange={(e) => setPointValue(e.target.value)}
      required
    />
    <input
      type="text"
      placeholder="Enter product Description"
      value={productdesc}
      onChange={(e) => setProdudesc(e.target.value)}
      required
      style={{ width: "100%", height: "50px", fontSize: "16px" }}
    />
    <button onClick={savedata}>Upload</button>
  </div>
</div>
    </>
  );
};

export default Nav;