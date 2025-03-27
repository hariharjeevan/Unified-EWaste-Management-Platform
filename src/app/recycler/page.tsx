"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, wdb } from "@/firebaseConfig";
import { AiOutlineSearch } from "react-icons/ai";
import { collection, doc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.7041, // Default to New Delhi
  lng: 77.1025,
};

const RecyclerPage = () => {
  const router = useRouter();

  interface Product {
    id: string;
    productName: string;
    category: string;
    price: number;
    points: number;
    userId: string;
    desc: string;
    location?: { lat: number; lng: number };
  }

  const [user, setUser] = useState<User | null>(null);
  const [productArray, setProductArray] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [facilityLocation, setFacilityLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [facilityAddress, setFacilityAddress] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchFacilityLocation(currentUser.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const productsRef = collection(wdb, "recyclers", user.uid, "products");
        const querySnapshot = await getDocs(productsRef);

        const products: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, "id">),
        }));

        setProductArray(products);
        setFilteredProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchFacilityLocation = async (userId: string) => {
    try {
      const facilityDocRef = doc(wdb, "recyclers", userId);
      const docSnapshot = await getDoc(facilityDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data?.location) {
          setFacilityLocation(data.location);
          setFacilityAddress(data.address || null);
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching facility location:", error);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const filtered = productArray.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue)
    );

    setFilteredProducts(filtered);
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const selectedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      setFacilityLocation(selectedLocation);
      await fetchAddressFromCoords(selectedLocation.lat, selectedLocation.lng);
    }
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing.");
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setFacilityAddress(formattedAddress);
      } else {
        console.error("Geocoding failed:", data.status);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const saveFacilityLocation = async () => {
    if (!user || !facilityLocation || !facilityAddress) return;

    try {
      await setDoc(
        doc(wdb, "recyclers", user.uid),
        { location: facilityLocation, address: facilityAddress },
        { merge: true }
      );
      alert("Facility location and address saved successfully!");
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  return (
    <>
      <Navbar links={[{ label: "Home", href: "/" }]} />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="relative w-full max-w-2xl p-4">
          <div className="flex items-center border rounded-lg shadow-md bg-white p-2">
            <AiOutlineSearch className="text-gray-600 mx-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {loading ? (
            <p className="text-gray-600">Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} passHref>
                <div className="p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-900">{product.productName}</h3>
                  <p className="text-gray-600">Category: {product.category}</p>
                  <p className="text-gray-800">Price: ₹{product.price}</p>
                  <p className="text-green-600 font-bold">Total Price: {product.points}</p>
                  <p className="text-gray-500 text-sm">{product.desc}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-600">No products found.</p>
          )}
        </div>

        <button
          onClick={() => router.push("/service")}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Add Product
        </button>

        <div className="w-full max-w-4xl p-6 mt-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Your Recycling Facility Address</h2>
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap mapContainerStyle={mapContainerStyle} center={facilityLocation || defaultCenter} zoom={10} onClick={handleMapClick}>
              {facilityLocation && <Marker position={facilityLocation} />}
            </GoogleMap>
          </LoadScript>

          {facilityAddress && <p className="text-gray-700 mt-3">Selected Address: {facilityAddress} </p>}
          <p className="text-gray-700"></p>

          <button onClick={saveFacilityLocation} className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
            Save Location
          </button>
        </div>
      </div>
    </>
  );
};

export default RecyclerPage;