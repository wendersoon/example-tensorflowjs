import fs from 'fs';

// Conjuntos de dados para a geração aleatória
const nomes = ["Erick", "Ana", "Carlos", "João", "Maria", "Fernanda", "Lucas", "Julia", "Pedro", "Luiza", "Rafael", "Beatriz"];
const cores = ["azul", "vermelho", "verde", "preto", "amarelo"]; 
const localizacoes = ["São Paulo", "Rio", "Curitiba", "Recife", "São Luís"];  
const categorias = ["premium", "medium", "basic"];

// Funções utilitárias para randomização
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomIdade = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Função principal de geração
function gerarBaseDeDados(quantidade) {
    const dados = [];

    for (let i = 0; i < quantidade; i++) {
        const pessoa = {
            id: i + 1,
            nome: getRandomItem(nomes),
            idade: getRandomIdade(18, 65), // Idades variando entre 18 e 65 anos
            cor: getRandomItem(cores),
            localizacao: getRandomItem(localizacoes),
            // A categoria aqui representa o label que o modelo tentará prever no futuro
            categoria: getRandomItem(categorias)
        };
        dados.push(pessoa);
    }

    return dados;
}

// Configuração e Execução
const quantidadeRegistros = 500; // Altere este valor para gerar mais ou menos dados
const dataset = gerarBaseDeDados(quantidadeRegistros);

// Gravação do arquivo JSON
try {
    fs.writeFileSync('dataset.json', JSON.stringify(dataset, null, 2));
    console.log(`Base de dados com ${quantidadeRegistros} registros foi salva em 'dataset.json'.`);
} catch (error) {
    console.error("Erro ao salvar o arquivo JSON:", error);
}