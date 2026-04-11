// admin.js
// Painel admin reformado para Luxo Dark Mode

let imovelEditando = null;

// Função para exibir notificações premium
function notify(msg) {
    if (window.mostrarToast) {
        window.mostrarToast(msg);
    } else {
        alert(msg);
    }
}

// Gerar slug único
function gerarSlug(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Verificar slug único no Supabase
async function verificarSlugUnico(slug, imovelId = null) {
    let query = supabase
        .from(imoveisTable)
        .select('id')
        .eq('slug', slug);

    if (imovelId) {
        query = query.neq('id', imovelId);
    }

    const { data, error } = await query;
    if (error || data.length === 0) return slug;

    let contador = 2;
    let novoSlug = `${slug}-${contador}`;

    while (true) {
        const { data: dataNovo } = await supabase
            .from(imoveisTable)
            .select('id')
            .eq('slug', novoSlug);
        
        if (!dataNovo || dataNovo.length === 0) break;
        contador++;
        novoSlug = `${slug}-${contador}`;
    }
    return novoSlug;
}

// Upload de imagens no Supabase Storage
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const progressEl = document.getElementById('uploadProgress');
    progressEl.textContent = `⏳ Preparando upload de ${files.length} imagem(ns)...`;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `imoveis/${fileName}`;

        progressEl.textContent = `⏳ Fazendo upload: ${i + 1} de ${files.length}...`;

        try {
            const { error: uploadError } = await supabase.storage
                .from(imoveisBucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(imoveisBucket)
                .getPublicUrl(filePath);

            adicionarCampoImagem(publicUrl);

        } catch (error) {
            console.error('Erro no upload:', error);
            notify(`Erro ao subir imagem ${file.name}: ${error.message}`);
        }
    }

    progressEl.textContent = `✅ ${files.length} imagem(ns) carregada(s) com sucesso!`;
    setTimeout(() => { progressEl.textContent = ''; }, 5000);
}

