"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const consumer = () => {
return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f4]">
    {/* Navbar */}
    <Navbar links={[{ label: "", href: "" }]} />
    </div>
    );
}

export default consumer;