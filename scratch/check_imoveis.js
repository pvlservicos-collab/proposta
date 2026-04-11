
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xwoxkooeiujuogpcpgae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3hrb29laXVqdW9ncGNwZ2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjU1NzgsImV4cCI6MjA5MTQwMTU3OH0.VgBGBWrAilyPeTs7246JRiJis7IPR2Dr_tMTd0Ke7jI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImoveis() {
    console.log('--- Buscando todos os imóveis (ativos e inativos) ---');
    const { data, error } = await supabase
        .from('imoveis')
        .select('*');
    
    if (error) {
        console.error('Erro:', error);
        return;
    }
    
    console.log(`Total encontrado: ${data.length}`);
    data.forEach(im => {
        console.log(`ID: ${im.id} | Nome: ${im.nome} | Ativo: ${im.ativo}`);
    });
}

checkImoveis();
