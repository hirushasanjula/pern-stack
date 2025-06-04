import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import { sql } from './config/db.js';
import {aj} from './lib/arcjet.js'
import path from 'path';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();

console.log(PORT);

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes
app.use(helmet({
    contentSecurityPolicy: false,
})); // Security middleware
app.use(morgan('dev'));

//apply arcjet rate-limit to all routes
app.use(async(req,res,next) => {
    try {
        const decision = await aj.protect(req, {
            requested : 1
        });

         if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                res.status(429).json({ error: "Too Many Requests" });
            } else if (decision.reason.isBot()) {
                res.status(403).json({ error: "Bot access denied" });
            } else {
                res.status(403).json({ error: "Forbidden" });
            }
            return;
        }

        // Check for spoofed bots - this should be done on the decision level
        if (decision.reason.isBot() && decision.reason.isSpoofed()) {
            res.status(403).json({error: "Spoofed bot detected, access denied."});
            return;
        }

        next();

    } catch (error) {
        console.error('Arcjet protection error:', error);
        next(error);
    }
})

// IMPORTANT: API routes must come BEFORE the catch-all route
app.use('/api/products', productRoutes);

// Production configuration - this should come AFTER API routes
if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname, '/frontend/dist')));
    
    // More specific catch-all route that excludes API routes
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
    });
}

async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255),
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT NOW()
            )
        `;

        console.log('Database initialized successfully');
    } catch (error) {
        console.log('Error initializing database:', error);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
 });
})