import { Fournisseur, FournisseurRequest } from '../types/fournisseur';

export interface ParsedImportRow {
  tempId: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  rating?: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicateExisting: boolean;
  isDuplicateInFile: boolean;
  selected: boolean;
}

export interface ImportValidationResult {
  rows: ParsedImportRow[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize header name to standard property name
 */
export function normalizeHeader(rawHeader: string): string {
  const h = rawHeader
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[-_\s]+/g, '');

  if (['nom', 'name', 'fournisseur', 'societe', 'entreprise', 'raisonsociale', 'company'].includes(h)) {
    return 'nom';
  }
  if (['email', 'mail', 'courriel', 'adresseemail'].includes(h)) {
    return 'email';
  }
  if (['telephone', 'tel', 'phone', 'contact', 'gsm', 'mobile'].includes(h)) {
    return 'telephone';
  }
  if (['adresse', 'address', 'ville', 'city', 'localisation', 'siege'].includes(h)) {
    return 'adresse';
  }
  if (['note', 'rating', 'score', 'evaluation', 'etoiles', 'stars'].includes(h)) {
    return 'rating';
  }
  return h;
}

/**
 * Robust CSV parser that auto-detects delimiter (, or ; or \t)
 * and correctly handles multiline and quoted strings.
 */
export function parseCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  if (!clean) return [];

  // Detect delimiter from the first line
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: ""
          currentField += '"';
          i++; // skip next quote
        } else {
          // End of quoted field
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n in CRLF
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if any
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse an Excel file (.xlsx or .xls) from an ArrayBuffer using lazy-loaded SheetJS
 */
export async function parseExcel(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  return rawRows.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => (cell !== undefined && cell !== null ? String(cell).trim() : ''))
  );
}

/**
 * Validate and analyze raw rows against current catalogue
 */
export function validateImportData(
  rawMatrix: string[][],
  existingSuppliers: Fournisseur[]
): ImportValidationResult {
  if (rawMatrix.length < 2) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      errorCount: 0,
    };
  }

  // Header row
  const rawHeaders = rawMatrix[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  const nomIdx = normalizedHeaders.indexOf('nom');
  const emailIdx = normalizedHeaders.indexOf('email');
  const telIdx = normalizedHeaders.indexOf('telephone');
  const adresseIdx = normalizedHeaders.indexOf('adresse');
  const ratingIdx = normalizedHeaders.indexOf('rating');

  const existingEmailsSet = new Set(
    existingSuppliers
      .map((f) => f.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e))
  );

  const seenEmailsInFile = new Map<string, number>(); // email -> first seen index

  const rows: ParsedImportRow[] = [];

  for (let i = 1; i < rawMatrix.length; i++) {
    const rawRow = rawMatrix[i];
    // Skip empty lines
    if (!rawRow || rawRow.every((val) => !val || val.trim() === '')) {
      continue;
    }

    const nom = nomIdx !== -1 && rawRow[nomIdx] ? rawRow[nomIdx].trim() : '';
    const email = emailIdx !== -1 && rawRow[emailIdx] ? rawRow[emailIdx].trim() : '';
    const telephone = telIdx !== -1 && rawRow[telIdx] ? rawRow[telIdx].trim() : '';
    const adresse = adresseIdx !== -1 && rawRow[adresseIdx] ? rawRow[adresseIdx].trim() : '';
    const rawRating = ratingIdx !== -1 && rawRow[ratingIdx] ? rawRow[ratingIdx].trim() : '';

    let rating: number | undefined = undefined;
    if (rawRating) {
      const parsedRating = parseFloat(rawRating.replace(',', '.'));
      if (!isNaN(parsedRating) && parsedRating >= 1.0 && parsedRating <= 5.0) {
        rating = Math.round(parsedRating * 10) / 10;
      }
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let isDuplicateExisting = false;
    let isDuplicateInFile = false;

    // Validate Nom
    if (!nom) {
      errors.push('Le nom du fournisseur est obligatoire');
    } else if (nom.length < 2) {
      errors.push('Le nom doit comporter au moins 2 caractères');
    } else if (nom.length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères');
    }

    // Validate Email
    const lowerEmail = email.toLowerCase();
    if (!email) {
      errors.push("L'adresse e-mail est obligatoire");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("Format d'adresse e-mail invalide");
    } else {
      // Check existing in DB / store
      if (existingEmailsSet.has(lowerEmail)) {
        isDuplicateExisting = true;
        errors.push('Adresse e-mail déjà enregistrée dans le catalogue');
      }

      // Check duplicate in file
      if (seenEmailsInFile.has(lowerEmail)) {
        isDuplicateInFile = true;
        errors.push(`Doublon détecté dans ce fichier (identique à la ligne ${(seenEmailsInFile.get(lowerEmail) || 0) + 1})`);
      } else {
        seenEmailsInFile.set(lowerEmail, rows.length);
      }
    }

    // Optional telephone warnings
    if (telephone && telephone.length < 6) {
      warnings.push('Numéro de téléphone court ou inhabituel');
    }

    const isValid = errors.length === 0;

    rows.push({
      tempId: `import-row-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nom,
      email,
      telephone,
      adresse,
      rating,
      isValid,
      errors,
      warnings,
      isDuplicateExisting,
      isDuplicateInFile,
      selected: isValid, // By default, only select valid rows
    });
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const duplicateCount = rows.filter((r) => r.isDuplicateExisting || r.isDuplicateInFile).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  return {
    rows,
    totalRows: rows.length,
    validCount,
    duplicateCount,
    errorCount,
  };
}

/**
 * Generate a ready-to-download CSV template
 */
export function generateCSVTemplate(): string {
  const headers = ['nom', 'email', 'telephone', 'adresse', 'note'];
  const sampleRows = [
    [
      '"Atlas Équipements SARL"',
      '"contact@atlas-equipements.ma"',
      '"+212 5 22 45 67 89"',
      '"Boulevard Mohammed V, Casablanca"',
      '4.8',
    ],
    [
      '"Souss Logistique Distribution"',
      '"commercial@souss-logistique.ma"',
      '"+212 5 28 33 44 55"',
      '"Zone Industrielle Tassila, Agadir"',
      '4.5',
    ],
    [
      '"TechnoMaroc Solutions"',
      '"ventes@technomaroc.ma"',
      '"+212 5 37 88 12 34"',
      '"Avenue Allal Ben Abdellah, Rabat"',
      '4.2',
    ],
  ];

  return '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
}
