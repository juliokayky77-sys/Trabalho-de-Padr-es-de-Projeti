const categoriasDenuncia = [
    { nome: "Buracos na rua", icone: "🕳️", desc: "Problemas de pavimentação" },
    { nome: "Iluminação pública", icone: "💡", desc: "Lâmpadas queimadas" },
    { nome: "Lixo acumulado", icone: "🗑️", desc: "Acúmulo de lixo" },
    { nome: "Esgoto a céu aberto", icone: "💩", desc: "Vazamentos" },
    { nome: "Segurança", icone: "🚔", desc: "Problemas de segurança" },
    { nome: "Ruas não asfaltadas", icone: "🛣️", desc: "Falta de pavimentação" },
    { nome: "Acessibilidade", icone: "♿", desc: "Falta de rampas" },
    { nome: "Saúde", icone: "🏥", desc: "Problemas nos postos" }
];

const noticiasSimuladas = [
    {
        titulo: "Prefeitura inaugura nova iluminação no Centro",
        categoria: "Infraestrutura",
        data: "20/03/2024",
        resumo: "Novas lâmpadas de LED foram instaladas em toda a região central.",
        imagem: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800"
    },
    {
        titulo: "Obras de asfalto chegam ao bairro Bosque",
        categoria: "Infraestrutura",
        data: "19/03/2024",
        resumo: "Mais de 2km de ruas serão pavimentadas nos próximos meses.",
        imagem: "https://images.unsplash.com/photo-1581094288338-2314bdb7b4a1?w=800"
    },
    {
        titulo: "Campanha de conscientização sobre lixo",
        categoria: "Meio Ambiente",
        data: "18/03/2024",
        resumo: "Programa de coleta seletiva será expandido para mais bairros.",
        imagem: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800"
    }
];

const bairros = [
    "Centro", "Jardim Primavera", "Bosque", "Cidade Nova", "Pista",
    "Bom Sucesso", "Vitória", "Segundo Distrito", "Praia do Amarilio", "Invasão"
];

const coordenadasBairros = {
    "Centro": [-9.0654, -68.6571],
    "Jardim Primavera": [-9.0580, -68.6500],
    "Bosque": [-9.0700, -68.6650],
    "Cidade Nova": [-9.0550, -68.6600],
    "Pista": [-9.0620, -68.6550],
    "Bom Sucesso": [-9.0680, -68.6700],
    "Vitória": [-9.0600, -68.6630],
    "Segundo Distrito": [-9.0800, -68.6800],
    "Praia do Amarilio": [-9.0720, -68.6750],
    "Invasão": [-9.0500, -68.6450]
};
