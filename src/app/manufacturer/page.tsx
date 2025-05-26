//Manufacturer Page
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { query, orderBy, limit, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
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
  serialNumber: string;
  category: string;
  recyclability: string;
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
  const [organization, setOrganization] = useState("");
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
  const productSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
          setOrganization(data.organization || "Unknown Organization");
          setManufacturerEmail(data.email || "Unknown email");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const productQuery = query(
        collection(db, "manufacturers", user.uid, "products"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(productQuery);

      const seenIds = new Set<string>();
      const items: Product[] = [];

      querySnapshot.forEach((doc) => {
        const id = doc.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          items.push({ ...doc.data(), id } as Product);
        }
      });

      setProductList(items); // Replace existing list (initial fetch)
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
      setShowProducts(true);

      // Scroll to product section smoothly after short delay
      setTimeout(() => {
        productSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);

    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const loadMoreProducts = useCallback(async () => {
    if (!user || !lastVisible) return;

    setLoadingMore(true);

    try {
      const nextQuery = query(
        collection(db, "manufacturers", user.uid, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(10)
      );

      const snapshot = await getDocs(nextQuery);

      if (snapshot.empty) {
        setHasMore(false);
        setLastVisible(null);
        return;
      }

      const newProducts = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Product[];

      // Filter out duplicates already in productList
      const deduped = newProducts.filter(
        (np) => !productList.some((existing) => existing.id === np.id)
      );

      // Filter out products that were deleted (in case Firestore returns them due to pagination)
      setProductList((prev) => {
        // Remove any duplicates by id
        const all = [...prev, ...deduped];
        const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
        return unique;
      });

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [user, lastVisible, productList]);


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

  const deleteProduct = async (productId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "manufacturers", user.uid, "products", productId));
      setProductList((prev) => prev.filter((p) => p.id !== productId));
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
    if (!user || !productDetails.serialNumber || !productDetails.category) {
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

      const qrData = `${user.uid}-${productDetails.serialNumber}`;
      const secretKey = generateSecretKey();

      const newProduct = {
        ...productDetails,
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

      await setDoc(serialRef, newProduct);
      setShowDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };
  
  const checkProductExists = async (serial: string) => {
    if (!user) return false;
    const ref = doc(db, "manufacturers", user.uid, "products", serial);
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
          const exists = await checkProductExists(product.serialNumber);
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

  const addBulkProduct = async (product: Product) => {
    if (!user) return;

    try {
      const serialRef = doc(db, "manufacturers", user.uid, "products", product.serialNumber);
      const serialSnap = await getDoc(serialRef);
      if (serialSnap.exists()) return;

      const qrData = `${user.uid}-${product.serialNumber}`;
      const secretKey = generateSecretKey();

      const newProduct = {
        ...product,
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

      await setDoc(serialRef, newProduct);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      expectedHeaders.join(","),
      "Product A,SN0006,Electronics,High,Gold; Silver",
      "Product B,SN0007,Electronics,Low,Copper",
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f5f3f4] to-[#e0e7ff]">
      <Navbar links={[
        { label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" },
        { label: "About", href: "/about", tooltip: "About the team behind UEMP" }
      ]} />
      <div className="bg-transparent min-h-screen flex flex-col items-center pt-16 px-2 sm:px-0">
        {/* Manufacturer Info */}
        <div className="w-full max-w-2xl flex justify-center">
          <InfoCard
            name={manufacturerName}
            organization={organization}
            email={manufacturerEmail}
          />
        </div>
        {/* Actions Section */}
        <div className="w-full max-w-2xl mt-6 bg-white shadow-md rounded-xl p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-black mb-4">Product Actions</h3>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full justify-center">
            <button
              onClick={fetchProducts}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 w-full sm:w-auto"
            >
              View Products
            </button>
            <button
              onClick={() => setShowDialog(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 w-full sm:w-auto"
            >
              Create Product
            </button>
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="w-full max-w-2xl mt-6 bg-white shadow-md rounded-xl p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-black mb-4">Bulk Upload Products</h3>
          <div className="flex flex-col w-full items-center">
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
            <button
              onClick={downloadTemplate}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all duration-200 w-full sm:w-auto"
            >
              Download Sample Template
            </button>
          </div>
          <p className="text-gray-700 text-sm mt-2 text-center">
            Upload a CSV file with product details. You can download a sample template to get started.
          </p>
        </div>

        {showProducts && (
          <div
            ref={productSectionRef}
            className="mt-6 mb-10 w-full max-w-2xl bg-white shadow-md rounded-xl p-4"
          >
            <h3 className="text-lg text-black font-semibold mb-2">Products</h3>

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
                {productList.map((product) => (
                  <li
                    key={product.id}
                    className="border-b p-3 text-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
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
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </InfiniteScroll>
          </div>
        )}

        {showDialog && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50 px-2">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-black text-center">Create New Product</h3>
              {["name", "serialNumber", "category", "recyclability", "recoverableMetals"].map((field) => (
                <div key={field} className="relative mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={field.replace(/([A-Z])/g, " $1")}
                      className="border text-black p-2 w-full"
                      onChange={(e) => setProductDetails({ ...productDetails, [field]: e.target.value })}
                    />
                    <div className="relative group">
                      <IoMdInformationCircleOutline
                        size={20}
                        className="text-gray-500 cursor-pointer hover:text-gray-700"
                      />
                      <div className="absolute left-0 top-8 p-2 bg-white border 
                      border-gray-300 shadow-lg rounded opacity-0 invisible 
                      group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-20 w-64">
                        {field === "name" && <p className="text-sm text-gray-700">
                          Enter the product&apos;s name (e.g., &quot;Samsung Galaxy S25&quot;).</p>}
                        {field === "serialNumber" && <p className="text-sm text-gray-700">
                          Enter the unique serial number for the product.</p>}
                        {field === "category" && <p className="text-sm text-gray-700">
                          Enter the product category (e.g., &quot;Electronics&quot;).</p>}
                        {field === "recyclability" && <p className="text-sm text-gray-700">
                          Enter the recyclability percentage (e.g., &quot;80%&quot;).</p>}
                        {field === "recoverableMetals" && <p className="text-sm text-gray-700">
                          Enter the recoverable metals (e.g., &quot;Gold, Silver&quot;).</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={addProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all duration-200 w-full sm:w-auto"
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
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center 
          bg-black bg-opacity-50 overflow-y-auto z-50 px-2">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mb-10">
              <h3 className="text-lg text-white text-center bg-black font-semibold mb-6 rounded-full p-2">Product Details</h3>
              <p className="text-black"><strong>Name:</strong> {showProductDetails.name}</p>
              <p className="text-black"><strong>Serial Number:</strong> {showProductDetails.serialNumber}</p>
              <p className="text-black"><strong>Category:</strong> {showProductDetails.category}</p>
              <p className="text-black"><strong>Recyclability:</strong> {showProductDetails.recyclability}</p>
              <p className="text-black"><strong>Recoverable Metals:</strong> {showProductDetails.recoverableMetals}</p>
              <p className="text-black"><strong>Registered:</strong> {showProductDetails.registered ? "Yes" : "No"}</p>

              {/* Secret Key Section */}
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-black font-bold">Secret Key:</p>
                <span
                  className="text-black border px-2 py-1 rounded bg-gray-200 w-[150px] text-center overflow-hidden"
                  style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
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
                            const timeDifference = Math.floor((now.getTime() -
                              createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
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
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded
          hover:bg-red-700 transition-all duration-200 w-full"
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