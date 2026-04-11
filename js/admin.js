// admin.js — Flórida Imobiliária
// Salva subtipo (casa/apartamento/terreno/sala/mansao) em detalhes.subtipo
// tipo no banco = 'residencial' | 'comercial' (derivado da categoria)

let imovelEditando = null;

function notify(msg) {
    if (window.mostrarToast) window.mostrarToast(msg);
    else alert(msg);
}

function gerarSlug(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function verificarSlugUnico(slug, imovelId = null) {
    let query = supabase.from(imoveisTable).select('id').eq('slug', slug);
    if (imovelId) query = query.neq('id', imovelId);

    const { data, error } = await query;
    if (error || data.length === 0) return slug;

    let contador = 2;
    let novoSlug = `${slug}-${contador}`;
    while (true) {
        const { data: d } = await supabase.from(imoveisTable).select('id').eq('slug', novoSlug);
        if (!d || d.length === 0) break;
        contador++;
        novoSlug = `${slug}-${contador}`;
    }
    return novoSlug;
}

// ── Upload de imagens ────────────────────────────────
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const progressEl = document.getElementById('uploadProgress');
    progressEl.textContent = `⏳ Preparando ${files.length} imagem(ns)...`;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `imoveis/${fileName}`;

        progressEl.textContent = `⏳ Uploading: ${i + 1} de ${files.length}...`;

        try {
            const { error: uploadError } = await supabase.storage.from(imoveisBucket).upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(imoveisBucket).getPublicUrl(filePath);
            adicionarCampoImagem(publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            notify(`Erro ao subir ${file.name}: ${error.message}`);
        }
    }

    progressEl.textContent = `✅ ${files.length} imagem(ns) carregada(s)!`;
    setTimeout(() => progressEl.textContent = '', 5000);
}

function adicionarCampoImagem(url = '') {
    const container = document.getElementById('imageUrlsContainer');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; gap:10px;';
    div.innerHTML = `
        <input type="url" class="image-url-input" value="${url}" placeholder="https://..." style="flex:1;">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()" style="padding:10px 14px;">×</button>
    `;
    container.appendChild(div);
}

// ── Lista de imóveis ─────────────────────────────────
async function carregarLista() {
    try {
        const lista = document.getElementById('listaImoveis');
        lista.innerHTML = '<div class="loading-overlay">Sincronizando catálogo...</div>';

        const { data: imoveis, error } = await supabase
            .from(imoveisTable).select('*').order('datacriacao', { ascending: false });

        if (error) throw error;
        if (!imoveis || imoveis.length === 0) {
            lista.innerHTML = '<div class="loading-overlay">Nenhum imóvel cadastrado ainda.</div>';
            return;
        }

        lista.innerHTML = '';
        imoveis.forEach(imovel => {
            const div = document.createElement('div');
            div.className = 'imovel-item';

            const valor = new Intl.NumberFormat('pt-BR', {
                style: 'currency', currency: 'BRL', minimumFractionDigits: 0
            }).format(imovel.valor);

            // Subtipo para exibir no badge
            const subtipo = imovel.detalhes?.subtipo || imovel.tipo || '—';

            div.innerHTML = `
                <div class="imovel-info">
                    <h3>${imovel.nome} <span class="cat-badge">${subtipo}</span></h3>
                    <p>${valor} · ${imovel.localizacao || '—'} · ${imovel.ativo ? '✅ Ativo' : '⛔ Inativo'}</p>
                </div>
                <div class="actions-row">
                    <button class="btn btn-outline" onclick="editarImovel('${imovel.id}')"><i data-lucide="edit-3" style="width:14px;"></i></button>
                    <button class="btn btn-outline" onclick="verLink('${imovel.id}')"><i data-lucide="external-link" style="width:14px;"></i></button>
                    <button class="btn btn-danger" onclick="excluirImovel('${imovel.id}', '${imovel.nome.replace(/'/g, "\\'")}')"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </div>
            `;
            lista.appendChild(div);
        });
        lucide.createIcons();

    } catch (error) {
        console.error('Erro lista:', error);
        notify('Erro ao sincronizar imóveis.');
    }
}

