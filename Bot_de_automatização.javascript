// ===== BOT 2 - AUTOMATIZADOR DE DENÚNCIAS (INVISÍVEL) =====
const BotAutomatizacao = {
    // Configurações
    config: {
        atualizarIntervalo: 30000,        // 30 segundos
        verificarDenunciasAntigas: 3600000, // 1 hora
        diasParaMoverAndamento: 7,         // dias para mover para "em andamento"
        limitePendentesAlerta: 20,          // limite para alerta de pendentes
        taxaMinimaAceitavel: 30,            // taxa mínima de resolução
        limiteBairroCritico: 10              // denúncias para bairro crítico
    },

    // Estatísticas em tempo real
    estatisticas: {
        total: 0,
        pendentes: 0,
        andamento: 0,
        resolvidas: 0,
        anonimas: 0,
        taxaResolucao: 0,
        tempoMedio: 0,
        ultimaAtualizacao: null
    },

    // Inicializar o bot
    init: function() {
        console.log('🤖 Bot de Automatização Iniciado (modo invisível)');
        this.carregarDenuncias();
        this.atualizarEstatisticas();
        this.iniciarMonitores();
        this.hookFormularios();
        this.carregarAlertas();
    },

    // Carregar denúncias do localStorage
    carregarDenuncias: function() {
        const saved = localStorage.getItem('denunciasPortal');
        if (saved) {
            window.denuncias = JSON.parse(saved);
        }
    },

    // Salvar denúncias
    salvarDenuncias: function() {
        localStorage.setItem('denunciasPortal', JSON.stringify(window.denuncias));
    },

    // Atualizar todas as estatísticas
    atualizarEstatisticas: function() {
        const d = window.denuncias || [];
        
        this.estatisticas = {
            total: d.length,
            pendentes: d.filter(d => d.status === 'pendente').length,
            andamento: d.filter(d => d.status === 'andamento').length,
            resolvidas: d.filter(d => d.status === 'resolvido').length,
            anonimas: d.filter(d => d.anonima === true).length,
            taxaResolucao: d.length > 0 ? Math.round((d.filter(d => d.status === 'resolvido').length / d.length) * 100) : 0,
            tempoMedio: this.calcularTempoMedio(),
            ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        };

        // Salvar para outros componentes
        localStorage.setItem('botEstatisticas', JSON.stringify(this.estatisticas));
        
        // Verificar alertas
        this.verificarAlertas();
        
        console.log('📊 Estatísticas atualizadas:', this.estatisticas);
    },

    // Calcular tempo médio de resolução
    calcularTempoMedio: function() {
        const resolvidas = window.denuncias?.filter(d => d.status === 'resolvido' && d.dataResolucao) || [];
        if (resolvidas.length === 0) return 0;
        
        const totalDias = resolvidas.reduce((acc, d) => {
            const dataDenuncia = new Date(d.data);
            const dataResolucao = new Date(d.dataResolucao || new Date());
            return acc + Math.round((dataResolucao - dataDenuncia) / (1000 * 60 * 60 * 24));
        }, 0);
        
        return Math.round(totalDias / resolvidas.length);
    },

    // Processar denúncias antigas (automático)
    processarDenunciasAntigas: function() {
        const hoje = new Date();
        let alteracoes = false;

        (window.denuncias || []).forEach(denuncia => {
            if (denuncia.status === 'pendente') {
                const dataDenuncia = new Date(denuncia.data);
                const diasAtras = Math.round((hoje - dataDenuncia) / (1000 * 60 * 60 * 24));
                
                if (diasAtras >= this.config.diasParaMoverAndamento) {
                    denuncia.status = 'andamento';
                    denuncia.dataAtualizacao = hoje.toISOString();
                    alteracoes = true;
                    console.log(`🔄 Denúncia #${denuncia.id} movida para "Em Andamento" (${diasAtras} dias)`);
                }
            }
        });

        if (alteracoes) {
            this.salvarDenuncias();
            this.atualizarEstatisticas();
            this.atualizarInterfaces();
        }
    },

    // Verificar alertas
    verificarAlertas: function() {
        const alertas = [];
        
        if (this.estatisticas.pendentes > this.config.limitePendentesAlerta) {
            alertas.push(`🔴 ${this.estatisticas.pendentes} denúncias pendentes!`);
        }
        
        if (this.estatisticas.taxaResolucao < this.config.taxaMinimaAceitavel && this.estatisticas.total > 0) {
            alertas.push(`🔴 Taxa de resolução baixa: ${this.estatisticas.taxaResolucao}%`);
        }
        
        const bairrosCriticos = this.getBairrosCriticos();
        if (bairrosCriticos.length > 0) {
            alertas.push(`📍 Bairros críticos: ${bairrosCriticos.join(', ')}`);
        }

        if (alertas.length > 0) {
            this.salvarAlertas(alertas);
            console.log('🚨 Alertas:', alertas);
        }
    },

    // Identificar bairros críticos
    getBairrosCriticos: function() {
        const bairrosMap = {};
        (window.denuncias || []).forEach(d => {
            if (d.status !== 'resolvido') {
                bairrosMap[d.bairro] = (bairrosMap[d.bairro] || 0) + 1;
            }
        });
        
        return Object.entries(bairrosMap)
            .filter(([_, count]) => count > this.config.limiteBairroCritico)
            .map(([bairro]) => bairro);
    },

    // Salvar alertas
    salvarAlertas: function(alertas) {
        const alertasAntigos = JSON.parse(localStorage.getItem('botAlertas') || '[]');
        const novosAlertas = [...alertas, ...alertasAntigos].slice(0, 20);
        localStorage.setItem('botAlertas', JSON.stringify(novosAlertas));
    },

    // Carregar alertas
    carregarAlertas: function() {
        const alertas = localStorage.getItem('botAlertas');
        if (alertas) {
            console.log('📋 Últimos alertas:', JSON.parse(alertas));
        }
    },

    // Iniciar monitores automáticos
    iniciarMonitores: function() {
        // Monitor de denúncias antigas (a cada hora)
        setInterval(() => {
            this.processarDenunciasAntigas();
        }, this.config.verificarDenunciasAntigas);

        // Monitor de estatísticas (a cada 30 segundos)
        setInterval(() => {
            this.atualizarEstatisticas();
        }, this.config.atualizarIntervalo);

        // Relatório diário (meia-noite)
        setInterval(() => {
            this.gerarRelatorioDiario();
        }, 24 * 60 * 60 * 1000);
    },

    // Hook nos formulários de denúncia
    hookFormularios: function() {
        // Formulário normal
        const formNormal = document.getElementById('denunciaForm');
        if (formNormal) {
            const originalSubmit = formNormal.onsubmit;
            formNormal.onsubmit = (e) => {
                if (originalSubmit) originalSubmit(e);
                setTimeout(() => {
                    this.processarNovaDenuncia();
                }, 100);
            };
        }

        // Formulário anônimo
        const formAnonimo = document.getElementById('denunciaAnonimaForm');
        if (formAnonimo) {
            const originalSubmit = formAnonimo.onsubmit;
            formAnonimo.onsubmit = (e) => {
                if (originalSubmit) originalSubmit(e);
                setTimeout(() => {
                    this.processarNovaDenuncia();
                }, 100);
            };
        }
    },

    // Processar nova denúncia
    processarNovaDenuncia: function() {
        this.atualizarEstatisticas();
        this.verificarAlertas();
        this.atualizarInterfaces();
        console.log('📝 Nova denúncia processada');
    },

    // Atualizar todas as interfaces do site
    atualizarInterfaces: function() {
        // Chamar funções existentes do site
        if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas();
        if (typeof renderizarDenunciasCompleta === 'function') renderizarDenunciasCompleta();
        if (typeof renderizarDenunciasRecentes === 'function') renderizarDenunciasRecentes();
        if (typeof renderizarRanking === 'function') renderizarRanking();
        if (typeof renderizarMapaCalor === 'function') renderizarMapaCalor();
        if (typeof renderizarDenunciasAnonimasRecentes === 'function') renderizarDenunciasAnonimasRecentes();
        if (typeof carregarDenunciasNoMapa === 'function') carregarDenunciasNoMapa();
    },

    // Gerar relatório diário
    gerarRelatorioDiario: function() {
        const relatorio = {
            data: new Date().toLocaleString('pt-BR'),
            estatisticas: this.estatisticas,
            bairrosCriticos: this.getBairrosCriticos(),
            desempenho: {
                tempoMedio: this.estatisticas.tempoMedio,
                produtividade: Math.round(this.estatisticas.resolvidas / (this.estatisticas.total || 1) * 100)
            }
        };
        
        const relatorios = JSON.parse(localStorage.getItem('botRelatorios') || '[]');
        relatorios.push(relatorio);
        if (relatorios.length > 30) relatorios.shift();
        localStorage.setItem('botRelatorios', JSON.stringify(relatorios));
        
        console.log('📊 Relatório diário:', relatorio);
    },

    // API Pública para outros componentes
    getEstatisticas: function() {
        return { ...this.estatisticas };
    },

    getAlertas: function() {
        return JSON.parse(localStorage.getItem('botAlertas') || '[]');
    },

    getRelatorios: function() {
        return JSON.parse(localStorage.getItem('botRelatorios') || '[]');
    },

    // Forçar processamento manual (para testes)
    forcarProcessamento: function() {
        this.processarDenunciasAntigas();
        this.atualizarEstatisticas();
        console.log('⚙️ Processamento forçado concluído');
    }
};
