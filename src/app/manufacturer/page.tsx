//Manufacturer Page
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, where, serverTimestamp } from "firebase/firestore";
import { query, QueryDocumentSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import Papa from "papaparse";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InfoCard from "@/components/InfoCard";
import UploadIcon from "@/icons/uploadIcon.svg";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { IoMdInformationCircleOutline } from "react-icons/io";

interface Product {
  id: string;
  name: string;
  productId: string;
  serialNumber: string;
  category: string;
  recyclability: string;
  recycleStatus: string;
  recoverableMetals: string;
  qrCode: string;
  secretKey?: string;
  registered?: boolean;
  createdAt?: { seconds: number };
  userCount?: number;
}

const Manufacturer = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [manufacturerName, setManufacturerName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [manufacturerEmail, setManufacturerEmail] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const expectedHeaders = ["name", "serialNumber", "category", "recyclability", "recoverableMetals"];
  const [productDetails, setProductDetails] = useState({
    name: "",
    serialNumber: "",
    category: "",
    recyclability: "",
    recoverableMetals: "",
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [organizationID, setOrganizationID] = useState("");
  const [certificationStatus, setCertificationStatus] = useState("none");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const productSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isDuplicateSerial, setIsDuplicateSerial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  interface ProductDetails {
    name: string;
    serialNumber: string;
    category: string;
    recyclability: string;
    recoverableMetals: string;
    [key: string]: any;
  }

  const upsertProductModel = async (
    user: { uid: string },
    productId: string,
    productDetails: ProductDetails
  ) => {
    const modelRef = doc(db, "manufacturers", user.uid, "productModels", productId);
    await setDoc(
      modelRef,
      {
        name: productDetails.name,
        category: productDetails.category,
        recyclability: productDetails.recyclability,
        recoverableMetals: productDetails.recoverableMetals,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const getOrCreateProductId = async (
    user: { uid: string },
    productDetails: ProductDetails
  ): Promise<string> => {
    const productsCol = collection(db, "manufacturers", user.uid, "productModels");
    const q = query(
      productsCol,
      where("name", "==", productDetails.name),
      where("category", "==", productDetails.category)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return crypto.randomUUID();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        // Fetch manufacturer profile info from users collection
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setManufacturerName(data.name || "Unknown Name");
          setManufacturerEmail(data.email || "Unknown email");
          setOrganizationID(data.orgID || "");

          // Check for admin role
          setIsAdmin(data.role === "admin");

          if (data.orgID) {
            const orgDoc = await getDoc(doc(db, "organizations", data.orgID));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data().name || "Unknown Organization");
            } else {
              setOrganizationName("Unknown Organization");
            }
          } else {
            setOrganizationName("Unknown Organization");
          }
        }
      }
    });

    return () => unsubscribe();
  }, [router, organizationID]);

  const fetchProducts = useCallback(async () => {
    if (!organizationID) return;
    try {
      // 1. Get the organization document
      const orgRef = doc(db, "organizations", organizationID);
      const orgDoc = await getDoc(orgRef);
      if (!orgDoc.exists()) return;

      const orgData = orgDoc.data();
      // Combine adminId and employeeIds into a single array of user UIDs
      const userIds: string[] = [
        ...(orgData.employeeIds || []),
        ...(orgData.adminId ? [orgData.adminId] : []),
      ];

      const items: Product[] = [];

      for (const userId of userIds) {
        const productModelsSnap = await getDocs(collection(db, "manufacturers", userId, "productModels"));
        for (const modelDoc of productModelsSnap.docs) {
          const productId = modelDoc.id;
          const serialSnap = await getDocs(collection(db, "manufacturers", userId, productId));
          serialSnap.forEach((doc) => {
            items.push({ ...doc.data(), id: doc.id } as Product);
          });
        }
      }

      setProductList(items);
      setShowProducts(true);
      setLastVisible(null);
      setHasMore(false);
      setTimeout(() => {
        productSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, [organizationID, productSectionRef]);

  const loadMoreProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        !loadingMore &&
        hasMore
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, loadMoreProducts]);

  const deleteProduct = async (productId: string, serialNumber: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      // 1. Delete the product instance (full details)
      await deleteDoc(doc(db, "manufacturers", user.uid, productId, serialNumber));

      // 2. Delete the minimal public details
      await deleteDoc(doc(db, "manufacturers", user.uid, "publicProducts", serialNumber));

      // 3. If no more instances under this productId, delete the product model
      const instancesSnap = await getDocs(collection(db, "manufacturers", user.uid, productId));
      if (instancesSnap.empty) {
        await deleteDoc(doc(db, "manufacturers", user.uid, "productModels", productId));
      }

      setProductList((prev) =>
        prev.filter((p) => !(p.productId === productId && p.serialNumber === serialNumber))
      );
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const generateSecretKey = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secretKey = "";
    const randomValues = new Uint8Array(10);
    crypto.getRandomValues(randomValues);

    randomValues.forEach((value) => {
      secretKey += characters[value % characters.length];
    });

    return secretKey;
  };

  const addProduct = async () => {
    if (!user || !productDetails.serialNumber || !productDetails.category || !productDetails.name) {
      alert("Please fill in all required fields.");
      return;
    }

    const productId = await getOrCreateProductId(user, productDetails);

    await upsertProductModel(user, productId, productDetails);

    // Full product details (private)
    const serialRef = doc(db, "manufacturers", user.uid, productId, productDetails.serialNumber);
    const serialSnap = await getDoc(serialRef);

    if (serialSnap.exists()) {
      alert("A product with this serial number already exists for this model!");
      return;
    }

    const qrData = `https://unified-e-waste-management-platform.vercel.app/consumer/register?qr=${user.uid}|${productId}|${productDetails.serialNumber}`;
    const secretKey = generateSecretKey();

    const newProduct = {
      ...productDetails,
      productId,
      qrCode: qrData,
      secretKey,
      registeredUsers: [],
      registered: false,
      userCount: 0,
      manufacturerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      recycleStatus: "uninitiated",
    };

    // Minimal public details
    const publicProduct = {
      name: productDetails.name,
      category: productDetails.category,
      serialNumber: productDetails.serialNumber,
      manufacturerId: user.uid,
      productId,
      qrCode: qrData,
    };

    // Write full details (private)
    await setDoc(serialRef, newProduct);

    // Write minimal details (public)
    await setDoc(
      doc(db, "manufacturers", user.uid, "publicProducts", productDetails.serialNumber),
      publicProduct
    );

    setShowDialog(false);
    fetchProducts();
  };

  const checkProductExists = async (product: ProductDetails) => {
    if (!user) return false;
    const productId = await getOrCreateProductId(user, product);
    const ref = doc(
      db,
      "manufacturers",
      user.uid,
      productId,
      product.serialNumber
    );
    const snap = await getDoc(ref);
    return snap.exists();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert("Error parsing CSV file.");
      },
      complete: async function (results) {
        const parsed = results.data as any[];
        const validProducts = parsed.filter((row) =>
          expectedHeaders.every((key) => row[key])
        );

        if (validProducts.length === 0) {
          alert("No valid rows found.");
          return;
        }

        const confirmUpload = confirm(
          `Upload ${validProducts.length} valid products to Firestore?`
        );
        if (!confirmUpload) return;

        const errors: string[] = [];

        for (const product of validProducts) {
          const exists = await checkProductExists(product);
          if (exists) {
            errors.push(product.serialNumber);
          } else {
            await addBulkProduct(product);
          }
        }

        if (errors.length > 0) {
          alert(
            `Upload completed with some errors.\nExisting serial numbers: ${errors.join(
              ", "
            )}`
          );
        } else {
          alert("Upload completed successfully.");
        }

        // Reload entire page after upload completes
        window.location.reload();
      },
    });
  };

  const addBulkProduct = async (product: ProductDetails) => {
    if (!user) return;

    const productId = await getOrCreateProductId(user, product);

    await upsertProductModel(user, productId, product);

    // Full product details (private)
    const serialRef = doc(db, "manufacturers", user.uid, productId, product.serialNumber);
    const serialSnap = await getDoc(serialRef);
    if (serialSnap.exists()) return;

    const qrData = `https://unified-e-waste-management-platform.vercel.app/consumer/register?qr=${user.uid}|${productId}|${product.serialNumber}`;
    const secretKey = generateSecretKey();

    const userCount =
      typeof product.userCount === "number" && product.userCount > 0
        ? product.userCount
        : 0;

    const newProduct = {
      ...product,
      productId,
      qrCode: qrData,
      secretKey,
      registeredUsers: [],
      registered: false,
      userCount,
      manufacturerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      recycleStatus: "uninitiated",
    };

    // Minimal public details
    const publicProduct = {
      name: product.name,
      category: product.category,
      serialNumber: product.serialNumber,
      manufacturerId: user.uid,
      productId,
      qrCode: qrData,
    };

    // Write full details (private)
    await setDoc(serialRef, newProduct);

    // Write minimal details (public)
    await setDoc(
      doc(db, "manufacturers", user.uid, "publicProducts", product.serialNumber),
      publicProduct
    );
  };

  const downloadTemplate = () => {
    const csvContent = [
      expectedHeaders.join(","),
      "Product A,SN0006,Electronics,High,Gold; Silver",
      "Product B,SN0007,Electronics,Low,Copper; Silver",
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        if (!organizationID) return;
        const orgRef = doc(db, "organizations", organizationID);
        const orgDoc = await getDoc(orgRef);
        if (orgDoc.exists()) {
          setManufacturerName(orgDoc.data().name);
          setCertificationStatus(orgDoc.data().certification || "none");
        }
      } catch (error) {
        console.error("Error fetching organization details:", error);
      }
    };

    if (organizationID) {
      fetchOrganizationDetails();
    }
  }, [organizationID]);

  const submitCertificationRequest = async () => {
    try {
      if (!organizationID) return;
      const orgRef = doc(db, "organizations", organizationID);
      await updateDoc(orgRef, {
        certification: "pending",
      });
      setSubmissionStatus("Certification request submitted successfully.");
    } catch (error) {
      console.error("Error submitting certification request:", error);
      setSubmissionStatus("Error submitting certification request.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f5f3f4] to-[#e0e7ff]">
      <Navbar
        links={[
          { label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" },
          { label: "About", href: "/about", tooltip: "About the team behind UEMP" },
        ]}
      />
      <div className="flex flex-col items-center pt-16 px-2 sm:px-0">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* Manufacturer Info */}
          <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-6 flex flex-col items-center gap-6">
            <InfoCard
              name={manufacturerName}
              organization={organizationName}
              email={manufacturerEmail}
            />
            {/* Certification Request */}
            <div className="w-full bg-gradient-to-r from-green-50 via-white to-green-100 rounded-2xl shadow border border-green-200 p-6 flex flex-col items-center gap-3">
              <h3 className="text-lg font-bold mb-2 text-green-800 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Manufacturer Certification Request
                <IoMdInformationCircleOutline className="ml-1 text-green-500" title="Get certified from government organizations" />
              </h3>
              <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2 text-black">
                <div>
                  <span className="font-semibold">Organization:</span>{" "}
                  <span className="text-blue-900">{organizationName}</span>
                </div>
                <div>
                  <span className="font-semibold">Certification Status:</span>{" "}
                  <span
                    className={
                      certificationStatus === "approved"
                        ? "text-green-700 font-semibold"
                        : certificationStatus === "pending"
                          ? "text-yellow-600 font-semibold"
                          : "text-gray-700"
                    }
                  >
                    {certificationStatus === "none"
                      ? "Not Certified"
                      : certificationStatus.charAt(0).toUpperCase() + certificationStatus.slice(1)}
                  </span>
                </div>
              </div>
              {certificationStatus === "none" && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full justify-center">
                  <button
                    onClick={submitCertificationRequest}
                    className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 font-semibold transition-all duration-200"
                  >
                    Submit Certification Request
                  </button>
                  {submissionStatus && (
                    <span className="mt-2 text-blue-700 font-medium text-center">{submissionStatus}</span>
                  )}
                </div>
              )}
              {certificationStatus === "pending" && (
                <div className="mt-3 flex items-center gap-2 text-yellow-700 font-semibold">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Your certification request is pending approval.
                </div>
              )}
              {certificationStatus === "approved" && (
                <div className="mt-3 flex items-center gap-2 text-green-700 font-semibold">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.414 7.414a1 1 0 01-1.414 0l-3.414-3.414a1 1 0 111.414-1.414L8 11.586l6.707-6.707a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Your organization has been certified!
                </div>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold text-blue-900 mb-4 tracking-tight">Product Actions</h3>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full justify-center mb-4">
              <button
                onClick={fetchProducts}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow transition-all duration-200 w-full sm:w-auto font-semibold"
              >
                View Products
              </button>
              <button
                onClick={() => setShowDialog(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow transition-all duration-200 w-full sm:w-auto font-semibold"
              >
                Create Product
              </button>
            </div>
            {/* CSV Upload Section */}
            <div className="w-full bg-blue-50/80 shadow rounded-xl p-4 flex flex-col items-center border border-blue-200">
              <h3 className="text-base font-semibold text-blue-900 mb-2">Bulk Upload Products</h3>
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full border-2 border-dashed border-blue-400 rounded-lg p-4 bg-blue-100 hover:bg-blue-200 cursor-pointer transition-all duration-200 mb-2"
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                  e.preventDefault(); e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type === "text/csv") {
                    handleCSVUpload({
                      target: { files: [file] },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              >
                <UploadIcon className="w-8 h-8 text-blue-500 mb-1" />
                <span className="text-blue-700 font-semibold text-center">
                  Drag &amp; drop your CSV file here, or <span className="underline">browse</span>
                </span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="bg-yellow-500 text-white px-4 py-1 rounded-lg hover:bg-yellow-600 shadow transition-all duration-200 w-full sm:w-auto font-semibold"
              >
                Download Sample Template
              </button>
              <p className="text-gray-700 text-xs mt-2 text-center">
                Upload a CSV file with product details. You can download a sample template to get started.
              </p>
            </div>
          </div>

          {/* Product List */}
          {showProducts && (
            <div className="flex flex-col gap-8">
              {/* Active/Other Products */}
              <div
                ref={productSectionRef}
                className="w-full bg-white/90 shadow-xl rounded-2xl p-6 border border-blue-100"
              >
                <h3 className="text-xl text-blue-900 font-bold mb-4">Products</h3>
                <InfiniteScroll
                  dataLength={productList.length}
                  next={loadMoreProducts}
                  hasMore={hasMore}
                  loader={
                    <p className="text-gray-500 text-center my-2 animate-pulse">
                      Loading more products...
                    </p>
                  }
                  scrollThreshold={0.9}
                >
                  <ul>
                    {productList
                      .filter((product) => product.recycleStatus !== "finished")
                      .map((product) => (
                        <li
                          key={product.id}
                          className="border-b last:border-b-0 p-4 text-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-blue-50/60 transition"
                        >
                          <div className="flex items-center space-x-3 relative group w-full sm:w-auto">
                            <span
                              className="cursor-pointer text-blue-700 hover:underline hover:text-blue-900 font-semibold transition-all duration-200 break-all"
                              onClick={() => setShowProductDetails(product)}
                            >
                              {product.name}
                            </span>
                            <span className="text-gray-700 break-all">({product.serialNumber})</span>
                            {product.recycleStatus && (
                              <span className="text-xs ml-2 px-2 py-1 rounded bg-gray-200 text-gray-700">
                                {product.recycleStatus}
                              </span>
                            )}
                            <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 
                      shadow-lg rounded opacity-0 invisible group-hover:opacity-100 
                      group-hover:visible transition-opacity duration-300 z-20">
                              <QRCode value={product.qrCode} size={100} />
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => deleteProduct(product.productId, product.serialNumber)}
                              className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto font-semibold shadow"
                            >
                              Delete
                            </button>
                          )}
                        </li>
                      ))}
                  </ul>
                </InfiniteScroll>
              </div>
              {/* Recycled Products */}
              {productList.some((p) => p.recycleStatus === "finished") && (
                <div className="w-full bg-green-50/80 shadow-md rounded-xl p-4 border border-green-200">
                  <h3 className="text-lg text-green-700 font-semibold mb-2">Recycled Products</h3>
                  <ul>
                    {productList
                      .filter((product) => product.recycleStatus === "finished")
                      .map((product) => (
                        <li
                          key={product.id}
                          className="border-b last:border-b-0 p-3 text-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-green-100/60 transition"
                        >
                          <div className="flex items-center space-x-3 relative group w-full sm:w-auto">
                            <span
                              className="cursor-pointer text-blue-600 hover:underline hover:text-blue-800 transition-all duration-200 break-all"
                              onClick={() => setShowProductDetails(product)}
                            >
                              {product.name}
                            </span>
                            <span className="text-gray-700 break-all">({product.serialNumber})</span>
                            <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 
                      shadow-lg rounded opacity-0 invisible group-hover:opacity-100 
                      group-hover:visible transition-opacity duration-300 z-20">
                              <QRCode value={product.qrCode} size={100} />
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Create Product Dialog */}
        {showDialog && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50 px-2">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-black text-center">Create New Product</h3>
              {/* Product Name */}
              <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Name"
                    className="border text-black p-2 w-full"
                    value={productDetails.name}
                    onChange={(e) => setProductDetails({ ...productDetails, name: e.target.value })}
                  />
                  <div className="relative group">
                    <IoMdInformationCircleOutline size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
                    <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                      <p className="text-sm text-gray-700">Enter the product&apos;s name (e.g., &quot;Samsung Galaxy S25&quot;).</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Serial Number */}
              <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Serial Number"
                    className="border text-black p-2 w-full"
                    value={productDetails.serialNumber}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setProductDetails({ ...productDetails, serialNumber: value });

                      if (value && productDetails.name && productDetails.category && user) {
                        const productId = await getOrCreateProductId(user, { ...productDetails, serialNumber: value });
                        const ref = doc(
                          db,
                          "manufacturers",
                          user.uid,
                          productId,
                          value
                        );
                        const snap = await getDoc(ref);
                        setIsDuplicateSerial(snap.exists());
                      } else {
                        setIsDuplicateSerial(false);
                      }
                    }}
                  />
                  <div className="relative group">
                    <IoMdInformationCircleOutline size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
                    <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                      <p className="text-sm text-gray-700">Enter the unique serial number for the product.</p>
                    </div>
                  </div>
                </div>
                {isDuplicateSerial && (
                  <p className="text-red-500 text-sm mt-1">A product with this serial number already exists for this model.</p>
                )}
              </div>
              {/* Category */}
              <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Category"
                    className="border text-black p-2 w-full"
                    value={productDetails.category}
                    onChange={(e) => setProductDetails({ ...productDetails, category: e.target.value })}
                  />
                  <div className="relative group">
                    <IoMdInformationCircleOutline size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
                    <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                      <p className="text-sm text-gray-700">Enter the product category (e.g., &quot;Electronics&quot;).</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Recyclability */}
              <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Recyclability"
                    className="border text-black p-2 w-full"
                    value={productDetails.recyclability}
                    onChange={(e) => setProductDetails({ ...productDetails, recyclability: e.target.value })}
                  />
                  <div className="relative group">
                    <IoMdInformationCircleOutline size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
                    <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                      <p className="text-sm text-gray-700">Enter the recyclability percentage (e.g., &quot;80%&quot;).</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Recoverable Metals */}
              <div className="relative mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Recoverable Metals"
                    className="border text-black p-2 w-full"
                    value={productDetails.recoverableMetals}
                    onChange={(e) => setProductDetails({ ...productDetails, recoverableMetals: e.target.value })}
                  />
                  <div className="relative group">
                    <IoMdInformationCircleOutline size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
                    <div className="absolute left-0 top-8 p-2 bg-white border border-gray-300 shadow-lg rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                      <p className="text-sm text-gray-700">Enter the recoverable metals (e.g., &quot;Gold, Silver&quot;).</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={addProduct}
                  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all duration-200 w-full sm:w-auto ${isDuplicateSerial ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isDuplicateSerial}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowDialog(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-all duration-200 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showProductDetails && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto z-50 px-2">
            <div
              className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mb-10"
              style={{ maxHeight: "95vh", overflowY: "auto" }}
            >
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">
                Product Details
              </h3>
              <p className="text-black"><strong>Name:</strong> {showProductDetails.name}</p>
              <p className="text-black"><strong>Product ID:</strong> {showProductDetails.productId}</p>
              <p className="text-black"><strong>Serial Number:</strong> {showProductDetails.serialNumber}</p>
              <p className="text-black"><strong>Category:</strong> {showProductDetails.category}</p>
              <p className="text-black"><strong>Recyclability:</strong> {showProductDetails.recyclability}</p>
              <p className="text-black"><strong>Recoverable Metals:</strong> {showProductDetails.recoverableMetals}</p>
              <p className="text-black"><strong>Registered:</strong> {showProductDetails.registered ? "Yes" : "No"}</p>
              <p className="text-black"><strong>Recycle Status:</strong> {showProductDetails.recycleStatus || "N/A"}</p>

              {/* Secret Key Section */}
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-black font-bold">Secret Key:</p>
                <span
                  className="text-black border px-2 py-1 rounded bg-gray-200 w-[150px] text-center overflow-hidden"
                  style={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontFamily: "'Consolas'",
                  }}
                >
                  {showSecretKey ? showProductDetails.secretKey : "**********"}
                </span>
                <button
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {showSecretKey ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                </button>
              </div>

              {/* QR Code */}
              <p className="text-red-500 text-center mt-4"><strong>Product QR Code</strong></p>
              <div className="mt-2 flex justify-center">
                <QRCode value={showProductDetails.qrCode} size={100} bgColor="white" fgColor="black" />
              </div>

              {/* Timeline */}
              <div className="mt-4">
                <h4 className="text-red-500 text-center font-semibold mb-2">Product Timeline</h4>
                <div className="relative">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Created Date */}
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <div className="text-black">
                        Created:{" "}
                        {showProductDetails.createdAt?.seconds
                          ? new Date(showProductDetails.createdAt.seconds * 1000).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    {/* Time Since Creation */}
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <div className="text-black">
                        Time Since Creation:{" "}
                        {showProductDetails.createdAt?.seconds
                          ? (() => {
                            const createdAtDate = new Date(showProductDetails.createdAt.seconds * 1000);
                            const now = new Date();
                            const timeDifference = Math.floor(
                              (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return timeDifference > 0 ? `${timeDifference} days ago` : "Today";
                          })()
                          : "N/A"}
                      </div>
                    </div>
                    {/* User Count */}
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <div className="text-black">
                        Users Count: {showProductDetails.userCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowProductDetails(null)}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition-all duration-200 w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mb-16" />
      <Footer />
    </div>
  );
};

export default Manufacturer;