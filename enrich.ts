// TODO: Replace with your TMDB API key
const TMDB_API_KEY = '1dbfa774fad1a0b6c1d9bb59e21815d7';
import { writeFile, readFile } from 'fs/promises';

interface LetterboxdMovie {
  Date: string;
  Name: string;
  Year: string;
  URL: string;
}

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  letterboxdUrl: string;
}

async function searchMovieByTitle(title: string, year: string): Promise<Omit<TMDBMovie, 'letterboxdUrl'> | null> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      return {
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching movie:', error);
    return null;
  }
}

async function loadWatchlist(): Promise<LetterboxdMovie[]> {
  const text = await readFile('watchlist.csv', 'utf-8');
  
  // Parse CSV
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1) // Skip header row
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const movie: any = {};
      headers.forEach((header, index) => {
        movie[header] = values[index];
      });
      return movie as LetterboxdMovie;
    })
    .filter(movie => movie.Name && movie.Year); // Filter out empty rows
}

async function main() {
  try {
    console.log('Loading watchlist...');
    const watchlist = await loadWatchlist();
    console.log(`Found ${watchlist.length} movies in watchlist`);

    // Filter for 2025 and later releases
    const filteredWatchlist = watchlist.filter(movie => {
      const year = parseInt(movie.Year, 10);
      return !isNaN(year) && year >= 2025;
    });

    console.log(`Found ${filteredWatchlist.length} movies from 2025 or later`);

    const enrichedMovies: TMDBMovie[] = [];
    
    for (const movie of filteredWatchlist) {
      console.log(`Searching for: ${movie.Name} (${movie.Year})`);
      const tmdbMovie = await searchMovieByTitle(movie.Name, movie.Year);
      
      if (tmdbMovie) {
        // We already filtered by year, but let's double check release date year
        const releaseYear = new Date(tmdbMovie.release_date).getFullYear();
         if (!isNaN(releaseYear) && releaseYear >= 2025) {
            console.log(`Found 2025+ release: ${tmdbMovie.title} (${tmdbMovie.release_date})`);
            enrichedMovies.push({ ...tmdbMovie, letterboxdUrl: movie.URL });
         }
      }
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    console.log(`Found ${enrichedMovies.length} 2025+ releases after TMDB search`);
    
    // Save to watchlist_enriched.txt (TMDB_ID,Letterboxd_URL)
    const output = enrichedMovies.map(movie => `${movie.id},${movie.letterboxdUrl}`).join('\n');
    await writeFile('public/watchlist_enriched.txt', output);
    
    console.log('Enriched watchlist saved to public/watchlist_enriched.txt');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 