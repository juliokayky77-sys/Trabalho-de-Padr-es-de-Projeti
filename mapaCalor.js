const MapaCalor = {
    config: {
        niveis: [
            { max: 2, cor: "#2ecc71", nome: "Tranquilo", icone: "🟢" },
            { max: 5, cor: "#f1c40f", nome: "Atenção", icone: "🟡" },
            { max: 10, cor: "#e67e22", nome: "Crítico", icone: "🟠" },
            { max: Infinity, cor: "#e74c3c", nome: "Emergência", icone: "🔴" }
        ]
    },
    
    getNivel: function(total) {
        for (let nivel of this.config.niveis) {
            if (total <= nivel.max) return nivel;
        }
        return this.config.niveis[3];
    },
    
    atualizar: function(denuncias) {
        const container = document.getElementById('mapa-bairros');
        if (!container) return;
        
        const dados = {};
        bairros.forEach(b => dados[b] = { total: 0, resolvidas: 0, andamento: 0, pendentes: 0 });
        
        denuncias.forEach(d => {
            if (dados[d.bairro]) {
                dados[d.bairro].total++;
                if (d.status === 'resolvido') dados[d.bairro].resolvidas++;
                if (d.status === 'andamento') dados[d.bairro].andamento++;
                if (d.status === 'pendente') dados[d.bairro].pendentes++;
            }
        });
        
        const totalGeral = denuncias.length;
        const totalResolvidas = denuncias.filter(d => d.status === 'resolvido').length;
        const taxaGeral = totalGeral > 0 ? Math.round((totalResolvidas / totalGeral) * 100) : 0;
        
        let html = `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--gray-100); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <strong>📊 Resumo Geral</strong>
                        <div>📌 ${totalGeral} denúncias | ✅ ${totalResolvidas} resolvidas | 📈 ${taxaGeral}% sucesso</div>
                    </div>
                    <div>
                        <span class="legend-item">🟢 Tranquilo (0-2)</span>
                        <span class="legend-item">🟡 Atenção (3-5)</span>
                        <span class="legend-item">🟠 Crítico (6-10)</span>
                        <span class="legend-item">🔴 Emergência (10+)</span>
                    </div>
                </div>
            </div>
        `;
        
        Object.entries(dados).forEach(([bairro, stats]) => {
            const nivel = this.getNivel(stats.total);
            const porcentagemBarra = Math.min((stats.total / 20) * 100, 100);
            const taxaResolucao = stats.total > 0 ? Math.round((stats.resolvidas / stats.total) * 100) : 0;
            
            html += `
                <div class="bairro-card" onclick="MapaCalor.mostrarDetalhes('${bairro}')">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <strong>${nivel.icone} ${bairro}</strong>
                        <span style="font-size: 0.8rem;">${stats.total} denúncias</span>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-bottom: 8px; font-size: 0.85rem;">
                        <span>✅ ${stats.resolvidas}</span>
                        <span>🔄 ${stats.andamento}</span>
                        <span>⏳ ${stats.pendentes}</span>
                    </div>
                    <div style="margin: 8px 0;">
                        <div style="font-size: 0.75rem; margin-bottom: 2px;">🔥 Calor: ${nivel.nome}</div>
                        <div class="bairro-nivel">
                            <div style="width: ${porcentagemBarra}%; height: 8px; background: ${nivel.cor};"></div>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; margin-bottom: 2px;">📈 Resolução: ${taxaResolucao}%</div>
                        <div class="bairro-nivel">
                            <div class="progress-fill" style="width: ${taxaResolucao}%; height: 8px; background: var(--success);"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    mostrarDetalhes: function(bairro) {
        const stats = { total: 0, resolvidas: 0, andamento: 0, pendentes: 0 };
        window.denunciasGlobal.forEach(d => {
            if (d.bairro === bairro) {
                stats.total++;
                if (d.status === 'resolvido') stats.resolvidas++;
                if (d.status === 'andamento') stats.andamento++;
                if (d.status === 'pendente') stats.pendentes++;
            }
        });
        const taxa = stats.total > 0 ? Math.round((stats.resolvidas / stats.total) * 100) : 0;
        const nivel = this.getNivel(stats.total);
        
        const msg = `🏘️ **${bairro}** - ${nivel.icone} ${nivel.nome}\n\n` +
            `📊 **Estatísticas:**\n` +
            `• Total: ${stats.total} denúncias\n` +
            `• Resolvidas: ${stats.resolvidas}\n` +
            `• Em andamento: ${stats.andamento}\n` +
            `• Pendentes: ${stats.pendentes}\n` +
            `• Taxa de sucesso: ${taxa}%\n\n` +
            `🔥 **Nível de calor:** ${nivel.nome}\n` +
            `💡 **Recomendação:** ${stats.total > 5 ? 'Prioridade alta!' : 'Monitoramento regular'}`;
        
        if (window.AssistenteVirtual) {
            window.AssistenteVirtual.adicionarMensagem(msg, 'bot');
        } else {
            alert(msg);
        }
    },
    
    gerarPontosMapa: function(denuncias) {
        const dados = {};
        bairros.forEach(b => dados[b] = 0);
        denuncias.forEach(d => { if (dados[d.bairro] !== undefined) dados[d.bairro]++; });
        
        return Object.entries(dados).filter(([b, t]) => t > 0 && coordenadasBairros[b]).map(([b, t]) => ({
            lat: coordenadasBairros[b][0],
            lng: coordenadasBairros[b][1],
            intensidade: t,
            cor: this.getNivel(t).cor,
            bairro: b
        }));
    }
};
