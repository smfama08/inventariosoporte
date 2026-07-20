declare const process: {
  env: {
    readonly NG_APP_SUPABASE_URL: string;
    readonly NG_APP_SUPABASE_KEY: string;
    readonly NG_APP_PRODUCTION?: string;
  };
};

export const environment = {
  production: process.env.NG_APP_PRODUCTION
    ? process.env.NG_APP_PRODUCTION === 'true'
    : true,
  supabaseUrl: process.env.NG_APP_SUPABASE_URL ?? '',
  supabaseKey: process.env.NG_APP_SUPABASE_KEY ?? '',
};
