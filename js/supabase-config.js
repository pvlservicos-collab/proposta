// js/supabase-config.js
const supabaseUrl = 'https://xwoxkooeiujuogpcpgae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3hrb29laXVqdW9ncGNwZ2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjU1NzgsImV4cCI6MjA5MTQwMTU3OH0.VgBGBWrAilyPeTs7246JRiJis7IPR2Dr_tMTd0Ke7jI';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
// Substituindo o objeto global da biblioteca pela instância do cliente para compatibilidade
window.supabase = supabaseClient;

// Referência para a tabela de imóveis
var imoveisTable = 'imoveis';
var imoveisBucket = 'imoveis';

console.log('✅ Supabase inicializado com sucesso!');
