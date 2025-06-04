//Consumer register product page
"use client";

import { useEffect, Suspense } from "react";
import { auth } from "@/firebaseConfig";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

function ConsumerRegisterRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qr = searchParams.get("qr");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!qr) {
        router.replace("/consumer");
        return;
      }
      if (user) {
        router.replace(`/consumer/${user.uid}?qr=${encodeURIComponent(qr)}`);
      } else {
        router.replace(`/login?qr=${encodeURIComponent(qr)}`);
      }
    });
    return () => unsubscribe();
  }, [router, qr]);

  return <div className="text-center mt-10">Redirecting...</div>;
}

export default function ConsumerRegisterRedirect() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Redirecting...</div>}>
      <ConsumerRegisterRedirectInner />
    </Suspense>
  );
}