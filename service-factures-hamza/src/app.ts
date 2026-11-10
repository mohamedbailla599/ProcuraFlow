import express, { Application, Request, Response } from 'express';
import factureRoutes from './routes/facture.routes';
import errorMiddleware from './middlewares/error.middleware';

const app: Application = express();

// --- Middlewares globaux ---
app.use(express.json());

// --- Routes ---
// Health check — vérification de l'état du service
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'service-factures',
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Routes des factures
app.use('/api/factures', factureRoutes);

// Route 404 pour les endpoints non définis
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
  });
});

// --- Middleware de gestion des erreurs (doit être en dernier) ---
app.use(errorMiddleware);

export default app;

