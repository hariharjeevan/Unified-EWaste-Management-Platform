"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Papa from "papaparse";
import UploadIcon from "@/icons/uploadIcon.svg";
import Footer from "@/components/Footer";

type OrganizationData = {
  adminId: string;
  certification: string;
  name: string;
};

type ProductDetails = {
  category: string;
  name: string;
  recoverableMetals: string;
  recyclability: string;
  productId: string;
};

const ServicePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [manufacturerId, setManufacturerId] = useState("");
  const [productId, setProductId] = useState("");
  const [nameofproduct, setNameofProduct] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [pricevalue, setPriceValue] = useState("");
  const [pointvalue, setPointValue] = useState("");
  const [productdesc, setProductdesc] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productNotFound, setProductNotFound] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [manufacturerProducts, setManufacturerProducts] = useState<ProductDetails[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      const orgsRef = collection(db, "organizations");
      const orgsSnapshot = await getDocs(orgsRef);
      const orgList: OrganizationData[] = [];
      orgsSnapshot.forEach((doc) => {
        const orgData = doc.data() as OrganizationData;
        orgList.push(orgData);
      });
      setOrganizations(orgList);
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchMinimalDetails = async () => {
      if (manufacturerId.trim() && productId.trim()) {
        setLoadingProduct(true);
        setProductNotFound(false);
        try {
          const productModelRef = doc(
            db,
            "manufacturers",
            manufacturerId,
            "productModels",
            productId
          );
          const productModelSnap = await getDoc(productModelRef);
          if (productModelSnap.exists()) {
            const minimalDetails = productModelSnap.data();
            setNameofProduct(minimalDetails?.name || "");
            setSelectedValue(minimalDetails?.category || "");
          } else {
            setNameofProduct("");
            setSelectedValue("");
            setProductNotFound(true);
          }
        } catch (error) {
          setNameofProduct("");
          setSelectedValue("");
          setProductNotFound(true);
        } finally {
          setLoadingProduct(false);
        }
      } else {
        setNameofProduct("");
        setSelectedValue("");
        setProductNotFound(false);
      }
    };
    fetchMinimalDetails();
  }, [manufacturerId, productId]);

  useEffect(() => {
    if (selectedManufacturer) {
      const fetchManufacturerProducts = async () => {
        const manufacturerRef = collection(db, "manufacturers", selectedManufacturer, "productModels");
        const manufacturerSnapshot = await getDocs(manufacturerRef);
        const products: ProductDetails[] = [];
        manufacturerSnapshot.forEach((doc) => {
          const productData = doc.data() as ProductDetails;
          products.push({ ...productData, productId: doc.id });
        });
        setManufacturerProducts(products);
      };
      fetchManufacturerProducts();
    } else {
      setManufacturerProducts([]);
    }
  }, [selectedManufacturer]);

  const savedata = async () => {
    if (!user) {
      alert("User not authenticated.");
      return;
    }

    const userRef = doc(db, "users", manufacturerId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("Manufacturer ID does not exist or is not a manufacturer.");
      return;
    }

    const productModelRef = doc(db, "manufacturers", manufacturerId, "productModels", productId);
    const productModelSnap = await getDoc(productModelRef);
    if (!productModelSnap.exists()) {
      alert("Product Model ID does not exist for this manufacturer.");
      return;
    }

    const price = parseFloat(pricevalue);
    const points = parseInt(pointvalue, 10);

    if (
      !manufacturerId.trim() ||
      !productId.trim() ||
      !nameofproduct.trim() ||
      !selectedValue ||
      isNaN(price) ||
      isNaN(points) ||
      !productdesc.trim()
    ) {
      alert("Please enter all fields.");
      return;
    }

    let minimalDetails = null;
    try {
      const publicProductRef = doc(
        db,
        "manufacturers",
        manufacturerId,
        "publicProducts",
        productId
      );
      const publicProductSnap = await getDoc(publicProductRef);
      if (publicProductSnap.exists()) {
        minimalDetails = publicProductSnap.data();
      }
    } catch (error) {
      console.error("Error fetching minimal product details:", error);
    }

    try {
      const docRef = doc(db, "recyclers", user.uid, "products", productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("Product ID already exists. Please choose another ID.");
        return;
      }

      const newProduct = {
        id: productId,
        productId,
        manufacturerId,
        productName: minimalDetails?.name || nameofproduct,
        category: minimalDetails?.category || selectedValue || "Default Category",
        price,
        points,
        desc: productdesc,
        userId: user.uid,
        timestamp: new Date(),
      };

      await setDoc(docRef, newProduct);
      alert("Data saved successfully with ID: " + productId);

      setManufacturerId("");
      setProductId("");
      setNameofProduct("");
      setSelectedValue("");
      setPriceValue("");
      setPointValue("");
      setProductdesc("");

      router.push("/recycler");
    } catch (error) {
      alert("Failed to save data.");
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      alert("User not authenticated.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let errorCount = 0;
        let successCount = 0;

        for (const row of results.data as any[]) {
          const manufacturerId = row["Manufacturer ID"]?.trim();
          const productId = row["Product ID"]?.trim();
          const price = parseFloat(row["Price"]);
          const points = parseInt(row["Points"], 10);
          const desc = row["Description"]?.trim();

          if (!manufacturerId || !productId || isNaN(price) || isNaN(points) || !desc) {
            errorCount++;
            continue;
          }

          let productName = "";
          let category = "";
          try {
            const productModelRef = doc(
              db,
              "manufacturers",
              manufacturerId,
              "productModels",
              productId
            );
            const productModelSnap = await getDoc(productModelRef);
            if (productModelSnap.exists()) {
              const data = productModelSnap.data();
              productName = data?.name || "";
              category = data?.category || "";
            }
          } catch (err) {
            productName = "";
            category = "";
          }

          try {
            const docRef = doc(db, "recyclers", user.uid, "products", productId);
            await setDoc(docRef, {
              id: productId,
              productId,
              manufacturerId,
              productName,
              category,
              price,
              points,
              desc,
              userId: user.uid,
              timestamp: new Date(),
            });
            successCount++;
          } catch (err) {
            errorCount++;
          }
        }

        alert(
          `CSV upload complete! ${successCount} products added.${errorCount ? ` ${errorCount} rows skipped due to missing/invalid data or fetch error.` : ""}`
        );
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        alert("Failed to parse CSV file.");
      },
    });
  };

  return (
    <>
      <Navbar links={[{ label: "Find Manufacturer", href: "/manufacturerdetails", tooltip: "Find your manufacturer and their manufactured products." }, { label: "Recycler", href: "/recycler", tooltip: "Visit the recycler dashboard" }]} />
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-2">
        <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-lg mb-8">
          {/* Manufacturer Dropdown */}
          <select
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value);
              setManufacturerId(e.target.value); // sync for fetching
              setSelectedProductId("");
              setProductId(""); // reset productId
            }}
            required
            className="w-full p-2 mb-4 border border-gray-300 rounded text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className="py-2 px-3 text-gray-500 bg-white">
              Select Manufacturer
            </option>
            {organizations.map((org) => (
              <option
                key={org.adminId}
                value={org.adminId}
                className="py-2 px-3 text-black bg-white hover:bg-blue-50"
              >
                {org.name} ({org.adminId})
              </option>
            ))}
          </select>

          {/* Product Dropdown */}
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setProductId(e.target.value); // sync for fetching
            }}
            required
            className="w-full p-2 mb-4 border border-gray-300 rounded text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={!selectedManufacturer}
          >
            <option value="" className="py-2 px-3 text-gray-500 bg-white">
              Select Product
            </option>
            {manufacturerProducts.map((product) => (
              <option
                key={product.productId}
                value={product.productId}
                className="py-2 px-3 text-black bg-white hover:bg-blue-50"
              >
                {product.name} ({product.productId})
              </option>
            ))}
          </select>

          {/* Product Name (auto-filled, read-only) */}
          <input
            type="text"
            placeholder="Product Name"
            value={loadingProduct ? "Loading..." : nameofproduct}
            readOnly
            className="w-full p-2 mb-2 border border-gray-300 rounded text-black bg-gray-100"
          />

          {/* Category (auto-filled, read-only) */}
          <input
            type="text"
            placeholder="Category"
            value={loadingProduct ? "Loading..." : selectedValue}
            readOnly
            className="w-full p-2 mb-2 border border-gray-300 rounded text-black bg-gray-100"
          />

          <input
            type="number"
            placeholder="Enter price of product customer gets"
            value={pricevalue}
            onChange={(e) => setPriceValue(e.target.value)}
            required
            className="w-full p-2 mb-2 border border-gray-300 rounded text-black"
          />
          <input
            type="number"
            placeholder="Enter price for product you receive"
            value={pointvalue}
            onChange={(e) => setPointValue(e.target.value)}
            required
            className="w-full p-2 mb-2 border border-gray-300 rounded text-black"
          />
          <input
            type="text"
            placeholder="Enter product description"
            value={productdesc}
            onChange={(e) => setProductdesc(e.target.value)}
            required
            className="w-full h-12 p-2 mb-2 border border-gray-300 rounded text-black"
          />
          <div className="flex gap-2 mb-4">
            <button
              onClick={savedata}
              className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loadingProduct}
            >
              {loadingProduct ? "Saving..." : "Add"}
            </button>
            <button className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => router.push("/recycler")}>Close</button>
          </div>
          {/* Drag and Drop Area */}
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center w-full border-2 border-dashed border-blue-400 rounded-lg p-6 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all duration-200 mb-4"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file && file.type === "text/csv") {
                handleCSVUpload({
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>);
              }
            }}
          >
            <UploadIcon className="w-8 h-8 text-blue-500" />

            <span className="text-blue-600 font-semibold text-center">
              Drag &amp; drop your CSV file here, or&nbsp;
              <span className="underline">browse</span>
            </span>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ServicePage;
