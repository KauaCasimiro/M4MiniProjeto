const express = require('express');
const debug = require('debug')('nodestr:server');
const server = express();
const fs = require('fs');
const path = require('path');

server.get('/', (req, res) => {
    return res.json({ mensagem: 'API Ok' })
});

function obterGastosMensais() {

    const caminhoArquivo = path.join(__dirname, 'src/data/gastos.json');

    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
        var dadosGastos = JSON.parse(conteudo);
        return dadosGastos;
    } catch (error) {
        console.error('Erro na leitura de dados', error.message);
        return {};
    }

};

function obterLucrosMensais() {

    const caminhoArquivo = path.join(__dirname, 'src/data/lucros.json');

    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
        var dadosLucros = JSON.parse(conteudo);
        return dadosLucros;
    } catch (error) {
        console.error('Erro na leitura de dados', error.message);
        return {};
    }

};

function gastosMensais() {
    const caminhoArquivo = path.join(__dirname, 'src/data/gastos.json');

    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
        const dadosGastos = JSON.parse(conteudo);

        function somarValoresMensais(valores) {
            const meses = Object.keys(valores);

            meses.forEach((mes) => {
                if (mes !== 'gastos') {
                    valores[mes].gastos = Object.values(valores[mes]).reduce((total, valor) => {
                        return typeof valor === 'number' ? total + valor : total;
                    }, 0);
                }
            });

            // Filtra os meses que têm gasto maior que zero
            const mesesComGastos = meses.filter((mes) => valores[mes].gastos > 0);

            // Cria um novo objeto com apenas os meses que têm gastos
            const valoresComGastos = mesesComGastos.reduce((obj, mes) => {
                obj[mes] = valores[mes];
                return obj;
            }, {});

            return valoresComGastos;
        }

        const gastosSomados = somarValoresMensais(dadosGastos);

        return gastosSomados;
    } catch (error) {
        console.error('Erro na leitura de dados', error.message);
        return {};
    }
};

function calcularDesempenho() {
    const gastos = gastosMensais();
    const lucros = obterLucrosMensais();
    const desempenho = {};

    const meses = Object.keys(gastos);

    meses.forEach((mes) => {
        if (lucros[mes]) {
            const gastosMensais = typeof gastos[mes].gastos === 'number' ? gastos[mes].gastos : 0;
            const lucroMensal = typeof lucros[mes] === 'number' ? lucros[mes] : 0;

            const margemLucroMensal = (lucroMensal / gastosMensais) * 100;

            desempenho[mes] = {
                gastos: gastosMensais,
                lucro: lucroMensal,
                margemLucro: margemLucroMensal,
            };
        };
    });

    return desempenho;
};

function obterDadosGerais() {
    const desempenho = calcularDesempenho();
    const trimestres = ["1º trimestre", "2º trimestre", "3º trimestre", "4º trimestre"];
    const lucrosTrimestrais = {};

    trimestres.forEach((trimestre, index) => {
        const mesInicial = index * 3;
        const mesFinal = mesInicial + 2;

        let lucroTrimestral = 0;

        for (let i = mesInicial; i <= mesFinal; i++) {
            const mes = Object.keys(desempenho)[i];
            if (mes && desempenho[mes]) {
                lucroTrimestral += desempenho[mes].lucro || 0;
            }
        }

        lucrosTrimestrais[trimestre] = lucroTrimestral.toFixed(2);
    });

    // Inicializa o "Lucro Trimestral" como um número
    const caminhoArquivo = path.join(__dirname, 'src/data/data.json');
    const conteudoAtual = fs.readFileSync(caminhoArquivo, 'utf-8');
    const dados = JSON.parse(conteudoAtual);

    dados["Lucro Trimestral"] = 0; // Inicializa como um número

    trimestres.forEach((trimestre) => {
        dados["Lucro Trimestral"] += parseFloat(lucrosTrimestrais[trimestre]) || 0;
    });

    // Ajusta para 2 números após a vírgula
    dados["Lucro Trimestral"] = dados["Lucro Trimestral"].toFixed(2);

    fs.writeFileSync(caminhoArquivo, JSON.stringify(dados, null, 2), 'utf-8');

    return lucrosTrimestrais;
};

// GET Dados Gerais

server.get('/dados-gerais', (req, res) => {
    const lucrosTrimestrais = obterDadosGerais();
    const caminhoArquivo = path.join(__dirname, 'src/data/data.json');
    const conteudoAtual = fs.readFileSync(caminhoArquivo, 'utf-8');
    const dados = JSON.parse(conteudoAtual);
    dados["Capital Investido"] = dados["Capital Investido"].toFixed(2);
    dados["Lucro Trimestral"] = lucrosTrimestrais;

    return res.json({ DadosGerais: dados });
});

/*********************************/

// GET Gastos Mensais
server.get('/gastos-mensais', (req, res) => {

    const gastosMensais = obterGastosMensais();

    return res.json({ gastosMensais });
});

/********************************/

//GET  Lucros Mensais
server.get('/lucros-mensais', (req, res) => {
    const lucrosMensais = obterLucrosMensais();

    return res.json({ lucrosMensais });
});

/********************************/

//GET Desempenho
server.get('/desempenho', (req, res) => {
    const desempenhoMensal = calcularDesempenho();

    
    Object.keys(desempenhoMensal).forEach((mes) => {
        desempenhoMensal[mes].margemLucro = desempenhoMensal[mes].margemLucro.toFixed(1) + '%';
    });

    return res.json({ Desempenho: desempenhoMensal });
});

/*******************************/

server.listen(2469, () => {
    console.log("Servidor Ok")
});