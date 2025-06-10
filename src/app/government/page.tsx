//Government Page
"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, query, where, getDoc, updateDoc, doc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const Government = () => {
    const [pendingOrgs, setPendingOrgs] = useState<{ id: string; name: string }[]>([]);
    const [approvedOrgs, setApprovedOrgs] = useState<{ id: string; name: string }[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedManufacturer, setSelectedManufacturer] = useState<OrganizationData | null>(null);
    const [manufacturerProducts, setManufacturerProducts] = useState<ProductDetails[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchCerts = async () => {
            try {
                // Fetch pending
                const orgsQuery = query(collection(db, "organizations"), where("certification", "==", "pending"));
                const snapshot = await getDocs(orgsQuery);
                setPendingOrgs(snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || doc.id
                })));

                // Fetch approved
                const approvedQuery = query(collection(db, "organizations"), where("certification", "==", "approved"));
                const approvedSnap = await getDocs(approvedQuery);
                setApprovedOrgs(approvedSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || doc.id
                })));
            } catch (error) {
                console.error("Error fetching certifications:", error);
            }
        };
        fetchCerts();
    }, []);

    const approveCertification = async (orgId: string) => {
        try {
            await updateDoc(doc(db, "organizations", orgId), { certification: "approved" });
            setPendingOrgs(prev => prev.filter(org => org.id !== orgId));
            const org = pendingOrgs.find(org => org.id === orgId);
            if (org) setApprovedOrgs(prev => [...prev, org]);
        } catch (error) {
            console.error("Error approving certification:", error);
        }
    };

    const openManufacturerDialog = async (org: { id: string; name: string }) => {
        setLoadingDetails(true);
        setShowDialog(true);

        // Fetch organization details
        const orgDoc = await getDoc(doc(db, "organizations", org.id));
        let orgData: OrganizationData;
        if (orgDoc.exists()) {
            orgData = orgDoc.data() as OrganizationData;
        } else {
            orgData = { name: org.name, adminId: org.id, certification: "" };
        }
        setSelectedManufacturer({ ...orgData, adminId: orgData.adminId });

        const productsRef = collection(db, "manufacturers", orgData.adminId, "productModels");
        const productsSnap = await getDocs(productsRef);
        const products: ProductDetails[] = [];
        productsSnap.forEach((doc) => {
            const data = doc.data() as ProductDetails;
            products.push({ ...data, productId: doc.id });
        });
        setManufacturerProducts(products);
        setLoadingDetails(false);
    };

    return (
        <>
            <Navbar links={[{ label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation" }, { label: "About", href: "/about", tooltip: "About the team behind UEMP" }]} />
            <div className="w-full min-h-screen bg-white flex justify-center items-center text-black">
                <div className="w-full max-w-4xl mt-10 bg-white p-6 rounded shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Pending Certification Requests</h3>
                    {pendingOrgs.length === 0 ? (
                        <p className="text-gray-500">No pending requests.</p>
                    ) : (
                        <ul>
                            {pendingOrgs.map(org => (
                                <li key={org.id} className="flex justify-between items-center py-2 border-b">
                                    <span
                                        className="text-blue-700 hover:underline cursor-pointer"
                                        onClick={() => openManufacturerDialog(org)}
                                    >
                                        {org.name}
                                    </span>
                                    <button
                                        onClick={() => approveCertification(org.id)}
                                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Approved Certifications History */}
                    <h3 className="text-lg font-semibold mt-10 mb-4">Approved Certifications History</h3>
                    {approvedOrgs.length === 0 ? (
                        <p className="text-gray-500">No approved certifications yet.</p>
                    ) : (
                        <ul>
                            {approvedOrgs.map(org => (
                                <li key={org.id} className="flex justify-between items-center py-2 border-b">
                                    <span
                                        className="text-blue-700 hover:underline cursor-pointer"
                                        onClick={() => openManufacturerDialog(org)}
                                    >
                                        {org.name}
                                    </span>
                                    <span className="text-green-700 font-medium">Approved</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {showDialog && selectedManufacturer && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative border-2 border-green-500">
                                <button
                                    className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold"
                                    onClick={() => setShowDialog(false)}
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-green-700 mb-1">{selectedManufacturer.name}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 text-gray-700">
                                        <div>
                                            <span className="font-semibold">Manufacturer ID:</span>
                                            <span className="ml-2 px-2 py-1 bg-green-100 border border-green-400 rounded text-green-800 font-mono text-sm">
                                                {selectedManufacturer.adminId}
                                            </span>
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <span className="font-semibold">Certification:</span>
                                            <span className={`ml-2 px-2 py-1 rounded text-white text-xs font-bold ${selectedManufacturer.certification === "approved" ? "bg-green-600" : "bg-yellow-500"}`}>
                                                {selectedManufacturer.certification.charAt(0).toUpperCase() + selectedManufacturer.certification.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Products</h3>
                                {loadingDetails ? (
                                    <div className="text-center py-8 text-gray-500">Loading products...</div>
                                ) : manufacturerProducts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">No products found for this manufacturer.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {manufacturerProducts.map(product => (
                                            <div
                                                key={product.productId}
                                                className="bg-gray-50 border border-green-200 rounded-lg p-4 shadow hover:shadow-md transition"
                                            >
                                                <div className="flex flex-col gap-1 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center bg-green-100 border border-green-400 text-green-800 font-mono text-xs rounded px-2 py-1">
                                                            <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mr-2">
                                                                ID
                                                            </span>
                                                            {product.productId}
                                                        </span>
                                                    </div>
                                                    <span className="text-base sm:text-lg font-semibold text-gray-800">{product.name}</span>
                                                </div>
                                                <div className="text-gray-700 text-sm mb-1">
                                                    <span className="font-semibold">Category:</span> {product.category}
                                                </div>
                                                <div className="text-gray-700 text-sm mb-1">
                                                    <span className="font-semibold">Recyclability:</span> {product.recyclability}
                                                </div>
                                                <div className="text-gray-700 text-sm">
                                                    <span className="font-semibold">Recoverable Metals:</span> {product.recoverableMetals}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Government;