"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";

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
  const [formData, setFormData] = useState<Omit<Movie, "id">>({
    title: "",
    season: 1,
    episode: 1,
    date: "",
    genre: "",
    link: "",
    status: "",
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    const { data, error } = await supabase.from("est").select("*");
    if (error) {
      console.error("Fetch error:", error);
    } else {
      setMovies(data);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "season" || name === "episode" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const randomId = Math.floor(Math.random() * 1_000_000) + 1;

    const { error } = await supabase.from("est").insert([
      {
        id: randomId,
        ...formData,
      },
    ]);

    if (error) {
      alert("Error adding movie: " + error.message);
    } else {
      alert("Movie added successfully!");
      setFormData({
        title: "",
        season: 1,
        episode: 1,
        date: "",
        genre: "",
        link: "",
        status: "",
      });
      fetchMovies();
    }
  };

  return (
    <main>
      <h1>Movie List</h1>

      <h2>Add a Movie</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="season"
          placeholder="Season"
          value={formData.season}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="episode"
          placeholder="Episode"
          value={formData.episode}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="genre"
          placeholder="Genre"
          value={formData.genre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="link"
          placeholder="Link"
          value={formData.link}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="status"
          placeholder="Status"
          value={formData.status}
          onChange={handleChange}
          required
        />
        <button type="submit">Submit</button>
      </form>

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <h3>{movie.title}</h3>
            <p>Season: {movie.season}</p>
            <p>Episode: {movie.episode}</p>
            <p>Date: {movie.date}</p>
            <p>Genre: {movie.genre}</p>
            <p>Status: {movie.status}</p>
            <a href={movie.link} target="_blank" rel="noopener noreferrer">
              Watch
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
