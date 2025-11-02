// ========================================
// CONFIGURACIÓN SUPABASE
// Las claves se centralizan aquí para facilitar la migración y evitar exponerlas en el HTML principal.
// ========================================
const SUPABASE_URL = 'https://sbgyynztbzbecjvmcjym.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZ3l5bnp0YnpiZWNqdm1janltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTgxNTAsImV4cCI6MjA3NzY3NDE1MH0.EgELqDHTW_a3Id2TCimRLZuZNMX8qq9mNt67Luj8OuM';
        
// Inicializar el cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);