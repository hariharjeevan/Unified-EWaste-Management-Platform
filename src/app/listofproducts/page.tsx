import { Suspense } from "react";
import ListOfProductsClient from "./ListOfProductsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListOfProductsClient />
    </Suspense>
  );
}