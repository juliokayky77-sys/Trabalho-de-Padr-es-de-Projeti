const BotAutomatizacao = {
    config: {
        atualizarIntervalo: 30000,
        verificarDenunciasAntigas: 3600000,
        diasParaMoverAndamento: 7,
        monitorarComentarios: true,
        palavrasChaveResolucao: ["foi resolvido", "foi consertado", "já resolveram", "obra concluída", "taparam", "arrumaram"]
    },
    
    init: function(denunciasArray, updateFunctions) {
        console.log('🤖 Bot de Automatização Iniciado');
        this.denuncias = denunciasArray;
        this.updateFunctions = updateFunctions;
        this.iniciarMonitores();
        this.hookFormularios();
        setInterval(() => this.processarDenunciasAntigas(), this.config.verificarDenunciasAntigas);
        setInterval(() => this.atualizarEstatisticas(), this.config.atualizarIntervalo);
        if (this.config.monitorarComentarios) setInterval(() => this.verificarComentarios(), 60000);
    },
    
    iniciarMonitores: function() {
        console.log('📊 Monitores iniciados');
    },
    
    salvarDenuncias: function() {
        localStorage.setItem('denunciasPortal', JSON.stringify(this.denuncias));
    },
    
    atualizarEstatisticas: function() {
        if (this.updateFunctions.atualizarEstatisticas) {
            this.updateFunctions.atualizarEstatisticas();
        }
        if (this.updateFunctions.atualizarMapaCalor) {
            this.updateFunctions.atualizarMapaCalor();
        }
    },
    
    processarDenunciasAntigas: function() {
        const hoje = new Date();
        let alteracoes = false;
        this.denuncias.forEach(d => {
            if (d.status === 'pendente') {
                const dias = Math.round((hoje - new Date(d.data)) / (1000*60*60*24));
                if (dias >= this.config.diasParaMoverAndamento) {
                    d.status = 'andamento';
                    alteracoes = true;
                    console.log(`🔄 Denúncia #${d.id} movida para andamento (${dias} dias)`);
                }
            }
        });
        if (alteracoes) {
            this.salvarDenuncias();
            this.atualizarEstatisticas();
        }
    },
    
    verificarComentarios: function() {
        const comentarios = document.querySelectorAll('.comentario, .comment, .mensagem');
        comentarios.forEach(com => {
            const texto = com.textContent.toLowerCase();
            if (this.config.palavrasChaveResolucao.some(p => texto.includes(p))) {
                const bairrosEncontrados = bairros.filter(b => texto.includes(b.toLowerCase()));
                if (bairrosEncontrados.length) {
                    const denunciasRelacionadas = this.denuncias.filter(d => 
                        bairrosEncontrados.includes(d.bairro) && d.status !== 'resolvido'
                    );
                    denunciasRelacionadas.forEach(d => {
                        d.status = 'resolvido';
                        d.dataResolucao = new Date().toISOString();
                        console.log(`✅ Denúncia #${d.id} resolvida por comentário: "${texto.substring(0, 50)}"`);
                    });
                    if (denunciasRelacionadas.length) {
                        this.salvarDenuncias();
                        this.atualizarEstatisticas();
                    }
                }
            }
        });
    },
    
    hookFormularios: function() {
        document.getElementById('denunciaForm')?.addEventListener('submit', () => setTimeout(() => this.atualizarEstatisticas(), 100));
        document.getElementById('denunciaAnonimaForm')?.addEventListener('submit', () => setTimeout(() => this.atualizarEstatisticas(), 100));
    },
    
    getEstatisticas: function() {
        return {
            total: this.denuncias.length,
            resolvidas: this.denuncias.filter(d => d.status === 'resolvido').length,
            pendentes: this.denuncias.filter(d => d.status === 'pendente').length,
            andamento: this.denuncias.filter(d => d.status === 'andamento').length,
            anonimas: this.denuncias.filter(d => d.anonima).length,
            taxaResolucao: this.denuncias.length > 0 ? 
                Math.round((this.denuncias.filter(d => d.status === 'resolvido').length / this.denuncias.length) * 100) : 0
        };
    }
};
