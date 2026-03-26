let denuncias = [];
let map, userMarker, currentLocation = { lat: -9.0654, lng: -68.6571 };
let vlibrasInstance;

function toggleHighContrast() { document.body.classList.toggle('high-contrast'); }
function toggleLargeText() { document.body.classList.toggle('large-text'); }
function toggleAnimations() { document.body.classList.toggle('no-animations'); }
function resetAccessibility() {
    document.body.classList.remove('high-contrast', 'large-text', 'no-animations');
}


function initMap() {
    map = L.map('map').setView([-9.0654, -68.6571], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    userMarker = L.marker([-9.0654, -68.6571]).addTo(map).bindPopup('Sena Madureira');
    carregarMapaCalor();
}

function carregarMapaCalor() {
    if (!map) return;
    if (window.marcadoresCalor) window.marcadoresCalor.forEach(m => m.remove());
    window.marcadoresCalor = [];
    
    const pontos = MapaCalor.gerarPontosMapa(denuncias);
    pontos.forEach(p => {
        const marker = L.circleMarker([p.lat, p.lng], {
            radius: 8 + (p.intensidade / 2),
            fillColor: p.cor,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.7
        }).addTo(map);
        marker.bindPopup(`<b>${p.bairro}</b><br>${p.intensidade} denúncias<br><button onclick="MapaCalor.mostrarDetalhes('${p.bairro}')">Ver detalhes</button>`);
        window.marcadoresCalor.push(marker);
    });
    
    const legenda = document.createElement('div');
    legenda.className = 'map-legend';
    legenda.style.cssText = 'position: absolute; bottom: 20px; right: 20px; background: white; padding: 10px; border-radius: 8px; z-index: 1000; font-size: 12px;';
    legenda.innerHTML = '<strong>🔥 Mapa de Calor</strong><br>🟢 Tranquilo<br>🟡 Atenção<br>🟠 Crítico<br>🔴 Emergência';
    document.querySelector('#map-container')?.appendChild(legenda);
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setView([currentLocation.lat, currentLocation.lng], 15);
            if (userMarker) userMarker.setLatLng([currentLocation.lat, currentLocation.lng]);
            else userMarker = L.marker([currentLocation.lat, currentLocation.lng]).addTo(map);
            userMarker.bindPopup('Você está aqui!').openPopup();
            document.getElementById('locationInfo').style.display = 'block';
            document.getElementById('locationInfo').textContent = `📍 Localização: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
        });
    }
}

function gerarProximoID() { return denuncias.length === 0 ? 1 : Math.max(...denuncias.map(d => d.id)) + 1; }

function mostrarPagina(pagina) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pagina + '-page').classList.add('active');
    document.querySelector('.hero').style.display = pagina === 'inicial' ? 'block' : 'none';
}

function atualizarEstatisticas() {
    const total = denuncias.length;
    const resolvidas = denuncias.filter(d => d.status === 'resolvido').length;
    const anonimas = denuncias.filter(d => d.anonima).length;
    const taxa = total > 0 ? Math.round((resolvidas / total) * 100) : 0;
    
    document.getElementById('total-denuncias').textContent = total;
    document.getElementById('resolvidas-contador').textContent = resolvidas;
    document.getElementById('anonimas-contador').textContent = anonimas;
    document.getElementById('taxa-sucesso').textContent = taxa + '%';
    
    if (document.getElementById('total-denuncias-page')) {
        document.getElementById('total-denuncias-page').textContent = total;
        document.getElementById('pendentes-page').textContent = denuncias.filter(d => d.status === 'pendente').length;
        document.getElementById('andamento-page').textContent = denuncias.filter(d => d.status === 'andamento').length;
        document.getElementById('resolvidas-page').textContent = resolvidas;
        document.getElementById('anonimas-page').textContent = anonimas;
    }
}

function renderizarCategorias() {
    document.getElementById('categorias-lista').innerHTML = categoriasDenuncia.map(cat => `
        <div class="categoria-card" onclick="mostrarModalDenunciaComCategoria('${cat.nome}')">
            <div class="categoria-emoji">${cat.icone}</div>
            <div class="categoria-titulo">${cat.nome}</div>
            <div class="categoria-desc">${cat.desc}</div>
        </div>
    `).join('');
}

function preencherSelectCategorias() {
    const options = categoriasDenuncia.map(cat => `<option value="${cat.nome}">${cat.icone} ${cat.nome}</option>`).join('');
    const selectNormal = document.getElementById('categoria');
    const selectAnonimo = document.getElementById('categoria-anonima');
    if (selectNormal) selectNormal.innerHTML = '<option value="">Selecione</option>' + options;
    if (selectAnonimo) selectAnonimo.innerHTML = '<option value="">Selecione</option>' + options;
}

function renderizarNoticias() {
    const lista = document.getElementById('noticias-lista');
    lista.innerHTML = noticiasSimuladas.map(n => `
        <div class="noticia-card">
            <div class="noticia-imagem" style="background-image: url('${n.imagem}');">
                <span class="noticia-categoria">${n.categoria}</span>
            </div>
            <div class="noticia-conteudo">
                <h3 class="noticia-titulo">${n.titulo}</h3>
                <div class="noticia-meta"><span>📅 ${n.data}</span></div>
                <p>${n.resumo}</p>
            </div>
        </div>
    `).join('');
    document.getElementById('noticias-page-lista').innerHTML = document.getElementById('noticias-lista').innerHTML;
}

function renderizarDenunciasRecentes() {
    const lista = document.getElementById('inicial-denuncias-lista');
    const recentes = denuncias.slice(0, 3);
    if (recentes.length === 0) { lista.innerHTML = '<div class="empty-state">Nenhuma denúncia recente</div>'; return; }
    lista.innerHTML = recentes.map(d => `
        <div class="denuncia-item ${d.anonima ? 'anonima' : d.status}">
            <div class="denuncia-id ${d.anonima ? 'anonima' : ''}">#${d.id}</div>
            <div><h4>${d.categoria} ${d.anonima ? '🕵️' : ''}</h4><p>${d.descricao.substring(0, 100)}...</p></div>
        </div>
    `).join('');
}

function renderizarDenunciasAnonimasRecentes() {
    const lista = document.getElementById('inicial-anonimas-lista');
    const anonimas = denuncias.filter(d => d.anonima).slice(0, 3);
    if (anonimas.length === 0) { lista.innerHTML = '<div class="empty-state">Nenhuma denúncia anônima</div>'; return; }
    lista.innerHTML = anonimas.map(d => `
        <div class="denuncia-item anonima">
            <div class="denuncia-id anonima">#${d.id}</div>
            <div><h4>${d.categoria} 🕵️</h4><p>${d.descricao.substring(0, 100)}...</p></div>
        </div>
    `).join('');
}

function renderizarRanking() {
    const ranking = document.getElementById('inicial-ranking-lista');
    const bairrosMap = {};
    denuncias.forEach(d => {
        if (!bairrosMap[d.bairro]) bairrosMap[d.bairro] = { total: 0, resolvidas: 0 };
        bairrosMap[d.bairro].total++;
        if (d.status === 'resolvido') bairrosMap[d.bairro].resolvidas++;
    });
    const top5 = Object.entries(bairrosMap).map(([b, s]) => ({ bairro: b, ...s, taxa: s.total > 0 ? Math.round((s.resolvidas / s.total) * 100) : 0 }))
        .sort((a, b) => b.total - a.total).slice(0, 5);
    if (top5.length === 0) { ranking.innerHTML = '<div class="empty-state">Nenhum dado</div>'; return; }
    ranking.innerHTML = top5.map((item, i) => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--gray-50); border-radius: 12px;">
            <div style="width: 30px; height: 30px; background: ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--gray-200)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${i+1}</div>
            <div><strong>${item.bairro}</strong> - ${item.total} denúncias (${item.taxa}% resolvidas)</div>
        </div>
    `).join('');
}

