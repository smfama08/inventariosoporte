const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const outputPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');

// Valores actuales en environment.ts (por si no hay fuente de variables).
let supabaseUrl = '';
let supabaseKey = '';
if (fs.existsSync(outputPath)) {
  const actual = fs.readFileSync(outputPath, 'utf-8');
  const mUrl = actual.match(/supabaseUrl:\s*'([^']*)'/);
  const mKey = actual.match(/supabaseKey:\s*'([^']*)'/);
  if (mUrl) supabaseUrl = mUrl[1];
  if (mKey) supabaseKey = mKey[1];
}

// 1) Prioridad: variables de entorno del sistema (Netlify, CI, etc.).
//    Se ignoran valores vacíos para no sobrescribir lo ya existente.
const sysUrl = (process.env.SUPABASE_URL || '').trim();
const sysKey = (process.env.SUPABASE_KEY || '').trim();
supabaseUrl = sysUrl || supabaseUrl;
supabaseKey = sysKey || supabaseKey;

// 2) Fallback: archivo .env local (desarrollo).
if ((!supabaseUrl || !supabaseKey) && fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
    if (key.trim() === 'SUPABASE_URL') supabaseUrl = supabaseUrl || value;
    if (key.trim() === 'SUPABASE_KEY') supabaseKey = supabaseKey || value;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠  No se encontraron SUPABASE_URL / SUPABASE_KEY en ninguna fuente.');
  console.warn('   El build funcionará pero la app no podrá conectar a Supabase.');
}

const production = process.env.NODE_ENV === 'production' || !!process.env.SUPABASE_URL;

const content = `export const environment = {
  production: ${production},
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
};
`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`✓ environment.ts generated (production: ${production}, supabaseUrl: ${supabaseUrl ? 'set' : 'EMPTY'})`);