// ── Navegação ────────────────────────────────────────
function mostrarFormulario() {
    ocultarTudo();
    document.getElementById('formulario').classList.add('active');
    document.getElementById('formTitle').textContent = 'Novo Imóvel de Luxo';
    document.getElementById('imovelForm').reset();
    document.getElementById('imovelId').value = '';
    document.getElementById('imageUrlsContainer').innerHTML = '';
    document.getElementById('tipoSelect').value = 'residencial';
    // Reset seletor visual para "Casa"
    document.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    const casaOption = document.querySelector('.cat-option[data-valor="casa"]');
    if (casaOption) casaOption.classList.add('selected');
    document.getElementById('tipoInfoTexto').textContent = 'Casa (Residencial)';
    imovelEditando = null;
}

async function mostrarPerfil() {
    ocultarTudo();
    document.getElementById('formPerfil').classList.add('active');
    await carregarPerfil();
}

function ocultarTudo() {
    document.getElementById('lista-painel').style.display = 'none';
    document.getElementById('formulario').classList.remove('active');
    document.getElementById('formPerfil').classList.remove('active');
}

function voltarLista() {
    ocultarTudo();
    document.getElementById('lista-painel').style.display = 'block';
    carregarLista();
}

// ── Perfil ───────────────────────────────────────────
async function carregarPerfil() {
    try {
        const { data } = await supabase.from('perfil').select('*').eq('id', 1).single();
        if (data) {
            document.getElementById('perfilNome').value = data.nome || '';
            document.getElementById('perfilCargo').value = data.cargo || '';
            document.getElementById('perfilWhatsapp').value = data.whatsapp || '';
            document.getElementById('perfilFotoUrl').value = data.foto_url || '';
            document.getElementById('perfilAvaliacoes').value = data.avaliacoes || 0;
            document.getElementById('perfilEstrelas').value = data.estrelas || 5.0;
        }
    } catch (e) { console.error('Erro perfil:', e); }
}

