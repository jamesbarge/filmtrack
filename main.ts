// TODO: Replace with your TMDB API key
const TMDB_API_KEY = '1dbfa774fad1a0b6c1d9bb59e21815d7';

interface Movie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  letterboxdUrl?: string;
}

async function fetchMovieDetails(id: number): Promise<Movie> {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
  );
  return response.json();
}

async function loadWatchlist(): Promise<{ id: number, url: string }[]> {
  const response = await fetch('watchlist_enriched.txt');
  const text = await response.text();
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const [id, url] = line.split(',');
      return { id: parseInt(id, 10), url };
    });
}

function createMovieElement(movie: Movie): HTMLElement {
  const div = document.createElement('div');
  div.className = 'movie';
  
  const title = document.createElement('h3');
  if (movie.letterboxdUrl) {
    const link = document.createElement('a');
    link.href = movie.letterboxdUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = movie.title;
    title.appendChild(link);
  } else {
    title.textContent = movie.title;
  }
  
  const date = document.createElement('p');
  date.textContent = new Date(movie.release_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  div.appendChild(title);
  div.appendChild(date);
  return div;
}

function groupMoviesByMonth(movies: Movie[]): Map<string, Movie[]> {
  const months = new Map<string, Movie[]>();
  
  movies.forEach(movie => {
    const date = new Date(movie.release_date);
    const monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    if (!months.has(monthKey)) {
      months.set(monthKey, []);
    }
    months.get(monthKey)!.push(movie);
  });
  
  return months;
}

function createMonthSection(month: string, movies: Movie[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'month';
  
  const heading = document.createElement('h2');
  heading.textContent = month;
  section.appendChild(heading);
  
  movies
    .sort((a, b) => new Date(a.release_date).getDate() - new Date(b.release_date).getDate())
    .slice(0, 10)
    .forEach(movie => {
      section.appendChild(createMovieElement(movie));
    });
  
  return section;
}

async function main() {
  try {
    const watchlist = await loadWatchlist();
    const moviePromises = watchlist.map(entry =>
      fetchMovieDetails(entry.id).then(movie => ({ ...movie, letterboxdUrl: entry.url }))
    );
    const movies = await Promise.all(moviePromises);
    
    const movies2025 = movies.filter(movie => {
      const year = new Date(movie.release_date).getFullYear();
      return year === 2025;
    });
    
    const months = groupMoviesByMonth(movies2025);
    const calendar = document.getElementById('calendar');
    
    if (calendar) {
      months.forEach((movies, month) => {
        calendar.appendChild(createMonthSection(month, movies));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 