# Example TensorFlow.js

Exemplo simples de classificação com rede neural usando TensorFlow.js no Node.js. O modelo aprende a prever a categoria de uma pessoa (premium, medium ou basic) com base em idade, cor favorita e localização.

## Arquivos

- **`generate.js`** — Gera um dataset sintético com 500 registros aleatórios (nome, idade, cor, localização e categoria) e salva em `dataset.json`. A quantidade pode ser alterada dentro do arquivo.

- **`normalize.js`** — Lê o `dataset.json`, aplica normalização Min-Max na idade e One-Hot Encoding nas features categóricas (cor e localização), e salva o resultado em `normalized_dataset.json` junto com os metadados necessários para predição.

- **`index.js`** — Carrega o `normalized_dataset.json`, treina uma rede neural sequencial com TensorFlow.js (1000 épocas, otimizador Adam) e abre um loop interativo no terminal onde o usuário informa idade, cor e localização para receber a predição de categoria com probabilidades.

- **`package.json`** — Configuração do projeto Node.js com a dependência `@tensorflow/tfjs-node`.

## Como usar

```bash
# 1. Instalar dependências
npm install

# 2. Gerar o dataset
node generate.js

# 3. Normalizar os dados
node normalize.js

# 4. Treinar o modelo e fazer predições
npm start
```
