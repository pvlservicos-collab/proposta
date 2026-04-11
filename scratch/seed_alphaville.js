
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xwoxkooeiujuogpcpgae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3hrb29laXVqdW9ncGNwZ2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjU1NzgsImV4cCI6MjA5MTQwMTU3OH0.VgBGBWrAilyPeTs7246JRiJis7IPR2Dr_tMTd0Ke7jI';

const supabase = createClient(supabaseUrl, supabaseKey);

const imoveis = [
  {
    nome: "Mansão Alphaville 1 - Luxury Concept",
    localizacao: "Alphaville 1, Ponta Negra - Manaus",
    valor: 7500000,
    tipo: "residencial",
    descricao: "Uma joia arquitetônica no coração do Alphaville 1. Esta residência redefine o conceito de luxo em Manaus, com acabamentos em mármore italiano, sistema de automação total e uma vista definitiva para a área verde preservada.",
    detalhes: {
      quartos: 5,
      banheiros: 6,
      areaConstruida: 620,
      tamanhoTerreno: 800,
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    caracteristicas: ["Piscina", "Espaço Gourmet", "Academia Privada", "Automação", "Suíte Master"],
    imagens: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    ativo: true,
    datacriacao: new Date().toISOString(),
    slug: "mansao-alphaville-1-luxury-concept"
  },
  {
    nome: "Solar Alphaville 2 - Contemporâneo",
    localizacao: "Alphaville 2, Ponta Negra - Manaus",
    valor: 4200000,
    tipo: "residencial",
    descricao: "Projeto contemporâneo com foco em integração e iluminação natural. O Solar Alphaville 2 oferece um living com pé direito duplo e integração total com a área de lazer.",
    detalhes: {
      quartos: 4,
      banheiros: 5,
      areaConstruida: 450,
      tamanhoTerreno: 600,
      video_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4"
    },
    caracteristicas: ["Piscina", "Jardim", "Varanda Gourmet", "Energia Solar"],
    imagens: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    ativo: true,
    datacriacao: new Date().toISOString(),
    slug: "solar-alphaville-2-contemporaneo"
  }
];

async function seed() {
  console.log('🚀 Iniciando cadastro de imóveis Alphaville...');
  const { data, error } = await supabase.from('imoveis').insert(imoveis);
  if (error) {
    console.error('❌ Erro ao inserir:', error);
  } else {
    console.log('✅ Imóveis cadastrados com sucesso!');
  }
}

seed();
