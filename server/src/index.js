import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Forge running on http://localhost:${PORT} [Supabase REST + NVIDIA AI]`);
});
