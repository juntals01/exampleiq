import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "exampleiq.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");

    db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
}

export interface Contact {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export function findContactByPhone(phone: string): Contact | undefined {
  const db = getDb();
  const normalized = phone.replace(/[\s\-().]/g, "");
  return db
    .prepare(
      `SELECT * FROM contacts WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'.','') = ?`
    )
    .get(normalized) as Contact | undefined;
}

export function upsertContact(
  phone: string,
  firstName: string,
  lastName: string,
  email: string
): Contact {
  const db = getDb();
  const existing = findContactByPhone(phone);
  if (existing) {
    db.prepare(
      `UPDATE contacts SET first_name = ?, last_name = ?, email = ? WHERE id = ?`
    ).run(firstName, lastName, email, existing.id);
    return { ...existing, first_name: firstName, last_name: lastName, email };
  }
  const result = db
    .prepare(
      `INSERT INTO contacts (phone, first_name, last_name, email) VALUES (?, ?, ?, ?)`
    )
    .run(phone, firstName, lastName, email);
  return {
    id: Number(result.lastInsertRowid),
    phone,
    first_name: firstName,
    last_name: lastName,
    email,
    created_at: new Date().toISOString(),
  };
}
