"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import Link from "next/link";

type Movie = {
  id: number;
  title: string;
  season: number;
  episode: number;
  date: string;
  genre: string;
  link: string;
  status: string;
};

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    const { data, error } = await supabase.from("est").select("*");
    if (data === null) {
      setMovies([]);
      return;
    }
    if (error) {
      console.error("Fetch error:", error);
    } else {
      setMovies(data);
    }
  }

  return (
    <main>
      <h1>Movie List</h1>
      <button>
        <a href="/add-watch">Add watch</a>
      </button>
      <div className="movie-grid">
        {movies.length === 0 ? (
          <p>No movies found.</p>
        ) : (
          movies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <h3>{movie.title}</h3>
              <p>Season: {movie.season}</p>
              <p>Episode: {movie.episode}</p>
              <p>Date: {movie.date}</p>
              <p>Genre: {movie.genre}</p>
              <p>Status: {movie.status}</p>
              <a href={movie.link} target="_blank" rel="noopener noreferrer">
                More
              </a>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
