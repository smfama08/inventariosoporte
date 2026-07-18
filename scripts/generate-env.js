const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const outputPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');

let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
    if (key.trim() === 'SUPABASE_URL') supabaseUrl = value;
    if (key.trim() === 'SUPABASE_KEY') supabaseKey = value;
  }
} else {
  console.warn('⚠  No se encontró .env. Copia .env.example a .env y completa los valores.');
  console.warn('   El build funcionará pero la app no podrá conectar a Supabase.');
}

const content = `export const environment = {
  production: false,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
};
`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`✓ environment.ts generated (supabaseUrl: ${supabaseUrl ? 'set' : 'EMPTY'})`);