async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const fileName = `perfil-${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from(imoveisBucket).upload(`vendedores/${fileName}`, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(imoveisBucket).getPublicUrl(`vendedores/${fileName}`);
        document.getElementById('perfilFotoUrl').value = publicUrl;
        notify('Foto carregada!');
    } catch (e) { notify('Erro upload foto: ' + e.message); }
}

document.getElementById('perfilForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = '⏳ SALVANDO...';
    try {
        const dados = {
            id: 1,
            nome: document.getElementById('perfilNome').value,
            cargo: document.getElementById('perfilCargo').value,
            whatsapp: document.getElementById('perfilWhatsapp').value,
            foto_url: document.getElementById('perfilFotoUrl').value,
            avaliacoes: parseInt(document.getElementById('perfilAvaliacoes').value) || 0,
            estrelas: parseFloat(document.getElementById('perfilEstrelas').value) || 5.0
        };
        const { error } = await supabase.from('perfil').upsert(dados);
        if (error) throw error;
        notify('Perfil atualizado!');
        setTimeout(voltarLista, 1500);
    } catch (e) { notify('Erro ao salvar perfil.'); }
    finally { btn.disabled = false; btn.textContent = 'SALVAR PERFIL PREMIUM'; }
});

// ── Editar ───────────────────────────────────────────
function verLink(id) {
    const url = `${window.location.origin}/imovel.html?id=${id}`;
    prompt('Link do imóvel:', url);
    window.open(url, '_blank');
}

async function editarImovel(id) {
    try {
        const { data: imovel, error } = await supabase.from(imoveisTable).select('*').eq('id', id).single();
        if (error || !imovel) return;

        imovelEditando = imovel;
        document.getElementById('imovelId').value = imovel.id;
        document.getElementById('nome').value = imovel.nome;
        document.getElementById('localizacao').value = imovel.localizacao || '';
        document.getElementById('valor').value = imovel.valor;
        document.getElementById('descricao').value = imovel.descricao || '';
        document.getElementById('tipoSelect').value = imovel.tipo || 'residencial';

        // Recuperar subtipo salvo em detalhes
        const subtipo = imovel.detalhes?.subtipo || '';
        if (subtipo && window.selecionarCategoriaByValor) {
            selecionarCategoriaByValor(subtipo);
        } else {
            // fallback: mapear tipo geral para categoria visual
            const fallback = imovel.tipo === 'comercial' ? 'sala' : 'casa';
            if (window.selecionarCategoriaByValor) selecionarCategoriaByValor(fallback);
        }

        // Finalidade (negocio) — agora salvo em detalhes.negocio
        const negocioEl = document.getElementById('negocioSelect');
        if (negocioEl) negocioEl.value = imovel.detalhes?.negocio || imovel.negocio || 'À Venda';

        document.getElementById('quartos').value = imovel.detalhes?.quartos || '';
        document.getElementById('banheiros').value = imovel.detalhes?.banheiros || '';
        document.getElementById('areaConstruida').value = imovel.detalhes?.areaConstruida || '';
        document.getElementById('tamanhoTerreno').value = imovel.detalhes?.tamanhoTerreno || '';
        document.getElementById('video_url').value = imovel.detalhes?.video_url || '';

        document.querySelectorAll('.feature-check input').forEach(cb => {
            cb.checked = imovel.caracteristicas && imovel.caracteristicas.includes(cb.value);
        });

        const container = document.getElementById('imageUrlsContainer');
        container.innerHTML = '';
        (imovel.imagens || []).forEach(url => adicionarCampoImagem(url));

        ocultarTudo();
        document.getElementById('formTitle').textContent = 'Editar Propriedade';
        document.getElementById('formulario').classList.add('active');

    } catch (e) { notify('Erro ao carregar imóvel.'); }
}

async function excluirImovel(id, nome) {
    if (!confirm(`Confirmar exclusão de "${nome}"?`)) return;
    try {
        const { error } = await supabase.from(imoveisTable).delete().eq('id', id);
        if (error) throw error;
        notify('Imóvel removido.');
        carregarLista();
    } catch (e) { notify('Erro ao excluir.'); }
}

// ── Salvar imóvel ────────────────────────────────────
document.getElementById('imovelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = '⏳ PUBLICANDO...';

    try {
        const imovelId = document.getElementById('imovelId').value || null;

        const imagens = [];
        document.querySelectorAll('.image-url-input').forEach(i => { if (i.value) imagens.push(i.value); });

        const caracteristicas = [];
        document.querySelectorAll('.feature-check input:checked').forEach(c => caracteristicas.push(c.value));

        // ★ Categoria selecionada (subtipo) — chave do filtro de busca
        const subtipo = window.getCategoriaSelecionada ? getCategoriaSelecionada() : 'casa';
        const tipo = document.getElementById('tipoSelect').value; // 'residencial' | 'comercial'
        const negocio = document.getElementById('negocioSelect')?.value || 'À Venda';

        const dados = {
            tipo,                                              // residencial | comercial (CHECK constraint)
            nome: document.getElementById('nome').value,
            localizacao: document.getElementById('localizacao').value,
            valor: parseFloat(document.getElementById('valor').value),
            descricao: document.getElementById('descricao').value,
            detalhes: {
                subtipo,                                       // ★ usado no filtro do site
                negocio,                                       // À Venda | Para Alugar | Temporada
                quartos: parseInt(document.getElementById('quartos').value) || null,
                banheiros: parseInt(document.getElementById('banheiros').value) || null,
                areaConstruida: parseInt(document.getElementById('areaConstruida').value) || null,
                tamanhoTerreno: parseInt(document.getElementById('tamanhoTerreno').value) || null,
                video_url: document.getElementById('video_url').value || null,
            },
            caracteristicas,
            imagens,
            ativo: true,
            dataatualizacao: new Date().toISOString()
        };

        if (!imovelId) {
            dados.datacriacao = new Date().toISOString();
            dados.slug = await verificarSlugUnico(gerarSlug(dados.nome));
            const { error } = await supabase.from(imoveisTable).insert([dados]);
            if (error) throw error;
            notify('Imóvel publicado!');
        } else {
            const { error } = await supabase.from(imoveisTable).update(dados).eq('id', imovelId);
            if (error) throw error;
            notify('Propriedade atualizada!');
        }

        setTimeout(voltarLista, 1500);

    } catch (error) {
        console.error('Erro salvar:', error);
        notify('Erro ao salvar: ' + (error.message || 'tente novamente'));
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// ── Init ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', carregarLista);