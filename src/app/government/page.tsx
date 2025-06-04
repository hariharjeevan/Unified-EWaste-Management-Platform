//Government Page
"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Government = () => {
    const [pendingOrgs, setPendingOrgs] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchPendingCerts = async () => {
            try {
                const orgsQuery = query(collection(db, "organizations"), where("certification", "==", "pending"));
                const snapshot = await getDocs(orgsQuery);
                setPendingOrgs(snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || doc.id
                })));
            } catch (error) {
                console.error("Error fetching pending certifications:", error);
            }
        };
        fetchPendingCerts();
    }, []);

    const approveCertification = async (orgId: string) => {
        try {
            await updateDoc(doc(db, "organizations", orgId), { certification: "approved" });
            setPendingOrgs(prev => prev.filter(org => org.id !== orgId));
        } catch (error) {
            console.error("Error approving certification:", error);
        }
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
                                    <span>{org.name}</span>
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
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Government;
