// imovel.js
// Lógica para página de detalhes premium reformada

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(valor);
}

// Mapeamento de ícones para comodidades
const iconMap = {
  'Piscina': 'waves',
  'Churrasqueira': 'flame',
  'Jardim': 'tree-pine',
  'Garagem': 'car',
  'Varanda': 'layout',
  'Cozinha Gourmet': 'utensils',
  'Área de Serviço': 'washing-machine',
  'Despensa': 'archive',
  'Suíte Master': 'award',
  'Closet': 'shirt',
  'Lavabo': 'droplets',
  'Ar Condicionado': 'wind'
};

async function carregarImovel() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const imovelId = urlParams.get('id');

    if (!imovelId) throw new Error('ID do imóvel não encontrado');

    // Buscar imóvel
    const { data: imovel, error: imovError } = await supabase
      .from(imoveisTable)
      .select('*')
      .eq('id', imovelId)
      .single();

    if (imovError) throw imovError;

    // Buscar perfil (se falhar, usa padrão sem quebrar a página)
    let perfil = {
      nome: 'Victoria Sterling',
      cargo: 'Diretora de Vendas Premium',
      foto_url: 'img/vendedora.png',
      whatsapp: '5592961268651'
    };

    try {
      const { data: perfilData } = await supabase
        .from('perfil')
        .select('*')
        .eq('id', 1)
        .single();

      if (perfilData) perfil = perfilData;
    } catch (e) {
      console.warn('Perfil não encontrado, usando padrão.');
    }

    renderizarPagina(imovel, perfil);

  } catch (error) {
    console.error('❌ Erro:', error);
    document.body.innerHTML = `
      <div style="padding: 100px; text-align: center; color: white; background: #121212; height: 100vh;">
        <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 2.5rem;">Imóvel não encontrado</h2>
        <p style="margin: 20px 0; opacity: 0.7;">O link pode estar quebrado ou o imóvel foi removido.</p>
        <a href="index.html" style="color: #D4AF37; text-decoration: none; border: 1px solid #D4AF37; padding: 10px 20px; border-radius: 4px;">Voltar para o Início</a>
      </div>
    `;
  }
}

function renderizarPagina(imovel, perfil) {
  // 1. Galeria e Preço
  const displayPrice = document.getElementById('display-price');
  displayPrice.innerText = formatarValor(imovel.valor);

  const wrapper = document.getElementById('imageWrapper');
  const thumbWrapper = document.getElementById('thumbWrapper');

  if (imovel.imagens && imovel.imagens.length > 0) {
    // Galeria Principal
    wrapper.innerHTML = imovel.imagens.map(img => `
      <div class="swiper-slide"><img src="${img}"></div>
    `).join('');

    // Miniaturas
    thumbWrapper.innerHTML = imovel.imagens.map(img => `
      <div class="swiper-slide thumbs-slide"><img src="${img}"></div>
    `).join('');

    document.getElementById('photo-count').innerText = `1/${imovel.imagens.length}`;
  }

  // Inicializar Swiper de Miniaturas
  const thumbsSwiper = new Swiper('#thumbSwiper', {
    spaceBetween: 10,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,
    direction: window.innerWidth > 900 ? 'vertical' : 'horizontal',
    breakpoints: {
      901: { direction: 'vertical', slidesPerView: 5 },
      0: { direction: 'horizontal', slidesPerView: 4 }
    }
  });

  // Inicializar Swiper Principal
  new Swiper('#mainSwiper', {
    loop: true,
    spaceBetween: 0,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    thumbs: {
      swiper: thumbsSwiper,
    },
    on: {
      slideChange: function () {
        document.getElementById('photo-count').innerText = `${this.realIndex + 1}/${imovel.imagens ? imovel.imagens.length : 1}`;
      }
    }
  });

  // 1.5 Vídeo do YouTube — esconde a seção se não tiver URL válida
  const videoUrl = imovel.detalhes?.video_url;
  const videoSection = document.getElementById('video-section');
  const videoEmbed = document.getElementById('youtube-embed');

  if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
    let videoId = '';
    if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1].split('&')[0];
    } else {
      videoId = videoUrl.split('/').pop().split('?')[0];
    }

    if (videoId) {
      videoSection.style.display = 'block';
      videoEmbed.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${videoId}"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen></iframe>
      `;
    }
  }
  // se não tiver vídeo, a seção já começa hidden pelo CSS — não faz nada

  // 2. Info Básica
  document.getElementById('prop-name').innerText = imovel.nome;
  document.getElementById('prop-loc').innerText = imovel.localizacao;

  // Specs — esconde o bloco inteiro se não tiver valor (sem buraco na grid)
  function setSpec(elId, valor) {
    const el = document.getElementById(elId);
    if (!el) return;
    const item = el.closest('.spec-item');
    if (valor) {
      el.innerText = valor;
    } else if (item) {
      item.style.display = 'none';
    }
  }

  setSpec('spec-quarters', imovel.detalhes?.quartos ? `${imovel.detalhes.quartos}` : null);
  setSpec('spec-bathrooms', imovel.detalhes?.banheiros ? `${imovel.detalhes.banheiros}` : null);
  setSpec('spec-area', imovel.detalhes?.areaConstruida ? `${imovel.detalhes.areaConstruida} m²` : null);
  setSpec('spec-year', imovel.detalhes?.anoConstrucao || imovel.detalhes?.ano || null);

  // 3. Descrição e Detalhes Extras
  document.getElementById('prop-desc').innerText = imovel.descricao || 'Este exemplar único de arquitetura oferece o máximo em conforto e exclusividade.';

  // Tamanho do Terreno — esconde a linha se não tiver valor
  const tamanhoTerreno = imovel.detalhes?.tamanhoTerreno;
  if (tamanhoTerreno) {
    document.getElementById('table-land').innerText = `${tamanhoTerreno} m²`;
  } else {
    const rowLand = document.getElementById('row-land');
    if (rowLand) rowLand.style.display = 'none';
  }

  // Finalidade — usa negocio salvo em detalhes, ou esconde se não tiver
  const finalidade = imovel.detalhes?.negocio || imovel.negocio;
  if (finalidade) {
    document.getElementById('table-finalidade').innerText = finalidade;
  } else {
    const rowFinalidade = document.getElementById('row-finalidade');
    if (rowFinalidade) rowFinalidade.style.display = 'none';
  }

  // Zonamento — esconde se vazio (campo estático por enquanto)
  const rowZonamento = document.getElementById('row-zonamento');
  if (rowZonamento) rowZonamento.style.display = 'none';

  // 4. Comodidades
  const amenitiesContainer = document.getElementById('amenities-list');
  if (imovel.caracteristicas && imovel.caracteristicas.length > 0) {
    amenitiesContainer.innerHTML = imovel.caracteristicas.map(char => {
      const iconName = iconMap[char] || 'check-circle';
      return `
        <div class="amenity">
          <i data-lucide="${iconName}"></i>
          <span>${char}</span>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  } else {
    amenitiesContainer.innerHTML = '<p style="color:rgba(255,255,255,0.3); font-style:italic;">Características exclusivas sob consulta.</p>';
  }

  // 5. Perfil Vendedora e Links
  renderizarVendedora(imovel, perfil);

  // 6. Carregar recomendações
  carregarOutrosImoveis(imovel.id);

  document.title = `${imovel.nome} | Flórida Imobiliária`;
}

