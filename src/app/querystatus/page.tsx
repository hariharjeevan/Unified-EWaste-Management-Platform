"use client";

import { Suspense, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, deleteField, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import Navbar from "@/components/Navbar";
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
}

const QueryStatusPage = () => {
    const [rejectedQueries, setRejectedQueries] = useState<QueryDetails[]>([]);
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
            } catch (err) {
                setRejectedQueries([]);
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
                    {
                        label: "Docs",
                        href: "/docs",
                        tooltip: "Refer to the website's documentation",
                    },
                ]}
            />
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-2xl mx-auto p-6 text-black">
                    <h1 className="text-2xl font-bold mb-4">Rejected Recycling Queries</h1>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spinner size={40} color="#16a34a" />
                            <span className="mt-4 text-lg text-gray-600">Loading rejected queries...</span>
                        </div>
                    ) : rejectedQueries.length === 0 ? (
                        <p>No rejected queries found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {rejectedQueries.map((query) => (
                                <li key={query.queryId} className="p-4 border rounded shadow">
                                    <p>
                                        <strong>Product:</strong> {query.productName}
                                    </p>
                                    <p>
                                        <strong>Consumer:</strong> {query.consumerName}
                                    </p>
                                    <p>
                                        <strong>Status:</strong>{" "}
                                        <span className="text-red-600 font-semibold">
                                            {query.status}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Consumer Email:</strong> {query.consumerEmail}
                                    </p>
                                    {showReasonFor === query.queryId && !emailSentFor[query.queryId] ? (
                                        <div className="my-2">
                                            <textarea
                                                className="w-full px-2 py-1 border rounded"
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
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center justify-center min-w-[100px]"
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
                                                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-600"
                                                    onClick={() => setShowReasonFor(null)}
                                                    disabled={sendingEmailFor === query.queryId}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : emailSentFor[query.queryId] ? (
                                        <button
                                            className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                            onClick={() => handleDeleteLog(query)}
                                        >
                                            Delete Log
                                        </button>
                                    ) : (
                                        <button
                                            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                            onClick={() => setShowReasonFor(query.queryId)}
                                        >
                                            Send Rejection Email
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default QueryStatusPage;

