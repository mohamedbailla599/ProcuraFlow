import app from './app';
import env from './config/env';
import pool from './config/database';

const PORT = env.PORT;

// Vérifier la connexion à PostgreSQL au démarrage
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Connexion à PostgreSQL établie');

    app.listen(PORT, () => {
      console.log(`🚀 Service Factures démarré sur le port ${PORT}`);
      console.log(`   Environnement : ${env.NODE_ENV}`);
      console.log(`   Health check  : http://localhost:${PORT}/api/health`);
      console.log(`   API Factures  : http://localhost:${PORT}/api/factures`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ Impossible de se connecter à PostgreSQL :', err.message);
    console.error('   Vérifiez DATABASE_URL dans votre fichier .env');
    process.exit(1);
  });

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', async () => {
  console.log('🛑 Signal SIGTERM reçu. Arrêt du service...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Signal SIGINT reçu. Arrêt du service...');
  await pool.end();
  process.exit(0);
});

