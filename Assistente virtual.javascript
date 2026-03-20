//  BOT 1 - ASSISTENTE VIRTUAL COM IA (VISÍVEL) 
const AssistenteVirtual = {
    // Configurações
    config: {
        nome: "Assistente IA",
        avatar: "🤖",
        primaryColor: "#0084ff",
        saudacao: "👋 Olá! Sou o assistente virtual do Portal Cidadão. Como posso ajudar você hoje?"
    },

    // Histórico da conversa
    conversationHistory: [],

    // Inicializar o assistente
    init: function(apiKey) {
        console.log('🤖 Assistente Virtual iniciado...');
        this.apiKey = apiKey;
        this.carregarHistorico();
        this.inicializarInterface();
        this.configurarEventos();
    },

    // Carregar histórico salvo
    carregarHistorico: function() {
        const saved = localStorage.getItem('assistenteHistorico');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    },

    // Inicializar a interface do chat
    inicializarInterface: function() {
        // O HTML já existe no site, só precisamos configurar
        this.messagesDiv = document.getElementById('botMessages');
        this.input = document.getElementById('botInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.avatar = document.getElementById('botAvatar');
        this.chat = document.getElementById('botChat');
    },

    // Configurar eventos
    configurarEventos: function() {
        // Enviar mensagem com Enter
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.enviarMensagem();
        });

        // Botão enviar
        this.sendBtn?.addEventListener('click', () => this.enviarMensagem());

        // Toggle do chat
        this.avatar?.addEventListener('click', () => this.alternarChat());
    },

    // Alternar chat (abrir/fechar)
    alternarChat: function() {
        if (this.chat.classList.contains('minimized')) {
            this.chat.classList.remove('minimized');
            this.avatar.style.display = 'none';
            if (this.messagesDiv.children.length === 0) {
                this.adicionarMensagem(this.config.saudacao, 'bot');
            }
        } else {
            this.chat.classList.add('minimized');
            this.avatar.style.display = 'flex';
        }
    },

    // Enviar mensagem
    enviarMensagem: async function() {
        const texto = this.input.value.trim();
        if (!texto) return;

        // Mostrar mensagem do usuário
        this.adicionarMensagem(texto, 'user');
        this.input.value = '';
        
        // Desabilitar input durante processamento
        this.input.disabled = true;
        this.sendBtn.disabled = true;
        this.avatar.classList.add('thinking');

        // Mostrar indicador de digitação
        this.mostrarDigitando();

        try {
            // Verificar se é pergunta sobre estatísticas
            if (texto.toLowerCase().includes('estatística') || 
                texto.toLowerCase().includes('quantas denúncias') ||
                texto.toLowerCase().includes('taxa de resolução')) {
                
                // Usar dados do Bot de Automatização
                if (window.BotAutomatizacao) {
                    const stats = BotAutomatizacao.getEstatisticas();
                    const resposta = this.formatarEstatisticas(stats);
                    this.removerDigitando();
                    this.adicionarMensagem(resposta, 'bot');
                } else {
                    this.removerDigitando();
                    this.adicionarMensagem("❌ Não foi possível obter as estatísticas no momento.", 'bot');
                }
            } else {
                // Enviar para IA
                const resposta = await this.enviarParaIA(texto);
                this.removerDigitando();
                this.adicionarMensagem(resposta, 'bot');
            }
        } catch (error) {
            this.removerDigitando();
            this.adicionarMensagem("❌ Desculpe, ocorreu um erro. Tente novamente.", 'bot');
        } finally {
            // Reabilitar input
            this.input.disabled = false;
            this.sendBtn.disabled = false;
            this.avatar.classList.remove('thinking');
            this.input.focus();
        }
    },

    // Formatar estatísticas
    formatarEstatisticas: function(stats) {
        return `📊 **Estatísticas Atuais:**\n\n` +
            `• Total de denúncias: ${stats.total}\n` +
            `• Em andamento: ${stats.andamento}\n` +
            `• Resolvidas: ${stats.resolvidas}\n` +
            `• Pendentes: ${stats.pendentes}\n` +
            `• Anônimas: ${stats.anonimas}\n` +
            `• Taxa de resolução: ${stats.taxaResolucao}%\n` +
            `• Tempo médio: ${stats.tempoMedio} dias`;
    },

    // Enviar para API da IA
    enviarParaIA: async function(mensagem) {
        if (!this.apiKey || this.apiKey === 'SUA_CHAVE_AQUI') {
            return "⚠️ **Assistente em modo de demonstração**\n\nPara usar a IA completa, configure uma chave da OpenAI. 😊";
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: this.getContexto() },
                        ...this.conversationHistory.slice(-10),
                        { role: 'user', content: mensagem }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.error) return `❌ Erro: ${data.error.message}`;
            
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erro na IA:', error);
            return "❌ Erro ao comunicar com a IA. Tente novamente.";
        }
    },

    // Contexto do sistema
    getContexto: function() {
        return `Você é um assistente virtual do Portal Cidadão, site de notícias e denúncias urbanas.
Localização: Sena Madureira - AC
Categorias: Buracos na rua, Iluminação pública, Lixo acumulado, Esgoto, Segurança, Acessibilidade, Saúde
Seja amigável e use emojis. Responda em português do Brasil.`;
    },

    // Mostrar indicador de digitação
    mostrarDigitando: function() {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        this.messagesDiv.appendChild(div);
        this.rolarParaFinal();
    },

    // Remover indicador de digitação
    removerDigitando: function() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    },

    // Adicionar mensagem ao chat
    adicionarMensagem: function(texto, remetente) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const html = `
            <div class="message ${remetente}">
                <div class="message-avatar">${remetente === 'bot' ? '🤖' : '👤'}</div>
                <div style="max-width: 85%;">
                    <div class="message-content">${texto}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
        this.messagesDiv.innerHTML += html;
        this.rolarParaFinal();
        
        // Salvar no histórico
        this.conversationHistory.push({ role: remetente, content: texto });
        localStorage.setItem('assistenteHistorico', JSON.stringify(this.conversationHistory.slice(-50)));
    },

    // Rolar para o final
    rolarParaFinal: function() {
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }
};
