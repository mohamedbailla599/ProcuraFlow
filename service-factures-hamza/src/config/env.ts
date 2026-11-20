import dotenv from 'dotenv';
import path from 'path';

// Charger le fichier .env depuis la racine du microservice
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  const hasDb = process.env.DATABASE_URL || process.env.DB_URL;
  const hasCommandes = process.env.COMMANDES_SERVICE_URL || process.env.COMMANDES_URL;
  const hasReceptions = process.env.RECEPTIONS_SERVICE_URL || process.env.RECEPTIONS_URL;

  const missing: string[] = [];
  if (!hasDb) missing.push('DATABASE_URL (ou DB_URL)');
  if (!hasCommandes) missing.push('COMMANDES_SERVICE_URL (ou COMMANDES_URL)');
  if (!hasReceptions) missing.push('RECEPTIONS_SERVICE_URL (ou RECEPTIONS_URL)');

  if (missing.length > 0) {
    console.error(
      `❌ Variables d'environnement manquantes : ${missing.join(', ')}`
    );
    console.error('   Consultez le fichier .env.example pour la configuration.');
    process.exit(1);
  }
}

export interface AppEnv {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  COMMANDES_SERVICE_URL: string;
  RECEPTIONS_SERVICE_URL: string;
  REQUEST_TIMEOUT: number;
}

export const env: AppEnv = {
  PORT: parseInt(process.env.PORT || '8084', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Base de données : supporte DATABASE_URL ou DB_URL (docker-compose)
  DATABASE_URL:
    process.env.DATABASE_URL ||
    process.env.DB_URL ||
    'postgresql://test:test@localhost:5432/test_db',

  // URLs des microservices : supporte les variantes locales et docker
  COMMANDES_SERVICE_URL:
    process.env.COMMANDES_SERVICE_URL ||
    process.env.COMMANDES_URL ||
    'http://localhost:8082',

  RECEPTIONS_SERVICE_URL:
    process.env.RECEPTIONS_SERVICE_URL ||
    process.env.RECEPTIONS_URL ||
    'http://localhost:8083',

  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '3000', 10),
};

export default env;

