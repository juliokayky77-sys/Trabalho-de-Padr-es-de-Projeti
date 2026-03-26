// ===== ASSISTENTE VIRTUAL =====
const AssistenteVirtual = {
    historico: [],
    denuncias: [],
    botAutomatizacao: null,
    
    init: function(denunciasArray, botAutomatizacaoInstance) {
        console.log('😊 Assistente Virtual iniciado');
        this.denuncias = denunciasArray;
        this.botAutomatizacao = botAutomatizacaoInstance;
        this.configurarEventos();
        setTimeout(() => this.adicionarMensagem(
            "👋 Olá! Sou seu amigo virtual. Pergunte sobre denúncias, estatísticas ou comandos! Digite 'ajuda' para ver os comandos.",
            'bot'
        ), 1000);
    },
    
    configurarEventos: function() {
        document.getElementById('sendBtn').onclick = () => this.enviarMensagem();
        document.getElementById('botInput').onkeypress = (e) => { if (e.key === 'Enter') this.enviarMensagem(); };
        document.getElementById('botCloseBtn').onclick = () => this.fecharChat();
        document.getElementById('botHeader').onclick = (e) => { if (!e.target.classList.contains('bot-close')) this.alternarChat(); };
        document.getElementById('botAvatar').onclick = () => this.alternarChat();
    },
    
    alternarChat: function() {
        const chat = document.getElementById('botChat');
        const avatar = document.getElementById('botAvatar');
        if (chat.classList.contains('minimized')) {
            chat.classList.remove('minimized');
            avatar.style.display = 'none';
        } else {
            chat.classList.add('minimized');
            avatar.style.display = 'flex';
        }
    },
    
    fecharChat: function() {
        document.getElementById('botChat').classList.add('minimized');
        document.getElementById('botAvatar').style.display = 'flex';
    },
    
    enviarMensagem: function() {
        const input = document.getElementById('botInput');
        const texto = input.value.trim();
        if (!texto) return;
        this.adicionarMensagem(texto, 'user');
        input.value = '';
        this.mostrarDigitando();
        setTimeout(() => {
            const resposta = this.processarComando(texto);
            this.removerDigitando();
            this.adicionarMensagem(resposta, 'bot');
        }, 800);
    },
    
    processarComando: function(texto) {
        const t = texto.toLowerCase();
        
        // Comandos
        if (t === 'ajuda') {
            return "🎯 **Comandos:**\n\n" +
                   "• `estatísticas` - Ver números do portal\n" +
                   "• `ranking` - Bairros com mais denúncias\n" +
                   "• `resolver #5` - Marcar denúncia como resolvida\n" +
                   "• `iniciar #3` - Colocar denúncia em andamento\n" +
                   "• `ver #2` - Detalhes da denúncia\n" +
                   "• `mapa` - Ver mapa de calor\n" +
                   "• `bairro [nome]` - Estatísticas do bairro";
        }
        
        if (t.includes('estatística')) {
            const s = this.botAutomatizacao.getEstatisticas();
            return `📊 **Estatísticas:**\n\n📌 Total: ${s.total}\n✅ Resolvidas: ${s.resolvidas}\n🔄 Em andamento: ${s.andamento}\n⏳ Pendentes: ${s.pendentes}\n📈 Taxa: ${s.taxaResolucao}%`;
        }
        
        if (t.includes('ranking')) {
            const bairrosMap = {};
            this.denuncias.forEach(d => { if (!bairrosMap[d.bairro]) bairrosMap[d.bairro] = 0; bairrosMap[d.bairro]++; });
            const top = Object.entries(bairrosMap).sort((a,b) => b[1] - a[1]).slice(0,5);
            return "🏆 **Ranking:**\n" + top.map(([b, q], i) => `${i+1}º ${b}: ${q} denúncias`).join('\n');
        }
        
        const matchResolver = t.match(/resolver\s*#?(\d+)/);
        if (matchResolver) {
            const id = parseInt(matchResolver[1]);
            const d = this.denuncias.find(d => d.id === id);
            if (!d) return `❌ Denúncia #${id} não encontrada`;
            if (d.status === 'resolvido') return `✅ Denúncia #${id} já está resolvida!`;
            d.status = 'resolvido';
            d.dataResolucao = new Date().toISOString();
            localStorage.setItem('denunciasPortal', JSON.stringify(this.denuncias));
            this.botAutomatizacao.atualizarEstatisticas();
            if (window.renderizarDenunciasCompleta) window.renderizarDenunciasCompleta();
            return `🎉 Denúncia #${id} marcada como resolvida! - ${d.categoria} - ${d.bairro}`;
        }
        
        const matchIniciar = t.match(/iniciar\s*#?(\d+)/);
        if (matchIniciar) {
            const id = parseInt(matchIniciar[1]);
            const d = this.denuncias.find(d => d.id === id);
            if (!d) return `❌ Denúncia #${id} não encontrada`;
            if (d.status === 'andamento') return `🔄 Denúncia #${id} já está em andamento`;
            if (d.status === 'resolvido') return `✅ Denúncia #${id} já foi resolvida`;
            d.status = 'andamento';
            localStorage.setItem('denunciasPortal', JSON.stringify(this.denuncias));
            this.botAutomatizacao.atualizarEstatisticas();
            if (window.renderizarDenunciasCompleta) window.renderizarDenunciasCompleta();
            return `👷 Denúncia #${id} iniciada! Equipe já está trabalhando.`;
        }
        
        const matchVer = t.match(/ver\s*#?(\d+)/);
        if (matchVer) {
            const id = parseInt(matchVer[1]);
            const d = this.denuncias.find(d => d.id === id);
            if (!d) return `❌ Denúncia #${id} não encontrada`;
            return `📋 **Denúncia #${d.id}**\n📌 ${d.categoria}\n📍 ${d.bairro}\n📝 ${d.descricao}\n🎯 Status: ${d.status === 'pendente' ? '⏳ Pendente' : d.status === 'andamento' ? '🔄 Em Andamento' : '✅ Resolvido'}`;
        }
        
        if (t.includes('mapa')) {
            return "🗺️ **Mapa de Calor:**\nRole a página até o mapa interativo!\nAs cores indicam a intensidade:\n🟢 0-2 | 🟡 3-5 | 🟠 6-10 | 🔴 10+ denúncias";
        }
        
        const matchBairro = t.match(/bairro\s+(.+)/);
        if (matchBairro) {
            const bairroNome = matchBairro[1].trim();
            const stats = { total: 0, resolvidas: 0, andamento: 0 };
            this.denuncias.forEach(d => {
                if (d.bairro.toLowerCase().includes(bairroNome.toLowerCase())) {
                    stats.total++;
                    if (d.status === 'resolvido') stats.resolvidas++;
                    if (d.status === 'andamento') stats.andamento++;
                }
            });
            if (stats.total === 0) return `❌ Nenhuma denúncia encontrada para "${bairroNome}"`;
            const taxa = Math.round((stats.resolvidas / stats.total) * 100);
            return `🏘️ **${bairroNome}**\n📊 ${stats.total} denúncias\n✅ ${stats.resolvidas} resolvidas (${taxa}%)\n🔄 ${stats.andamento} em andamento`;
        }
        
        return "😊 Não entendi. Digite 'ajuda' para ver os comandos disponíveis!";
    },
    
    mostrarDigitando: function() {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'typing-indicator';
        div.innerHTML = `<div class="message-avatar">🤔</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
        document.getElementById('botMessages').appendChild(div);
        this.rolarParaFinal();
    },
    
    removerDigitando: function() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    },
    
    adicionarMensagem: function(texto, remetente) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatares = ['😊', '🤖', '🎉', '💙', '🌟'];
        const avatar = remetente === 'bot' ? avatares[Math.floor(Math.random() * avatares.length)] : '👤';
        const html = `
            <div class="message ${remetente}">
                <div class="message-avatar">${avatar}</div>
                <div><div class="message-content">${texto}</div><div class="message-time">${time}</div></div>
            </div>
        `;
        document.getElementById('botMessages').innerHTML += html;
        this.rolarParaFinal();
        this.historico.push({ role: remetente, content: texto });
    },
    
    rolarParaFinal: function() {
        const msgs = document.getElementById('botMessages');
        msgs.scrollTop = msgs.scrollHeight;
    }
};
