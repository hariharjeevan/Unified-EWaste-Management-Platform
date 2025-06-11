"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, deleteField, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";

const functions = getFunctions(undefined, "asia-east2");
const sendRejectionEmail = httpsCallable(functions, "sendRejectionEmail");

interface QueryDetails {
    queryId: string;
    productId: string;
    serialNumber: string;
    productName: string;
    status: string;
    consumerName: string;
    consumerEmail: string;
    consumerPhone: string;
    consumerAddress: string;
    recyclerId: string;
    consumerId: string;
    finishedAt?: string | { seconds: number; nanoseconds?: number };
}

const QueryStatusPage = () => {
    const [rejectedQueries, setRejectedQueries] = useState<QueryDetails[]>([]);
    const [finishedQueries, setFinishedQueries] = useState<QueryDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReasonFor, setShowReasonFor] = useState<string | null>(null);
    const [reason, setReason] = useState<{ [queryId: string]: string }>({});
    const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
    const [emailSentFor, setEmailSentFor] = useState<{ [queryId: string]: boolean }>({});

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setRejectedQueries([]);
                setFinishedQueries([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const db = getFirestore();
                const queriesDocRef = doc(db, "Queries", user.uid);
                const queriesDocSnap = await getDoc(queriesDocRef);
                if (!queriesDocSnap.exists()) {
                    setRejectedQueries([]);
                    setFinishedQueries([]);
                    setLoading(false);
                    return;
                }
                const queriesObj = queriesDocSnap.data()?.queries || {};
                const rejected = Object.entries(queriesObj)
                    .filter(([_, q]: any) => q.status === "rejected")
                    .map(([queryId, q]: any) => ({
                        queryId,
                        productId: q.productId,
                        serialNumber: q.serialNumber,
                        productName: q.productName,
                        status: q.status,
                        consumerName: q.consumerName,
                        consumerEmail: q.consumerEmail || "",
                        consumerPhone: q.consumerPhone,
                        consumerAddress: q.consumerAddress,
                        recyclerId: user.uid,
                        consumerId: q.consumerId,
                    }));
                setRejectedQueries(rejected);

                const finished = Object.entries(queriesObj)
                    .filter(([_, q]: any) => q.recyclingStatus === "finished")
                    .map(([queryId, q]: any) => ({
                        queryId,
                        productId: q.productId,
                        serialNumber: q.serialNumber,
                        productName: q.productName,
                        status: q.status,
                        consumerName: q.consumerName,
                        consumerEmail: q.consumerEmail || "",
                        consumerPhone: q.consumerPhone,
                        consumerAddress: q.consumerAddress,
                        recyclerId: user.uid,
                        consumerId: q.consumerId,
                        finishedAt: q.finishedAt || "",
                    }));
                setFinishedQueries(finished);

            } catch (err) {
                setRejectedQueries([]);
                setFinishedQueries([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSendEmail = async (query: QueryDetails) => {
        const reasonText = reason[query.queryId] || "";
        if (!query.consumerEmail) {
            alert("No consumer email found for this query.");
            return;
        }
        if (!reasonText.trim()) {
            alert("Please enter a reason before sending the email.");
            return;
        }
        setSendingEmailFor(query.queryId);
        try {
            await sendRejectionEmail({
                consumerEmail: query.consumerEmail,
                productName: query.productName,
                reason: reasonText,
            });
            alert("Email sent!");
            setShowReasonFor(null);
            setReason((prev) => ({ ...prev, [query.queryId]: "" }));
            setEmailSentFor((prev) => ({ ...prev, [query.queryId]: true }));
        } catch (err) {
            alert("Failed to send email.");
        }
        setSendingEmailFor(null);
    };

    const handleDeleteLog = async (query: QueryDetails) => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const db = getFirestore();
            const queriesDocRef = doc(db, "Queries", user.uid);
            await updateDoc(queriesDocRef, {
                [`queries.${query.queryId}`]: deleteField(),
            });
            setRejectedQueries((prev) => prev.filter(q => q.queryId !== query.queryId));
        } catch (err) {
            alert("Failed to delete log.");
        }
    };

    return (
        <>
            <Navbar
                links={[
                    { label: "Recycler", href: "/recycler", tooltip: "Go to your dashboard" },
                    { label: "Docs", href: "/docs", tooltip: "Refer to the website's documentation", },
                    { label: "About", href: "/about", tooltip: "About the team behind UEMP" },
                ]}
            />
            <div className="min-h-screen bg-gray-100 py-12 px-4">
                <div className="max-w-2xl mx-auto p-10 rounded-2xl shadow-2xl bg-white mt-14 mb-14">
                    <h1 className="text-3xl font-extrabold mb-8 text-green-700 flex items-center gap-2">
                        Rejected Recycling Queries
                    </h1>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Spinner size={40} color="#16a34a" />
                            <span className="mt-4 text-lg text-gray-600">Loading rejected queries...</span>
                        </div>
                    ) : rejectedQueries.length === 0 ? (
                        <div className="flex flex-col items-center py-20">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"></path>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <p className="text-gray-500 text-lg">No rejected queries found.</p>
                        </div>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto pr-2">
                            <ul className="space-y-8">
                                {rejectedQueries.map((query) => (
                                    <li
                                        key={query.queryId}
                                        className="p-8 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-blue-50"
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                            <div>
                                                <p className="font-semibold text-lg text-green-900">
                                                    <span className="text-gray-500">Product:</span> {query.productName}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Consumer:</span> {query.consumerName}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Email:</span> {query.consumerEmail}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"></path>
                                                    </svg>
                                                    {query.status}
                                                </span>
                                            </div>
                                        </div>
                                        {showReasonFor === query.queryId && !emailSentFor[query.queryId] ? (
                                            <div className="my-6">
                                                <textarea
                                                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                                                    rows={3}
                                                    value={reason[query.queryId] || ""}
                                                    onChange={(e) =>
                                                        setReason((prev) => ({
                                                            ...prev,
                                                            [query.queryId]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Enter reason for rejection"
                                                />
                                                <div className="flex gap-4 mt-4">
                                                    <button
                                                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center min-w-[120px] font-semibold shadow"
                                                        onClick={() => handleSendEmail(query)}
                                                        disabled={sendingEmailFor === query.queryId}
                                                    >
                                                        {sendingEmailFor === query.queryId ? (
                                                            <Spinner size={20} />
                                                        ) : (
                                                            "Send Email"
                                                        )}
                                                    </button>
                                                    <button
                                                        className="bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-400 font-semibold"
                                                        onClick={() => setShowReasonFor(null)}
                                                        disabled={sendingEmailFor === query.queryId}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : emailSentFor[query.queryId] ? (
                                            <button
                                                className="mt-6 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-semibold shadow"
                                                onClick={() => handleDeleteLog(query)}
                                            >
                                                Delete Log
                                            </button>
                                        ) : (
                                            <button
                                                className="mt-6 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-semibold shadow"
                                                onClick={() => setShowReasonFor(query.queryId)}
                                            >
                                                Send Rejection Email
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="max-w-2xl mx-auto p-10 rounded-2xl shadow-2xl bg-white mt-14 mb-14">
                    <h1 className="text-3xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">
                        Finished Recycling Queries
                    </h1>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Spinner size={40} color="#2563eb" />
                            <span className="mt-4 text-lg text-gray-600">Loading finished queries...</span>
                        </div>
                    ) : finishedQueries.length === 0 ? (
                        <div className="flex flex-col items-center py-20">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"></path>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <p className="text-gray-500 text-lg">No finished queries found.</p>
                        </div>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto pr-2">
                            <ul className="space-y-8">
                                {finishedQueries.map((query) => (
                                    <li
                                        key={query.queryId}
                                        className="p-8 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-green-50"
                                    >
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                            <div>
                                                <p className="font-semibold text-lg text-blue-900">
                                                    <span className="text-gray-500">Product:</span> {query.productName}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Consumer:</span> {query.consumerName}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Email:</span> {query.consumerEmail}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Phone:</span> {query.consumerPhone}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Address:</span> {query.consumerAddress}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Recycling Finished At:</span>{" "}
                                                    {query.finishedAt && typeof query.finishedAt === "object" && "seconds" in query.finishedAt
                                                        ? new Date(query.finishedAt.seconds * 1000).toLocaleString()
                                                        : query.finishedAt || "N/A"}
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="text-gray-500">Recycling Status:</span> <span className="text-green-700 font-bold">finished</span>
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default QueryStatusPage;