function renderizarVendedora(imovel, perfil) {
  document.getElementById('broker-name').innerText = perfil.nome;
  document.getElementById('broker-role').innerText = perfil.cargo;
  if (perfil.foto_url) document.getElementById('broker-img').src = perfil.foto_url;

  const msgSaberMais = encodeURIComponent(`Quero saber mais sobre imoveis (Ref: ${imovel.nome})`);
  const msgAgendar = encodeURIComponent(`Quero agendar uma visita (Ref: ${imovel.nome})`);
  const numeroUnico = '5592996126865';

  document.getElementById('btn-schedule').href = `https://wa.me/${numeroUnico}?text=${msgAgendar}`;
  document.getElementById('btn-whatsapp').href = `https://wa.me/${numeroUnico}?text=${msgSaberMais}`;

  const btnBottom = document.getElementById('btn-schedule-bottom');
  if (btnBottom) btnBottom.href = `https://wa.me/${numeroUnico}?text=${msgAgendar}`;
}

async function carregarOutrosImoveis(idAtual) {
  try {
    const { data: imoveis, error } = await supabase
      .from(imoveisTable)
      .select('*')
      .neq('id', idAtual)
      .order('datacriacao', { ascending: false })
      .limit(3);

    if (error) throw error;

    const grid = document.getElementById('outros-grid');
    if (imoveis && imoveis.length > 0) {
      grid.innerHTML = imoveis.map(im => {
        const valor = formatarValor(im.valor);
        return `
          <a href="imovel.html?id=${im.id}" class="property-card">
            <div class="card-img-wrap">
              <img src="${im.imagens?.[0] || 'img/placeholder.jpg'}" alt="${im.nome}">
            </div>
            <div class="card-info">
              <div class="card-price">${valor}</div>
              <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin-bottom: 5px;">${im.nome}</h3>
              <p style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">📍 ${im.localizacao}</p>
            </div>
          </a>
        `;
      }).join('');
      document.getElementById('outros-imoveis').style.display = 'block';
    }
  } catch (e) {
    console.warn('Erro ao carregar outros imóveis:', e);
  }
}

window.addEventListener('DOMContentLoaded', carregarImovel);