function renderizarDenunciasCompleta(filtro = 'todas') {
    const lista = document.getElementById('denuncias-lista-completa');
    if (denuncias.length === 0) {
        lista.innerHTML = '<div class="empty-state">Nenhuma denúncia registrada</div>';
        return;
    }
    let filtradas = [...denuncias].sort((a,b) => b.id - a.id);
    if (filtro !== 'todas') {
        if (filtro === 'anonima') filtradas = filtradas.filter(d => d.anonima);
        else filtradas = filtradas.filter(d => d.status === filtro && !d.anonima);
    }
    lista.innerHTML = filtradas.map(d => `
        <div class="denuncia-item ${d.anonima ? 'anonima' : d.status}">
            <div class="denuncia-id ${d.anonima ? 'anonima' : ''}">#${d.id}</div>
            <div>
                <h4>${d.categoria} ${d.anonima ? '🕵️' : ''}</h4>
                <div class="denuncia-meta">${d.anonima ? '' : `<span>👤 ${d.nome}</span>`}<span>📍 ${d.bairro}</span><span>📅 ${new Date(d.data).toLocaleDateString()}</span></div>
                <p>${d.descricao}</p>
            </div>
            ${d.anonima ? '' : `<button class="btn-status" onclick="alterarStatusDenuncia(${d.id})">${d.status === 'pendente' ? '⏳ Pendente' : d.status === 'andamento' ? '🔄 Em Andamento' : '✅ Resolvido'}</button>`}
        </div>
    `).join('');
}

