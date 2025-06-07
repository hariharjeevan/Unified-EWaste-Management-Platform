// manufacturerdetails.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";

type ProductDetails = {
  category: string;
  name: string;
  recoverableMetals: string;
  recyclability: string;
  productId: string;
};

type OrganizationData = {
  adminId: string;
  certification: string;
  name: string;
};

const ManufacturerDetailsPage = () => {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [manufacturerProducts, setManufacturerProducts] = useState<ProductDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch all organizations only if the user is authenticated
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
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedOrganization && isAuthenticated) {
      // Fetch products for the selected manufacturer
      const fetchManufacturerProducts = async (adminId: string) => {
        const manufacturerRef = collection(db, "manufacturers", adminId, "productModels");
        const manufacturerSnapshot = await getDocs(manufacturerRef);

        const products: ProductDetails[] = [];
        manufacturerSnapshot.forEach((doc) => {
          const productData = doc.data() as ProductDetails;
          
          products.push({ ...productData, productId: doc.id });
        });

        setManufacturerProducts(products);
      };

      fetchManufacturerProducts(selectedOrganization);
    }
  }, [selectedOrganization, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        Loading organizations...
        <Spinner size={25} color="white" />
      </div>
    );
  }

  if (!organizations.length) {
    return <div className="flex flex-col items-center justify-center h-screen">No organizations found.</div>;
  }

  // Find the name of the selected organization (manufacturer)
  const selectedManufacturer = organizations.find((org) => org.adminId === selectedOrganization);

  // Export function for CSV
  const exportToCSV = () => {
    let csvContent = "Manufacturer ID,Product ID,Price,Points,Description\n";
    manufacturerProducts.forEach((product) => {
      csvContent += `${selectedManufacturer?.adminId},${product.productId}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    if (link.download !== undefined) {

      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "manufacturer_products.csv");
      link.click();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100">
      <Navbar
        links={[
          { label: "Recycler", href: "/recycler", tooltip: "Go to your dashboard" },
          { label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" },
          { label: "About", href: "/about", tooltip: "About the team behind UEMP" },
        ]}
      />

      <div className="container mx-auto px-6 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Manufacturers</h1>

        {/* Card wrapper for the Manufacturer details */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          {/* Manufacturer Dropdown */}
          <div className="mb-6 text-black">
            <label htmlFor="organization" className="block text-lg font-semibold mb-2 text-black">
              Select Manufacturer
            </label>
            <select
              id="organization"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedOrganization || ""}
              onChange={(e) => setSelectedOrganization(e.target.value)}
            >
              <option value="" disabled>
                Choose an Organization
              </option>
              {organizations.map((organization) => (
                <option key={organization.adminId} value={organization.adminId}>
                  {organization.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show Manufacturer Cards if an organization is selected */}
          {selectedOrganization && selectedManufacturer && (
            <div className="mb-8">
              {/* Manufacturer Info */}
              <div className="bg-gray-200 p-6 rounded-lg text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{selectedManufacturer.name}</h2>
                <h4 className="text-lg font-medium text-gray-600" style={{ fontFamily: "'Consolas'" }}>
                  Manufacturer ID: {selectedManufacturer.adminId}
                </h4>
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {manufacturerProducts.length === 0 ? (
                  <div className="col-span-full text-center text-gray-600">No products found for this manufacturer.</div>
                ) : (
                  manufacturerProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="bg-white p-6 rounded-lg shadow-lg transform transition-all hover:scale-105"
                    >
                      <div className="bg-green-100 border-l-4 border-green-500 rounded-md px-4 py-2 mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-green-800" style={{ fontFamily: "'Consolas'" }}>
                          Product ID: {product.productId}
                        </p>
                        <span className="ml-2 inline-block bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                          ID
                        </span>
                      </div>
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">{product.name}</h5>
                      <div className="text-gray-600">
                        <div>Category: {product.category}</div>
                        <div className="mt-2">
                          <div className="font-semibold">Recoverable Metals:</div>
                          <div>{product.recoverableMetals}</div>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold">Recyclability:</div>
                          <div>{product.recyclability}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Export Button */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={exportToCSV}
                  className="bg-green-500 text-white p-3 rounded-md hover:bg-green-700 transition"
                >
                  Export Manufacturer & Product IDs to .csv
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ManufacturerDetailsPage;
