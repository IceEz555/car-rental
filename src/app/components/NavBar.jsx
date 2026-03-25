"use client";

import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyProfileModal from "./MyProfileModal";

export default function Navbar() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [points, setPoints] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let channel;
    async function getUserRole() {
      const getRole = localStorage.getItem("userRole");
      if (getRole) {
        setRole(getRole);
      }
      const getProfile = localStorage.getItem("userProfile");
      if (getProfile) {
        const parsedProfile = JSON.parse(getProfile);
        setProfile(parsedProfile);
        
        if (getRole === "customer" && parsedProfile.id) {
          // 1. Fetch current points on load
          const { data } = await supabase
            .from("customers")
            .select("reward_points")
            .eq("id", parsedProfile.id)
            .single();
          if (data) {
            setPoints(data.reward_points || 0);
          }

          // 2. Subscribe to database changes (Realtime)
          channel = supabase
            .channel("realtime-points")
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "customers",
                filter: `id=eq.${parsedProfile.id}`,
              },
              (payload) => {
                if (payload.new && payload.new.reward_points !== undefined) {
                  setPoints(payload.new.reward_points || 0);
                }
              }
            )
            .subscribe();
        }
      }
    }
    
    getUserRole();

    // Cleanup subscription when component unmounts
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);


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
          {role === "customer" && profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full
              text-xs font-bold shadow-sm">
               ⭐ {points} Pts
              </div>
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
