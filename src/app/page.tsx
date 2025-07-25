"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import Image from "next/image";
import est from "@/public/est.png";
import Link from "next/link";
import { FaRegBookmark } from "react-icons/fa";

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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    fetchMovies();
  }, [hasMounted]);

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
    setAddingId(showid);
    const { error } = await supabase
      .from("watch-list")
      .insert([{ id: showid }]);
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

  if (!hasMounted) return null;

  return (
    <main>
      <div className="top-bar">
        <div className="top-texts">
          <span>
            <a className=" addwatch" href="/add-watch">
              + Add Watch
            </a>
          </span>
          <span>Trending</span>
          <span>New Releases</span>
          <span>Top Rated</span>
          {/* Search input */}
          <div style={{ textAlign: "right", margin: "20px" }}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-container"
            />
          </div>
        </div>
      </div>

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

      <button className="watchlist">
        <FaRegBookmark />
        <a href="/watch-list">WatchList</a>
      </button>

      {/* Movie grid */}
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
