# Filmtrack 2025  
A one-page calendar that pulls up to ten 2025 releases per month from your Letterboxd watchlist.

## Setup
1. `pnpm install` (or `npm install`)
2. Copy your TMDB API key into `main.ts` where indicated.
3. Run `pnpm dev` then open the local URL.
4. Put your enriched watchlist ids into `watchlist_enriched.txt`, one id per line.
5. Build for production with `pnpm build`. 