import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'pglite-server';
import path from 'path';
import fileURLToPath from 'url';

const dataDir = path.resolve(process.cwd(), 'backend', 'prisma', 'pgdata');
console.log(`[PGlite] Initializing embedded Postgres database at: ${dataDir}`);

const db = new PGlite(dataDir);
const server = createServer(db);

const PORT = 5432;

server.listen(PORT, () => {
  console.log(`[PGlite] Embedded PostgreSQL server ready and listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[PGlite] Port ${PORT} is already in use (External PostgreSQL or another PGlite instance running).`);
  } else {
    console.error('[PGlite] Server error:', err);
  }
});