// Adicionar campo de URL de imagem (Agora com estilo premium)
function adicionarCampoImagem(url = '') {
    const container = document.getElementById('imageUrlsContainer');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="url" class="image-url-input" value="${url}" placeholder="https://..." style="flex:1;">
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="padding:10px;">×</button>
    `;
    container.appendChild(div);
}

// Carregar lista do Supabase
async function carregarLista() {
    try {
        const lista = document.getElementById('listaImoveis');
        lista.innerHTML = '<div class="loading-overlay">Sincronizando catálogo...</div>';

        const { data: imoveis, error } = await supabase
            .from(imoveisTable)
            .select('*')
            .order('datacriacao', { ascending: false });

        if (error) throw error;
        if (!imoveis || imoveis.length === 0) {
            lista.innerHTML = '<div class="loading-overlay">Nenhum imóvel disponível no momento.</div>';
            return;
        }

        lista.innerHTML = '';
        imoveis.forEach(imovel => {
            const div = document.createElement('div');
            div.className = 'imovel-item';

            const valor = new Intl.NumberFormat('pt-BR', {
                style: 'currency', currency: 'BRL', minimumFractionDigits: 0
            }).format(imovel.valor);

            div.innerHTML = `
                <div class="imovel-info">
                  <h3>${imovel.nome}</h3>
                  <p>${valor} • ${imovel.localizacao} • ${imovel.tipo}</p>
                </div>
                <div class="actions-row">
                  <button class="btn btn-outline" onclick="editarImovel('${imovel.id}')"><i data-lucide="edit-3" style="width:14px;"></i></button>
                  <button class="btn btn-outline" onclick="verLink('${imovel.id}')"><i data-lucide="external-link" style="width:14px;"></i></button>
                  <button class="btn btn-danger" onclick="excluirImovel('${imovel.id}', '${imovel.nome}')"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </div>
            `;
            lista.appendChild(div);
        });
        lucide.createIcons();

    } catch (error) {
        console.error('Erro ao carregar lista:', error);
        notify('Erro ao sincronizar imóveis.');
    }
}

// Form Control
function mostrarFormulario() {
    ocultarTudo();
    document.getElementById('formulario').classList.add('active');
    document.getElementById('formTitle').textContent = 'Novo Imóvel de Luxo';
    document.getElementById('imovelForm').reset();
    document.getElementById('imovelId').value = '';
    document.getElementById('imageUrlsContainer').innerHTML = '';
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

// Perfil Logic
async function carregarPerfil() {
    try {
        const { data, error } = await supabase.from('perfil').select('*').eq('id', 1).single();
        if (data) {
            document.getElementById('perfilNome').value = data.nome || '';
            document.getElementById('perfilCargo').value = data.cargo || '';
            document.getElementById('perfilWhatsapp').value = data.whatsapp || '';
            document.getElementById('perfilFotoUrl').value = data.foto_url || '';
            document.getElementById('perfilAvaliacoes').value = data.avaliacoes || 0;
            document.getElementById('perfilEstrelas').value = data.estrelas || 5.0;
        }
    } catch (error) { console.error('Erro perfil:', error); }
}

async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const fileName = `perfil-${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from(imoveisBucket).upload(`vendedores/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from(imoveisBucket).getPublicUrl(`vendedores/${fileName}`);
        document.getElementById('perfilFotoUrl').value = publicUrl;
        notify('Foto do perfil carregada!');
    } catch (error) { notify('Erro upload foto: ' + error.message); }
}

document.getElementById('perfilForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = '⏳ SINCRONIZANDO...';

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
        notify('Perfil Premium atualizado!');
        setTimeout(voltarLista, 1500);
    } catch (error) { notify('Erro ao salvar perfil.'); }
    finally { btn.disabled = false; btn.textContent = originalText; }
});

// Link View
function verLink(id) {
    const url = `${window.location.origin}/imovel.html?id=${id}`;
    prompt('Link exclusivo do imóvel:', url);
    window.open(url, '_blank');
}

// Editar Imóvel
async function editarImovel(id) {
    try {
        const { data: imovel, error } = await supabase.from(imoveisTable).select('*').eq('id', id).single();
        if (error || !imovel) return;

        imovelEditando = imovel;
        document.getElementById('imovelId').value = imovel.id;
        document.getElementById('nome').value = imovel.nome;
        document.getElementById('localizacao').value = imovel.localizacao;
        document.getElementById('valor').value = imovel.valor;
        document.getElementById('descricao').value = imovel.descricao;
        document.getElementById('tipoSelect').value = imovel.tipo || 'residencial';

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
        if (imovel.imagens) {
            imovel.imagens.forEach(url => adicionarCampoImagem(url));
        }

        ocultarTudo();
        document.getElementById('formTitle').textContent = 'Editar Propriedade';
        document.getElementById('formulario').classList.add('active');

    } catch (e) { notify('Erro ao carregar imóvel.'); }
}

// Excluir Imóvel
async function excluirImovel(id, nome) {
    if (!confirm(`Confirmar exclusão de "${nome}"?`)) return;
    try {
        const { error } = await supabase.from(imoveisTable).delete().eq('id', id);
        if (error) throw error;
        notify('Imóvel removido do catálogo.');
        carregarLista();
    } catch (e) { notify('Erro ao excluir.'); }
}

// Salvar Imóvel
document.getElementById('imovelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = '⏳ PUBLICANDO...';

    try {
        const imovelId = document.getElementById('imovelId').value || null;
        const imagens = [];
        document.querySelectorAll('.image-url-input').forEach(i => { if(i.value) imagens.push(i.value); });

        const caracteristicas = [];
        document.querySelectorAll('.feature-check input:checked').forEach(c => caracteristicas.push(c.value));

        const dados = {
            tipo: document.getElementById('tipoSelect').value,
            nome: document.getElementById('nome').value,
            localizacao: document.getElementById('localizacao').value,
            valor: parseFloat(document.getElementById('valor').value),
            descricao: document.getElementById('descricao').value,
            detalhes: {
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
            notify('Imóvel publicado com sucesso!');
        } else {
            const { error } = await supabase.from(imoveisTable).update(dados).eq('id', imovelId);
            if (error) throw error;
            notify('Propriedade atualizada!');
        }

        setTimeout(voltarLista, 1500);
    } catch (error) { notify('Erro ao salvar propriedade.'); }
    finally { btn.disabled = false; btn.textContent = originalText; }
});

// Init
window.addEventListener('DOMContentLoaded', carregarLista);