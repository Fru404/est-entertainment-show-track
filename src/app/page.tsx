"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import Image from "next/image";
import est from "@/public/est.png";
import Link from "next/link";
import { FaRegBookmark, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js"; // ✅ FIX

type Movie = {
  id: number;
  title: string;
  season: number;
  episode: number;
  start_date: string;
  end_date: string;
  genre: string;
  link: string;
  status: string;
  rating: number;
};

type MovieWithTimer = Movie & {
  timer: string;
  computedStatus: string;
};

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [movies, setMovies] = useState<MovieWithTimer[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [session, setSession] = useState<Session | null>(null); // ✅ FIX
  const router = useRouter();
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    fetchMovies();
  }, [hasMounted]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasMounted || movies.length === 0) return;

    const interval = setInterval(() => {
      setMovies((prevMovies) =>
        prevMovies.map((movie) => ({
          ...movie,
          timer: getNextEpisodeCountdown(movie.start_date),
          computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [hasMounted, movies.length]);

  useEffect(() => {
    if (!session) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("user-data")
        .select("username")
        .eq("email", session.user.email)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]);

  function generateUserId(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function fetchMovies() {
    const { data, error } = await supabase.from("est").select("*");
    if (error || data === null) {
      setMovies([]);
      return;
    }

    const enrichedData = data.map((movie) => ({
      ...movie,
      timer: "",
      computedStatus: "",
    }));

    enrichedData.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    setMovies(enrichedData);
  }

  async function addWatchlist(showid: number) {
    if (!session) {
      alert("Signin to add to watchlist");
      setShowModal(true);
      return;
    }

    setAddingId(showid);
    const { error } = await supabase.from("watch-list").insert([
      {
        id: showid,
        username: profile ? profile.username : session.user.email,
      },
    ]);
    setAddingId(null);

    if (error) {
      alert(`Failed to add: ${error.message}`);
    } else {
      alert("Added to watchlist!");
    }
  }

  async function handleRating(movieId: number, rating: number) {
    const { error } = await supabase
      .from("est")
      .update({ rating })
      .eq("id", movieId);

    if (!error) {
      setMovies((prevMovies) =>
        prevMovies.map((movie) =>
          movie.id === movieId ? { ...movie, rating } : movie
        )
      );
    } else {
      console.error("Failed to update rating:", error.message);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!hasMounted) return null;

  return (
    <main>
      <div className="top-bar">
        <span>
          <Link href="/">
            <Image
              src={est}
              alt="Logo"
              height={100}
              style={{ cursor: "pointer" }}
            />
          </Link>
        </span>
        <div className="burger-icon" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <FaTimes /> : <FaBars />}
        </div>

        <div className={`top-texts ${showMenu ? "show" : ""}`}>
          <span>
            <a className="addwatch" href="/add-watch">
              + Add Watch
            </a>
          </span>
          <span>
            <button className="watchlist">
              <Link href="/watch-list">WatchList</Link>
            </button>
          </span>
          <span>Trending</span>
          <span>New Releases</span>
          <span>Top Rated</span>
          <div>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-container"
            />
          </div>

          {!session ? (
            <span>
              <a className="addwatch" href="/signin">
                Sign in
              </a>
            </span>
          ) : (
            <div className="user-profile">
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt className="text-lg" /> log out
              </button>
              <a href="/profile">
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${session.user.email}`}
                  alt="User Avatar"
                  width={30}
                  height={30}
                  style={{ borderRadius: "50%", marginRight: "10px" }}
                />
              </a>
              <span style={{ fontSize: "0.8rem" }}>
                {profile ? profile.username : "Loading..."}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="movie-grid">
        {movies.length === 0 ? (
          <p>No movies found.</p>
        ) : (
          movies
            .filter((movie) =>
              movie.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((movie) => (
              <div key={movie.id} className="movie-card">
                <button
                  className="watchlist-btn"
                  onClick={() => addWatchlist(movie.id)}
                  disabled={addingId === movie.id}
                >
                  <FaRegBookmark />
                </button>
                <h3>{movie.title}</h3>
                <p>Season: {movie.season}</p>
                <p>Episode: {movie.episode}</p>
                <p>Start Date: {movie.start_date}</p>
                <p>End Date: {movie.end_date}</p>
                <p>Genre: {movie.genre}</p>
                <p>Status: {movie.computedStatus || "Loading..."}</p>
                {movie.computedStatus === "Ongoing" && movie.timer && (
                  <p>{movie.timer}</p>
                )}
                <a href={movie.link} target="_blank" rel="noopener noreferrer">
                  More
                </a>
                <div className="rating-container">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`hex-rating clickable ${
                        i < movie.rating ? "active" : ""
                      }`}
                      onClick={() => handleRating(movie.id, i + 1)}
                    >
                      <span>{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </main>
  );
}

// --- Logic Functions ---

function getEpisodeStatus(startDateStr: string, endDateStr: string): string {
  const now = new Date();
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (now < startDate) return "Soon";
  if (now > endDate) return "Finished";
  return "Ongoing";
}

function getNextEpisodeCountdown(startDateStr: string): string {
  const now = new Date();
  const startDate = new Date(startDateStr);
  const msInWeek = 7 * 24 * 60 * 60 * 1000;

  const weeksSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / msInWeek
  );
  const nextEpisodeDate = new Date(
    startDate.getTime() + (weeksSinceStart + 1) * msInWeek
  );

  if (now < nextEpisodeDate) {
    const timeDiff = nextEpisodeDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    return `Next episode in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else {
    return "Episode airing now or just released.";
  }
}
