
import express from 'express';
import type { Request, Response } from 'express';
import { initDatabase } from '../server/db.js';
import { apiRouter } from '../server/routes.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        app: 'AgriTech',
        timestamp: new Date().toISOString(),
    });
});

// Cache initialization within each warm serverless instance.
let databaseReady: Promise<unknown> | undefined;

export default async function handler(req: Request, res: Response) {
    databaseReady ??= initDatabase().catch((error) => {
        databaseReady = undefined;
        throw error;
    });

    try {
        await databaseReady;
        app(req, res);
    } catch (error) {
        console.error('[AgriTech] API initialization failed:', error);
        if (!res.headersSent) {
            res.status(503).json({ message: 'API initialization failed.' });
        }
    }
}
