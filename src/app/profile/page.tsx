"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import { Session } from "@supabase/supabase-js"; // ✅ FIX

export default function ProfilePage() {
  const [name, setName] = useState("");

  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/signin");
      } else {
        setSession(session);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const { error } = await supabase.from("user-data").insert([
      {
        username: name,
        email: session.user.email,
      },
    ]);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile saved!");
      router.push("/"); // Go to main page after saving
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>username:</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Save Profile
        </button>
      </form>
    </main>
  );
}
