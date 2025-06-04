// AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";

import { DocumentData } from 'firebase/firestore';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<DocumentData[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roleLoadingUid, setRoleLoadingUid] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');

  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions();

  // Fetch employees in same org as admin
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!auth.currentUser) {
        setEmployees([]);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          setError("Admin user document not found.");
          return;
        }

        const orgID = userDoc.data().orgID;
        if (!orgID) {
          setError("Organization ID missing in admin user document.");
          return;
        }

        const q = query(collection(db, 'users'), where('orgID', '==', orgID));
        const querySnapshot = await getDocs(q);
        setEmployees(querySnapshot.docs.map(doc => doc.data()));
      } catch (e: any) {
        console.error(e);
        setError("Failed to fetch employees.");
      }
    };

    fetchEmployees();
  }, [db, auth, success]); // refetch employees on success

  // Clear success/error messages after 5s
  useEffect(() => {
    if (success || error) {
      const timeout = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [success, error]);

  // Invite new user (adminCreateUser cloud function)
  const handleInvite = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!auth.currentUser) {
        setError("No authenticated user found");
        setIsLoading(false);
        return;
      }

      // NOTE: No orgID sent here. Backend will derive from caller's profile.
      const createUser = httpsCallable(functions, "adminCreateUser");
      const result = await createUser({ email, role, name: employeeName });

      const data = result.data as { success: boolean };
      if (data?.success) {
        setSuccess("User invited and created successfully.");
        setEmail("");
      } else {
        setError("User creation failed.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error inviting user");
    } finally {
      setIsLoading(false);
    }
  };

  // Update user role by calling the cloud function to update Auth custom claims + Firestore
  const handleRoleChange = async (employeeId: string, newRole: string) => {
    setRoleLoadingUid(employeeId);
    setError(null);
    setSuccess(null);

    try {
      const setUserRole = httpsCallable(functions, "setUserRole");
      const result = await setUserRole({ uid: employeeId, role: newRole });

      const data = result.data as { message?: string };
      setSuccess(data.message || "Role updated successfully");
      await auth.currentUser?.getIdToken(true);

      // Refetch employees to update UI with new roles
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const orgID = userDoc.exists() ? userDoc.data().orgID : null;
      if (orgID) {
        const q = query(collection(db, 'users'), where('orgID', '==', orgID));
        const querySnapshot = await getDocs(q);
        setEmployees(querySnapshot.docs.map(doc => doc.data()));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error updating role");
    } finally {
      setRoleLoadingUid(null);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto mt-6 p-4 sm:p-8 bg-white rounded-3xl shadow-2xl border border-gray-200">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-green-500 tracking-tight text-center">Admin Dashboard</h1>
      {error && (
      <p className="text-red-800 bg-red-100 px-4 py-3 rounded-lg mb-4 border border-red-200 text-center">{error}</p>
      )}
      {success && (
      <p className="text-green-800 bg-green-100 px-4 py-3 rounded-lg mb-4 border border-green-200 text-center">{success}</p>
      )}

      <div className="mb-10 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow flex flex-col gap-4 border border-blue-100">
      <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-green-800">Invite Employee</h2>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
        <input
        type="text"
        value={employeeName}
        onChange={(e) => setEmployeeName(e.target.value)}
        placeholder="Employee Name"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg border border-gray-300 text-base text-black min-w-0 flex-1 outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm"
        />
        <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Employee Email"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg border border-gray-300 text-base text-black min-w-0 flex-1 outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm"
        />
        <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={isLoading}
        className="px-4 py-2 rounded-lg border border-gray-300 text-base text-black bg-white shadow-sm min-w-[120px]"
        >
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
        </select>
        <button
        onClick={handleInvite}
        disabled={isLoading || !email}
        className={`px-6 py-2 rounded-lg font-semibold text-base transition-all duration-150 ${isLoading || !email
          ? "bg-blue-200 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          } text-white shadow mt-2 sm:mt-0`}
        >
        {isLoading ? "Sending..." : "Send Invitation"}
        </button>
      </div>
      </div>

      <div>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-green-800">Employees</h2>
      <div className="max-h-[400px] overflow-y-auto pr-2">
        <ul className="list-none p-0">
        {employees.map((employee, idx) => (
          <li
            key={employee.uid || employee.email || idx}
            className="bg-gray-50 text-black mb-4 px-4 sm:px-6 py-4 sm:py-5 rounded-xl shadow flex flex-col sm:flex-row items-start sm:items-center border border-gray-200 gap-3 sm:gap-0"
          >
            <div className="flex-1 flex items-center min-w-0">
              <span className="truncate font-medium text-base sm:text-lg">{employee.email}</span>
            </div>
            <span className="w-full sm:w-32 flex-shrink-0 flex justify-start sm:justify-center">
              <span className={`inline-block text-center text-base font-semibold px-4 py-1 rounded-full
          ${employee.role === 'admin'
            ? 'bg-blue-100 text-red-500 border border-blue-200'
            : 'bg-gray-200 text-gray-700 border border-gray-300'
          }`}>
          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
              </span>
            </span>
            {employee.role !== 'admin' && (
              <span className="flex gap-2 mt-2 sm:mt-0 ml-0 sm:ml-6 w-full sm:w-auto">
          <button
            onClick={() => handleRoleChange(employee.uid, 'admin')}
            disabled={roleLoadingUid === employee.uid || employee.role === 'admin'}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 ${employee.role === 'admin'
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
              } ${roleLoadingUid === employee.uid ? "opacity-70" : ""} w-full sm:w-auto`}
          >
            {employee.role !== 'admin' &&
              (roleLoadingUid === employee.uid ? "..." : "Make Admin")}
          </button>
          <button
            onClick={() => handleRoleChange(employee.uid, 'employee')}
            disabled={roleLoadingUid === employee.uid || employee.role === 'employee'}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-150 ${employee.role === 'employee'
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
              } ${roleLoadingUid === employee.uid ? "opacity-70" : ""} w-full sm:w-auto`}
          >
            {roleLoadingUid === employee.uid && employee.role !== 'employee' ? "..." : "Demote"}
          </button>
              </span>
            )}
          </li>
        ))}
        </ul>
        {employees.length === 0 && (
        <div className="text-gray-400 text-center mt-10 text-lg font-medium">
          No employees found.
        </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
