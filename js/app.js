// app.js
let todosImoveis = [];

// Formatar valor em Real
function formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(valor);
}

// Criar card de imóvel
function criarCardImovel(imovel) {
    const card = document.createElement('a');
    card.className = 'property-card';
    card.href = `imovel.html?id=${imovel.id}`;
    card.setAttribute('data-aos', 'fade-up');

    const imagemPrincipal = imovel.imagens && imovel.imagens.length > 0
        ? imovel.imagens[0]
        : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

    card.innerHTML = `
    <div class="property-image-container">
        <img src="${imagemPrincipal}" alt="${imovel.nome}" class="property-image">
        <div class="property-badge">${imovel.negocio || 'À Venda'}</div>
    </div>
    <div class="property-info">
      <div class="property-header">
        <h3 class="property-name">${imovel.nome}</h3>
        <div class="property-price">${formatarValor(imovel.valor)}</div>
      </div>
      <div class="property-location">
        <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> 
        ${imovel.localizacao}
      </div>
      
      ${imovel.detalhes ? `
        <div class="property-details">
          ${imovel.detalhes.quartos ? `
            <span class="property-detail">
                <i data-lucide="bed" style="width: 16px; height: 16px;"></i> 
                ${imovel.detalhes.quartos} Qts
            </span>` : ''}
          ${imovel.detalhes.banheiros ? `
            <span class="property-detail">
                <i data-lucide="bath" style="width: 16px; height: 16px;"></i> 
                ${imovel.detalhes.banheiros} Banh.
            </span>` : ''}
          ${imovel.detalhes.areaConstruida ? `
            <span class="property-detail">
                <i data-lucide="maximize" style="width: 16px; height: 16px;"></i> 
                ${imovel.detalhes.areaConstruida}m²
            </span>` : ''}
        </div>
      ` : ''}
    </div>
  `;

    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);

    return card;
}

// Popular filtro de bairros dinamicamente
function popularFiltros(imoveis) {
    const selectorBairros = document.getElementById('filtro-bairros');
    if (!selectorBairros) return;

    // Extrair bairros únicos (considerando que localizacao pode conter o bairro)
    // Se houver um campo específico de bairro no BD seria melhor, mas vamos inferir ou usar localizacao
    const bairros = [...new Set(imoveis.map(i => i.bairro || i.localizacao.split(',')[0].trim()))].sort();
    
    bairros.forEach(bairro => {
        const option = document.createElement('option');
        option.value = bairro;
        option.textContent = bairro;
        selectorBairros.appendChild(option);
    });
}

// Renderizar os grids com uma lista de imóveis
function renderizarGrids(imoveis) {
    const residenciaisGrid = document.getElementById('residenciais-grid');
    const comerciaisGrid = document.getElementById('comerciais-grid');

    if (residenciaisGrid) {
        residenciaisGrid.innerHTML = '';
        const residenciais = imoveis.filter(i => i.tipo === 'residencial');
        if (residenciais.length === 0) {
            residenciaisGrid.innerHTML = '<div class="empty-state"><p>Nenhum imóvel residencial encontrado.</p></div>';
        } else {
            residenciais.forEach(i => residenciaisGrid.appendChild(criarCardImovel(i)));
        }
    }

    if (comerciaisGrid) {
        comerciaisGrid.innerHTML = '';
        const comerciais = imoveis.filter(i => i.tipo === 'comercial');
        if (comerciais.length === 0) {
            comerciaisGrid.innerHTML = '<div class="empty-state"><p>Nenhum imóvel comercial encontrado.</p></div>';
        } else {
            comerciais.forEach(i => comerciaisGrid.appendChild(criarCardImovel(i)));
        }
    }
}

// Função de filtragem chamada pelo botão Buscar
function filtrarImoveis() {
    const bairro = document.getElementById('filtro-bairros').value;
    const tipo = document.getElementById('filtro-tipos').value;
    const precoMax = document.getElementById('filtro-precos').value;

    let filtrados = todosImoveis;

    if (bairro) {
        filtrados = filtrados.filter(i => (i.bairro || i.localizacao).includes(bairro));
    }

    if (tipo) {
        filtrados = filtrados.filter(i => i.subtipo?.toLowerCase() === tipo.toLowerCase() || i.nome.toLowerCase().includes(tipo.toLowerCase()));
    }

    if (precoMax) {
        filtrados = filtrados.filter(i => i.valor <= parseFloat(precoMax));
    }

    renderizarGrids(filtrados);
    
    // Scroll suave para os resultados
    document.getElementById('residenciais').scrollIntoView({ behavior: 'smooth' });
}

// Carregar imóveis do Supabase
async function carregarImoveis() {
    try {
        const { data: imoveis, error } = await supabase
            .from(imoveisTable)
            .select('*')
            .eq('ativo', true)
            .order('datacriacao', { ascending: false });

        if (error) throw error;

        todosImoveis = imoveis;
        popularFiltros(imoveis);
        renderizarGrids(imoveis);

    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        const errorMessage = '<div class="empty-state"><p>Erro ao carregar imóveis.</p></div>';
        if (document.getElementById('residenciais-grid')) document.getElementById('residenciais-grid').innerHTML = errorMessage;
    }
}

// Carregar quando a página estiver pronta
window.addEventListener('DOMContentLoaded', () => {
    carregarImoveis();
});