function alterarStatusDenuncia(id) {
    const d = denuncias.find(d => d.id === id);
    if (d && !d.anonima) {
        const ordem = { 'pendente': 'andamento', 'andamento': 'resolvido', 'resolvido': 'pendente' };
        d.status = ordem[d.status];
        localStorage.setItem('denunciasPortal', JSON.stringify(denuncias));
        atualizarEstatisticas();
        renderizarDenunciasCompleta();
        renderizarDenunciasRecentes();
        renderizarRanking();
        MapaCalor.atualizar(denuncias);
        carregarMapaCalor();
        if (window.AssistenteVirtual) window.AssistenteVirtual.adicionarMensagem(`✅ Denúncia #${id} alterada para ${d.status}`, 'bot');
    }
}

function filtrarDenuncias(filtro) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderizarDenunciasCompleta(filtro);
}

function mudarAba(aba) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('inicial-noticias-section').style.display = aba === 'noticias' ? 'block' : 'none';
    document.getElementById('inicial-denuncias-section').style.display = aba === 'denuncias' ? 'block' : 'none';
    document.getElementById('inicial-ranking-section').style.display = aba === 'ranking' ? 'block' : 'none';
    document.getElementById('inicial-anonimas-section').style.display = aba === 'anonimas' ? 'block' : 'none';
    if (aba === 'denuncias') renderizarDenunciasRecentes();
    else if (aba === 'ranking') renderizarRanking();
    else if (aba === 'anonimas') renderizarDenunciasAnonimasRecentes();
}

function mostrarModalDenuncia() { document.getElementById('modal-denuncia').classList.add('active'); }
function mostrarModalDenunciaAnonima() { document.getElementById('modal-denuncia-anonima').classList.add('active'); }
function mostrarModalDenunciaComCategoria(cat) { mostrarModalDenuncia(); setTimeout(() => document.getElementById('categoria').value = cat, 100); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }
function buscarDenuncias() { const termo = document.getElementById('search-input').value; if (termo) mostrarPagina('denuncias'); }

function inicializar() {
    const saved = localStorage.getItem('denunciasPortal');
    if (saved) denuncias = JSON.parse(saved);
    
    window.denunciasGlobal = denuncias;
    
    preencherSelectCategorias();
    renderizarCategorias();
    renderizarNoticias();
    
    BotAutomatizacao.init(denuncias, {
        atualizarEstatisticas: atualizarEstatisticas,
        atualizarMapaCalor: () => MapaCalor.atualizar(denuncias)
    });
    
    AssistenteVirtual.init(denuncias, BotAutomatizacao);
    
    MapaCalor.atualizar(denuncias);
    atualizarEstatisticas();
    renderizarDenunciasRecentes();
    renderizarDenunciasAnonimasRecentes();
    renderizarRanking();
    renderizarDenunciasCompleta();
    initMap();
    
    try { vlibrasInstance = new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch(e) {}
}


document.getElementById('denunciaForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nova = {
        id: gerarProximoID(),
        nome: document.getElementById('nome').value,
        categoria: document.getElementById('categoria').value,
        endereco: document.getElementById('endereco').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        descricao: document.getElementById('descricao').value,
        contato: document.getElementById('contato').value,
        email: document.getElementById('email').value,
        data: new Date().toISOString(),
        status: 'pendente',
        anonima: false,
        lat: currentLocation.lat,
        lng: currentLocation.lng
    };
    denuncias.push(nova);
    localStorage.setItem('denunciasPortal', JSON.stringify(denuncias));
    BotAutomatizacao.atualizarEstatisticas();
    renderizarDenunciasRecentes();
    renderizarDenunciasCompleta();
    renderizarRanking();
    fecharModal('modal-denuncia');
    this.reset();
    if (AssistenteVirtual) AssistenteVirtual.adicionarMensagem(`✅ Denúncia #${nova.id} registrada! Obrigado por contribuir.`, 'bot');
});

document.getElementById('denunciaAnonimaForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nova = {
        id: gerarProximoID(),
        nome: 'Anônimo',
        categoria: document.getElementById('categoria-anonima').value,
        endereco: document.getElementById('endereco-anonimo').value,
        bairro: document.getElementById('bairro-anonimo').value,
        cidade: document.getElementById('cidade-anonima').value,
        descricao: document.getElementById('descricao-anonima').value,
        contato: 'Não informado',
        email: 'Não informado',
        data: new Date().toISOString(),
        status: 'pendente',
        anonima: true,
        lat: currentLocation.lat,
        lng: currentLocation.lng
    };
    denuncias.push(nova);
    localStorage.setItem('denunciasPortal', JSON.stringify(denuncias));
    BotAutomatizacao.atualizarEstatisticas();
    renderizarDenunciasRecentes();
    renderizarDenunciasCompleta();
    renderizarRanking();
    fecharModal('modal-denuncia-anonima');
    this.reset();
    if (AssistenteVirtual) AssistenteVirtual.adicionarMensagem(`🕵️ Denúncia anônima #${nova.id} registrada! Sua identidade está segura.`, 'bot');
});

document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
});

window.addEventListener('DOMContentLoaded', inicializar);
