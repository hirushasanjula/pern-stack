import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const {PGHOST, PGUSER, PGPASSWORD, PGDATABASE} = process.env;

export const sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
);