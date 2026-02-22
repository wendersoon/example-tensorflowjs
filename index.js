import tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import readline from 'readline';

// Configuração da interface de linha de comando (CLI)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função auxiliar para transformar o readline em Promise
const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function trainModel(inputXs, outputYs, inputShapeLength) {
    // Inicializa um modelo sequencial, onde as camadas são empilhadas linearmente, 
    // uma alimentando a próxima.
    const model = tf.sequential()

    // 1ª Camada (Oculta / Entrada):
    // inputShape: Define dinamicamente o tamanho do vetor de entrada (ex: idade + n cores + n cidades).
    // units: 160 neurônios. Aumentar esse número aumenta a capacidade do modelo de aprender 
    //        padrões complexos, mas também aumenta o custo computacional e o risco de overfitting.
    // activation: 'relu' (Rectified Linear Unit). Zera valores negativos e mantém os positivos. 
    //             Ajuda a resolver o problema do desvanecimento do gradiente e acelera o treinamento.
    model.add(tf.layers.dense({
        inputShape: [inputShapeLength], 
        units: 160, 
        activation: 'relu' 
    }))
    
    // 2ª Camada (Saída):
    // units: 3 neurônios, correspondendo exatamente às 3 categorias possíveis (premium, medium, basic).
    // activation: 'softmax'. Transforma a saída dos 3 neurônios em uma distribuição de probabilidade,
    //             garantindo que a soma de todas as saídas seja exatamente 1 (ou 100%).
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))

    // Compilação: Configura como o modelo vai aprender.
    // optimizer: 'adam' (Adaptive Moment Estimation). Ajusta a taxa de aprendizado dinamicamente 
    //            durante o treinamento, sendo geralmente mais rápido e eficiente que o SGD tradicional.
    // loss: 'categoricalCrossentropy'. A função de perda ideal para classificação multiclasse com one-hot encoding.
    //       Ela penaliza severamente o modelo quando ele prevê com alta confiança a classe errada.
    // metrics: ['accuracy']. Acompanha a porcentagem de acertos durante o treinamento.
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    })

    console.log("Iniciando o treinamento do modelo...");
    
    // Treinamento (Ajuste de Pesos):
    await model.fit(
        inputXs,   // Tensores de entrada (Features)
        outputYs,  // Tensores de saída (Labels / Gabarito)
        {
            verbose: 0,    // Desativa os logs de barra de progresso padrão do TF
            epochs: 1000,  // O modelo verá o conjunto de dados completo 1000 vezes.
            shuffle: true, // Embaralha os dados a cada época para evitar que o modelo decore a ordem (overfitting).
            callbacks: {
                // Hook executado ao final de cada época para monitorar a convergência (redução da loss).
                onEpochEnd: (epoch, log) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${log.loss.toFixed(4)} & accuracy = ${log.acc.toFixed(4)}`)
                }
            },
        },
    )

    console.log("Treinamento concluído com sucesso!\n");
    return model
}

async function predict(model, pessoaTensorArray) {
    const tfInput = tf.tensor2d(pessoaTensorArray)
    const pred = model.predict(tfInput)
    const predArray = await pred.array()
    
    // Libera a memória do tensor (boa prática)
    tfInput.dispose();
    pred.dispose();

    return predArray[0].map((prob, index) => ({ prob, index }))
}

async function main() {
    // 1. Carregar os dados normalizados
    console.log("Carregando o dataset...");
    const rawData = fs.readFileSync('normalized_dataset.json', 'utf-8');
    const dataset = JSON.parse(rawData);
    
    const { inputs, labels, metadata } = dataset;
    
    // Convertendo para tensores
    const inputXs = tf.tensor2d(inputs);
    const outputYs = tf.tensor2d(labels);
    
    // O tamanho do inputShape agora é dinâmico (no nosso caso atual, 11)
    const inputShapeLength = inputs[0].length;

    // 2. Treinar o modelo
    const model = await trainModel(inputXs, outputYs, inputShapeLength);

    // 3. Loop interativo com o usuário
    console.log("--- TESTE DE PREDIÇÃO ---");
    console.log(`Cores válidas: ${metadata.ordemFeatures.cores.join(', ')}`);
    console.log(`Cidades válidas: ${metadata.ordemFeatures.localizacoes.join(', ')}\n`);

    while (true) {
        try {
            const idadeInput = await askQuestion("Idade: ");
            const corInput = (await askQuestion("Cor: ")).toLowerCase().trim();
            const localizacaoInput = (await askQuestion("Localização: ")).trim(); // Case sensitive conforme o JSON

            // Validar entradas básicas
            if (!idadeInput || isNaN(idadeInput)) {
                console.log("Idade inválida. Tente novamente.\n");
                continue;
            }

            // Normalização dinâmica do usuário
            const idadeNumerica = Number(idadeInput);
            let idadeNorm = 0;
            if (metadata.idadeMax !== metadata.idadeMin) {
                // Se a idade for maior que a máxima ou menor que a mínima, o valor pode passar de 1 ou ser < 0
                // Isso é normal em predições, a rede tenta extrapolar.
                idadeNorm = (idadeNumerica - metadata.idadeMin) / (metadata.idadeMax - metadata.idadeMin);
            }

            // Transformando a entrada em One-Hot Arrays baseando-se no metadata original
            const corOneHot = metadata.ordemFeatures.cores.map(c => c === corInput ? 1 : 0);
            const locOneHot = metadata.ordemFeatures.localizacoes.map(l => l === localizacaoInput ? 1 : 0);

            // Montar o vetor exato que a rede espera: [idade, cor1, cor2..., loc1, loc2...]
            const pessoaVetor = [[idadeNorm, ...corOneHot, ...locOneHot]];

            // 4. Fazer a Predição
            const predictions = await predict(model, pessoaVetor);

            const results = predictions
                .sort((a, b) => b.prob - a.prob)
                .map(p => ` - ${metadata.ordemLabels[p.index]}: ${(p.prob * 100).toFixed(2)}%`)
                .join('\n');

            console.log("\nResultados da Predição:");
            console.log(results);
            console.log("----------------------------------\n");

        } catch (error) {
            console.error("Ocorreu um erro na predição:", error);
        }
        
        // Perguntar se deseja continuar
        const continuar = await askQuestion("Fazer nova predição? (s/n): ");
        if (continuar.toLowerCase() !== 's') {
            console.log("Encerrando. Até mais!");
            break;
        }
        console.log("\n");
    }

    rl.close();
}

// Iniciar a aplicação
main();