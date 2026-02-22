import fs from 'fs';

// 1. Lendo a base de dados gerada anteriormente
const rawData = fs.readFileSync('dataset.json', 'utf-8');
const dataset = JSON.parse(rawData);

// 2. Definindo a ordem ESTRITA das colunas (One-Hot Encoding)
// A ordem ão pode mudar, pois a rede neural aprende pela posição (índice)
const cores = ["azul", "vermelho", "verde", "preto", "amarelo"];
const localizacoes = ["São Paulo", "Rio", "Curitiba", "Recife", "São Luís"];
const categorias = ["premium", "medium", "basic"]; // Labels de saída

// 3. Encontrando a idade mínima e máxima para normalização Min-Max
const idades = dataset.map(p => p.idade);
const idadeMin = Math.min(...idades);
const idadeMax = Math.max(...idades);

console.log(`Metadados de Idade - Mínima: ${idadeMin}, Máxima: ${idadeMax}`);

// 4. Estruturas para guardar os dados normalizados
const inputsXs = [];
const labelsYs = [];

// 5. Processando pessoa por pessoa
dataset.forEach(pessoa => {
    // Normalizando a idade: (valor - min) / (max - min)
    let idadeNorm = 0;
    if (idadeMax !== idadeMin) {
        idadeNorm = (pessoa.idade - idadeMin) / (idadeMax - idadeMin);
    }

    // Gerando One-Hot para Cores (ex: azul -> [1, 0, 0, 0, 0])
    const corOneHot = cores.map(cor => pessoa.cor === cor ? 1 : 0);

    // Gerando One-Hot para Localização (ex: Rio -> [0, 1, 0, 0, 0])
    const localizacaoOneHot = localizacoes.map(loc => pessoa.localizacao === loc ? 1 : 0);

    // Montando o vetor de entrada da pessoa (Features)
    // Ficará algo como: [0.45,  1,0,0,0,0,  0,0,1,0,0] (Tamanho total: 1 + 5 + 5 = 11 posições)
    const xsVetor = [idadeNorm, ...corOneHot, ...localizacaoOneHot];
    inputsXs.push(xsVetor);

    // Gerando One-Hot para Categoria (ex: premium -> [1, 0, 0])
    const categoriaOneHot = categorias.map(cat => pessoa.categoria === cat ? 1 : 0);
    labelsYs.push(categoriaOneHot);
});

// 6. Preparando o objeto final para salvar
const dadosNormalizados = {
    metadata: {
        idadeMin,
        idadeMax,
        ordemFeatures: {
            cores,
            localizacoes
        },
        ordemLabels: categorias
    },
    inputs: inputsXs,
    labels: labelsYs
};

// 7. Salvando no novo arquivo JSON
try {
    fs.writeFileSync('normalized_dataset.json', JSON.stringify(dadosNormalizados, null, 2));
    console.log(`Sucesso! Dados normalizados salvos em 'normalized_dataset.json'.`);
    console.log(`Tamanho do Input (inputShape): ${inputsXs[0].length}`);
    console.log(`Tamanho do Output (units de saída): ${labelsYs[0].length}`);
} catch (error) {
    console.error("Erro ao salvar os dados normalizados:", error);
}