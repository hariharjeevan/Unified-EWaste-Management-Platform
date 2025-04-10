//Government Page
"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RecyclerGraph = () => {
    const [recyclerData, setRecyclerData] = useState<{ name: string; acceptedQueries: number }[]>([]);

    useEffect(() => {
        const fetchRecyclerData = async () => {
            try {
                const recyclersCollection = collection(db, "recyclers");
                const recyclerSnapshot = await getDocs(recyclersCollection);
                const recyclerList = recyclerSnapshot.docs.map(doc => ({
                    name: doc.id,
                    acceptedQueries: doc.data().acceptedQueries || 0
                }));
                setRecyclerData(recyclerList);
            } catch (error) {
                console.error("Error fetching recyclers:", error);
            }
        };

        fetchRecyclerData();
    }, []);

    return (
        <>
        <Navbar links={[{ label: "Docs", href: "/docs", tooltip:"Refer to the website's documentation" }, { label: "About", href: "/about", tooltip:"About the team behind UEMP" }]} />
        <div className="w-full min-h-screen bg-white flex justify-center items-center text-black">
            <div className="w-full max-w-4xl mt-10 bg-white p-6 rounded shadow-md">
                <h3 className="text-lg font-semibold mb-4">Recycler Query Acceptance</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={recyclerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="acceptedQueries" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <Footer />
    </>
    );
}

export default RecyclerGraph;
