import { migrate, closeDb } from './db.js';

try {
  await migrate();
  console.log('migrations up to date');
} finally {
  await closeDb();
}
