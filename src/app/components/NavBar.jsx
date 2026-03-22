"use client";

import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyProfileModal from "./MyProfileModal";

export default function Navbar() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    const getRole = localStorage.getItem("userRole");
    if (getRole) {
      setRole(getRole);
    }
    const getProfile = localStorage.getItem("userProfile");
    if (getProfile) {
      setProfile(JSON.parse(getProfile));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    router.push("/login");
  };

  return (
    <nav className="w-full bg-primary text-white shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="" className="text-xl font-bold hover:opacity-90">
          Car Rental System
        </a>
        <div className="flex gap-6 text-sm font-medium">
          {role === "admin" && (
            <>
              <a href="/" className="hover:text-gray-200">
                Car Register
              </a>
              <a href="/customers" className="hover:text-gray-200">
                Customer
              </a>
              <a href="/rental" className="hover:text-gray-200">
                Rental
              </a>
              <a href="/return" className="hover:text-gray-200">
                Return
              </a>
               <a href="/today-rental" className="hover:text-gray-200">
                Status
              </a>


              <button onClick={handleLogout} className="hover:text-gray-200">
                Logout
              </button>
            </>
          )}
          {role === "customer" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="hover:underline text-left"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="text-left hover:underline"
              >
                Logout
              </button>

              <img className="min-w-10 h-10 rounded-full" src={profile.img} />
            </div>
          )}
        </div>
      </div>
      <MyProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
      />
    </nav>
  );
}
