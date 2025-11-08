import { useEffect, useState } from "react";
import type { Inputs, Outputs } from "../compute";
import type { Discretizacao, SecaoTransversal, RetanguloCompleto, Armaduras, DiscretizacaoCalc, Tensoes, Logs } from "./types";


type Props = {
    solve: Outputs,
    inputs: Inputs,
    onInputsChange: (inputs: Inputs) => void,
    onEnvoltoriaChange?: (envoltoria: Array<{MRdX: number, MRdY: number}>) => void
}

const Secao = (props: Props) => {

    //variáveis globais

    const NSd = -props.solve.Nsd;
    const epsilonCu = -0.0035;
    const epsilonC2 = -0.002;
    const epsilonAs = 0.01;
    const epsilonAsFy = (props.inputs.fyk / props.inputs.gama_s) / 210000;
    const GamaC = props.inputs.gama_c;
    const GamaS = props.inputs.gama_s;
    const GamaF3 = 1;
    const toleranciaLN = 0.0001;
    const beta = 0.85;
    const fck = props.inputs.fck / 10;
    const fyk = props.inputs.fyk / 10;


    const secaoTransversal: SecaoTransversal = [
        {
            poligonal: [
                { x: 0, y: 0 },
                { x: props.inputs.a, y: 0 },
                { x: props.inputs.a, y: props.inputs.b },
                { x: 0, y: props.inputs.b },
                { x: 0, y: 0 }
            ]
        }
    ];

    const [discretizacao, setDiscretizacao] = useState<Discretizacao>([]);

    // Usar armaduras dos inputs ao invés de estado local
    const armaduras = props.inputs.armaduras || [];

    //recalcula a discretização toda a vez que a seção ou armaduras mudam
    useEffect(() => {

        // Dividir a seção em 20 elementos na largura e 20 na altura
        const numElementosLargura = 20;
        const numElementosAltura = 20;

        const largura = props.inputs.a; // largura total da seção
        const altura = props.inputs.b;   // altura total da seção

        const larguraElemento = largura / numElementosLargura;
        const alturaElemento = altura / numElementosAltura;

        const novaDiscretizacao: Discretizacao = [];

        // Criar malha de elementos
        for (let i = 0; i < numElementosAltura; i++) {
            for (let j = 0; j < numElementosLargura; j++) {

                // Coordenadas do canto superior esquerdo
                const x = j * larguraElemento;
                const y = altura - (i * alturaElemento); // y cresce de baixo para cima

                // Centro de gravidade do retângulo
                const cgX = x + larguraElemento / 2;
                const cgY = y - alturaElemento / 2;

                // Área do retângulo
                const area = larguraElemento * alturaElemento;

                const retangulo: RetanguloCompleto = {
                    cantoSuperiorEsquerdo: { x, y },
                    largura: larguraElemento,
                    altura: alturaElemento,
                    cgX,
                    cgY,
                    area
                };

                // Adicionar ao array de discretização
                // Como Discretizacao é um array de objetos com propriedade discret
                // Vamos adicionar um elemento por linha
                if (j === 0) {
                    novaDiscretizacao.push({ discret: [retangulo] });
                } else {
                    novaDiscretizacao[i].discret.push(retangulo);
                }
            }
        }

        setDiscretizacao(novaDiscretizacao);

    }, [props.inputs.a, props.inputs.b]);

    //====================== Cálculos principais====================
    useEffect(() => {
        // Só calcular se houver armaduras
        if (!armaduras || armaduras.length === 0) {
            return;
        }

        let angulo = 10;
        let quantidadeDeCalculos = (angulo > 0) ? Math.floor(360 / angulo) : 1;
        let anguloPorCalculo = 360 / quantidadeDeCalculos;
        let logs: Logs = [];
        let graficoNMxMy = [];


        //Verifica se suporta o NSd
        if (NSd < 0) {
            let NRd = calculoDoNRdCompressao(secaoTransversal, discretizacao, fck, fyk, armaduras, epsilonC2, epsilonCu, epsilonAsFy, GamaC, GamaS, GamaF3, beta);
            if (NRd > NSd) {
                //logs.push({ tipo: "erro", mensagem: dict.logs.NcSdFalha });
                console.error("Não suporta compressão", NRd);
                // alert(`Não suporta compressão`) //##Aqui
                return;
            }
        }
        else {
            let NRd = calculoDoNRdTracao(armaduras, epsilonAs, fyk, epsilonAsFy, GamaS, GamaF3);
            if (NRd < NSd) {
                //logs.push({ tipo: "erro", mensagem: dict.logs.NtSdFalha });
                console.error("Não suporta tração", NRd);
                // alert(`Não suporta tração`) //##Aqui
                return;
            }
        }
        //começam os cálculos
        for (let i = 0; i <= quantidadeDeCalculos; i++) {
            let anguloRad = anguloPorCalculo * i * (Math.PI / 180);
            //let anguloRad = 1.49144999;
            // Adaptar listas para o ângulo atual
            let secaoTransversalAngulo = mudaCoordenadasAnguloSecaoTransversal(secaoTransversal, anguloRad);
            let discretizacaoAngulo = mudaCoordenadasAnguloDiscretizacao(discretizacao, anguloRad);
            let armadurasAngulo = mudaCoordenadasAnguloArmaduras(armaduras, anguloRad);

            let d = calculoDoD(secaoTransversalAngulo, armadurasAngulo);

            //Linha neutra
            let LN = LinhaNeutra(fck, fyk, d, NSd, anguloRad, secaoTransversalAngulo, discretizacaoAngulo, armadurasAngulo, toleranciaLN, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, GamaF3, beta);
            //logs Forças LN
            logs.push(...LN.logs);
            //forças no aço e concreto
            let ForcasAC = CalculaFxLN(fck, fyk, LN.xi, d, NSd, secaoTransversalAngulo, discretizacaoAngulo, armadurasAngulo, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta)
            //logs Forças AC
            logs.push(...ForcasAC.logs);
            //cálculo dos momentos resistentes
            let MRdX = momentoResistenteX(ForcasAC.TensoesAco, ForcasAC.TensoesConcreto, ForcasAC.TensoesPosBarras, GamaF3, props.inputs.a, props.inputs.b);
            let MRdY = momentoResistenteY(ForcasAC.TensoesAco, ForcasAC.TensoesConcreto, ForcasAC.TensoesPosBarras, GamaF3, props.inputs.a, props.inputs.b);
            graficoNMxMy.push({ MRdX: MRdX, MRdY: MRdY });
            
        }
        console.log("🚀 ~ Secao ~ graficoNMxMy:", graficoNMxMy)
        
        // Enviar envoltória para o componente pai
        if (props.onEnvoltoriaChange && graficoNMxMy.length > 0) {
            props.onEnvoltoriaChange(graficoNMxMy);
        }
    }, [discretizacao, armaduras, NSd, fck, fyk, epsilonC2, epsilonCu, epsilonAsFy, epsilonAs, GamaC, GamaS, GamaF3, beta, toleranciaLN, props.inputs.a, props.inputs.b]);








    // INFORMAÇÕES RENSdERIZADAS
    return (
        <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Discretização da Seção Transversal</h3>
            
            {armaduras.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    Nenhuma armadura cadastrada. Adicione armaduras na aba "Dados de entrada".
                </p>
            ) : (
                <div>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>Armaduras cadastradas:</strong> {armaduras.length}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Os cálculos estão sendo realizados com base nas armaduras informadas na aba "Dados de entrada".
                    </p>
                </div>
            )}
            
            {/* Aqui pode adicionar futuramente a visualização SVG da seção */}
        </div>
    );
}

export default Secao;





//====================== FUNÇÕES DE CÁLCULO ====================

//##aqui adaptações das variáveis
export function calculoDoNRdCompressao(SecaoTransversal: SecaoTransversal, discretizacao: Discretizacao, fck: number, fyk: number, armaduras: Armaduras, epsilonC2: number, epsilonCu: number, epsilonAsFy: number, GamaC: number, GamaS: number, GamaF3: number,
    beta: number): number {

    let NcRd = 0;
    let ForcaConcreto = 0;
    let ForcaAco = 0;
    let AreaConcreto: { fck: number, area: number }[] = [];

    // cálculo das áreas de concreto por poligonal
    discretizacao.forEach(item => {
        let area = 0;
        item.discret.forEach(retangulo => {
            area += retangulo.area;
        });
        AreaConcreto.push({ fck, area });
    });




    //calcula a resistência de cada poligonal
    AreaConcreto.forEach(item => {
        ForcaConcreto += calculoTensaoConcreto(epsilonC2, epsilonCu, epsilonC2, item.fck, item.fck / GamaC, beta) * item.area;
    });
    //diminuindo a parcela de concreto onde tem aço
    let barrasFck: { fck: number; areaArmadura: number; }[] = [];
    armaduras.forEach(armadura => {
        barrasFck.push({
            fck: fck,
            areaArmadura: armadura.area
        });
    });
    barrasFck.forEach(item => {
        ForcaConcreto -= calculoTensaoConcreto(epsilonC2, epsilonCu, epsilonC2, item.fck, item.fck / GamaC, beta) * item.areaArmadura;

    });

    //Cálculo da armadura passiva
    armaduras.forEach(item => {
        ForcaAco += calculoTensaoAco(epsilonC2, epsilonAsFy, fyk / GamaS) * item.area;

    });


    //Soma as resistências
    NcRd = (ForcaConcreto + ForcaAco) / GamaF3;


    return NcRd;
}

//##aqui adaptações das variáveis
export function calculoDoNRdTracao(armaduras: Armaduras, epsilonAs: number, fyk: number, epsilonAsFy: number, GamaS: number, GamaF3: number
): number {

    let NtRd = 0;
    let ForcaAco = 0;

    //Cálculo da armadura passiva
    armaduras.forEach(item => {
        ForcaAco += calculoTensaoAco(epsilonAs, epsilonAsFy, fyk / GamaS) * item.area;

    });

    NtRd = ForcaAco / GamaF3;

    return NtRd;
}

export function calculoTensaoConcreto(deformacao: number, epsilonCu: number, epsilonC2: number, fck: number, fcd: number, beta: number): number {
    // Ajustando o n com base em fck
    const n = fck > 5 ? 1.4 + 23.4 * Math.pow((90 - fck * 10) / 100, 4) : 2;

    // Calculando tensão com base na deformação
    if (deformacao <= 0 && deformacao >= epsilonC2) {
        return -beta * fcd * (1 - Math.pow(1 - deformacao / epsilonC2, n));
    } else if (deformacao > 0 || deformacao < epsilonCu) {
        return 0;
    }

    return -beta * fcd;
}

export function calculoTensaoAco(deformacao: number, epsilonFy: number, fyd: number): number {

    return Math.abs(deformacao) >= epsilonFy ? Math.sign(deformacao) * fyd : (fyd / epsilonFy) * deformacao;
}

// Ajuste para a função mudaCoordenadasAnguloSecaoTransversal
/**
 * Rotaciona as coordenadas dos pontos de uma seção transversal pelo ângulo especificado.
 *
 * Esta função aplica uma transformação de rotação às coordenadas de cada ponto
 * das poligonais que definem a seção transversal. A rotação é realizada em torno do
 * eixo de origem (0, 0) e ajusta as coordenadas para representar a nova orientação
 * da seção após a rotação. O ângulo de rotação é fornecido em radianos.
 *
 * @param {SecaoTransversal} secaoTransversal - Estrutura que contém as poligonais da seção transversal.
 * Cada poligonal é uma coleção de pontos que definem as bordas da seção.
 *
 * @param {number} anguloRad - O ângulo de rotação em radianos. Um valor positivo indica uma rotação
 * no sentido anti-horário, enquanto um valor negativo indica uma rotação no sentido horário.
 *
 * @returns {SecaoTransversal} Uma nova estrutura de seção transversal com as coordenadas dos pontos
 * ajustadas após a rotação pelo ângulo especificado. A estrutura e formato dos dados de entrada são
 * mantidos, alterando-se apenas as coordenadas dos pontos das poligonais.
 *
 * */
export function mudaCoordenadasAnguloSecaoTransversal(secaoTransversal: SecaoTransversal, anguloRad: number): SecaoTransversal {

    return secaoTransversal.map(st => ({
        ...st,
        poligonal: st.poligonal.map(ponto => {
            return {
                x: ponto.x * Math.cos(anguloRad) - ponto.y * Math.sin(anguloRad), // Ajustado
                y: ponto.x * Math.sin(anguloRad) + ponto.y * Math.cos(anguloRad)

            };
        })
    }));
}
// Ajuste para a função mudaCoordenadasAnguloDiscretizacao
/**
 * Aplica uma rotação às coordenadas dos elementos discretizados de uma seção,
 * baseando-se em um ângulo especificado.
 *
 * Esta função modifica as coordenadas (`cgX` e `cgY`) dos elementos que compõem
 * a discretização de uma seção de concreto armado, aplicando uma rotação de acordo
 * com o ângulo fornecido. As novas coordenadas calculadas (`cgXCalc` e `cgYCalc`)
 * refletem a posição dos elementos após a rotação. Essa transformação é útil para
 * análises estruturais que requerem a seção em uma orientação específica.
 *
 * @param {Discretizacao} discretizacao - Uma coleção de elementos discretizados da seção,
 * cada um representando uma parte específica da seção com suas coordenadas originais (`cgX`, `cgY`)
 * e área (`area`). A estrutura também inclui propriedades adicionais como `nome` e `fck` para
 * cada elemento.
 *
 * @param {number} anguloRad - O ângulo de rotação em radianos. Valores positivos indicam rotação
 * no sentido anti-horário, enquanto valores negativos indicam rotação no sentido horário.
 *
 * @returns {DiscretizacaoCalc} Uma nova coleção de elementos discretizados com as coordenadas
 * ajustadas (`cgXCalc` e `cgYCalc`) após a aplicação da rotação.
 */

export function mudaCoordenadasAnguloDiscretizacao(discretizacao: Discretizacao, anguloRad: number): DiscretizacaoCalc {

    let novaDiscretizacao: DiscretizacaoCalc = discretizacao.map(item => ({
        discret: item.discret.map(retangulo => ({
            cgX: retangulo.cgX,
            cgY: retangulo.cgY,
            cgXCalc: retangulo.cgX * Math.cos(anguloRad) - retangulo.cgY * Math.sin(anguloRad),
            cgYCalc: retangulo.cgX * Math.sin(anguloRad) + retangulo.cgY * Math.cos(anguloRad),
            area: retangulo.area

        }))
    }));
    return novaDiscretizacao
}

// Ajuste para a função mudaCoordenadasAnguloArmaduras

export function mudaCoordenadasAnguloArmaduras(armaduras: Armaduras, anguloRad: number): Armaduras {

    return armaduras.map(armadura => ({
        ...armadura,
        cgX: armadura.cgX,
        cgY: armadura.cgY,
        cgXCalc: Number(armadura.cgX) * Math.cos(anguloRad) - Number(armadura.cgY) * Math.sin(anguloRad),
        cgYCalc: Number(armadura.cgX) * Math.sin(anguloRad) + Number(armadura.cgY) * Math.cos(anguloRad)

    }));
}


/**
 * Calcula a distância efetiva 'd' entre a fibra mais comprimida de concreto
 * e o centro de gravidade da camada mais distante de armaduras tracionadas.
 *
 * A distância 'd' é um parâmetro crucial no design de seções de concreto armado,
 * usado para determinar a capacidade resistente à flexão de uma seção.
 *
 * @param {DiscretizacaoCalc} discretizacao - Dados de discretização da seção de concreto,
 * incluindo as coordenadas calculadas do centro de gravidade de cada retângulo de discretização (cgYCalc).
 * Esta estrutura representa a parte de concreto da seção transversal.
 *
 * @param {Armaduras} armaduras - Informações sobre as armaduras na seção de concreto armado,
 * incluindo a coordenada y calculada do centro de gravidade das armaduras (cgYCalc).
 * Esta estrutura representa a parte de aço da seção transversal.
 *
 * @returns {number} A distância 'd', calculada como a diferença entre a coordenada y máxima
 * do concreto (a fibra mais comprimida) e a coordenada y mínima das armaduras (o centro de gravidade
 * da camada mais distante de armaduras tracionadas).
 */
export function calculoDoD(secao: SecaoTransversal, armaduras: Armaduras): number {

    // Extrai as coordenadas y de concreto e armaduras, calcula max e min diretamente
    const listaConcretoCoordenadas = secao.flatMap(item => item.poligonal.map(retangulo => retangulo.y));
    const coordenadaBarra = armaduras.map(item => item.cgYCalc);

    // Calcula coordMaxConcreto e coordMinAco diretamente dos arrays
    const coordMaxConcreto = Math.max(...listaConcretoCoordenadas);
    const coordMinAco = Math.min(...coordenadaBarra);

    // Calcula e retorna d
    return coordMaxConcreto - coordMinAco;
}


/**
 * Calcula a posição da linha neutra em uma seção de concreto armado.
 *
 * Utiliza um método iterativo para encontrar a posição da linha neutra que equilibra as forças
 * de compressão no concreto e tração na armadura, considerando uma força normal aplicada e um momento fletor.
 *
 * @param {number} d - Altura útil da seção.
 * @param {number} Nd - Força normal aplicada à seção.
 * @param {number} angle - Ângulo da seção transversal em relação ao eixo neutro.
 * @param {SecaoTransversal} SecaoTransversal - Informações sobre a seção transversal.
 * @param {DiscretizacaoCalc} Discretizacao - Dados de discretização da seção.
 * @param {Armaduras} Armaduras - Informações sobre a armadura da seção.
 * @param {number} tolerancia - Tolerância para o cálculo iterativo.
 * @param {number} epsilonCu, epsilonC2, epsilonAs, epsilonAsFy - Propriedades dos materiais.
 * @param {number} GamaC, GamaS, GamaF3 - Fatores de segurança.
 * @param {number} beta - Coeficiente de consideração de forma da seção.
 * @returns { xi: number, logs: Logs} - Posição da linha neutra ou NaN em caso de falha no cálculo.
 */
export function LinhaNeutra(fck: number, fyk: number, d: number, Nd: number, angle: number, SecaoTransversal: SecaoTransversal, Discretizacao: DiscretizacaoCalc, Armaduras: Armaduras, tolerancia: number, epsilonCu: number,
    epsilonC2: number, epsilonAs: number, epsilonAsFy: number, GamaC: number, GamaS: number, GamaF3: number, beta: number) {

    let logs: Logs = [];
    let xMin = -d;
    let xMax = 2 * d;
    let xi = xMin;
    const tol = Math.max(Nd * tolerancia, 0.01); // Garante uma tolerância mínima
    const maxIterations = 550;

    let BreakA = 0;
    //verifica o xMin para o intervalo
    while (CalculaFxLN(fck, fyk, xMin, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta).FxLN > 0) {
        xMax = xMin;
        xMin *= 10;
        if (BreakA > maxIterations) {
            console.error("Não foi possível calcular o intervalo da linha neutra min");
            return { xi: NaN, logs: logs }; // Utilize NaN para indicar falha no cálculo
        }
        BreakA++;
    }
    let BreakB = 0;
    //verifica o xMax para o intervalo
    while (CalculaFxLN(fck, fyk, xMax, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta).FxLN < 0) {
        xMin = xMax;
        xMax *= 10;
        if (BreakB > maxIterations) {
            console.error("Não foi possível calcular o intervalo da linha neutra max");
            return { xi: NaN, logs: logs };
        }
        BreakB++;
    }
    let BreakC = 0;
    //vcalcula a altura da linha neutra
    while (Math.abs(CalculaFxLN(fck, fyk, xi, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta).FxLN) > tol) {

        let fxMin = CalculaFxLN(fck, fyk, xMin, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta).FxLN;
        let fxMax = CalculaFxLN(fck, fyk, xMax, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta).FxLN;
        if (fxMax === fxMin) {
            fxMax += 1;
        }
        xi = (xMin * fxMax - xMax * fxMin) / (fxMax - fxMin);

        let calculo = CalculaFxLN(fck, fyk, xi, d, Nd, SecaoTransversal, Discretizacao, Armaduras, epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta);
        if (calculo.FxLN > 0) {
            xMin = xi;
        } else {
            xMax = xi;
        }

        if (BreakC > maxIterations) {
            console.error(`Não foi possível encontrar a solução. Ângulo: ${angle}rad`);
            return { xi: NaN, logs: logs };
        }
        BreakC++;
    }
    const result = { xi, logs }

    return result;
}
/**
 * Calcula a força resultante (FxLN) em uma seção de concreto armado, considerando a posição da linha neutra (xLN),
 * a altura útil da seção (d), a força normal (Nd), as propriedades do material, e a geometria da seção.
 * Também calcula as tensões no concreto e na armadura, ajustadas pela distância até a linha neutra.
 *
 * @param {number} xLN - Posição estimada da linha neutra.
 * @param {number} d - Altura útil da seção.
 * @param {number} Nd - Força normal aplicada à seção.
 * @param {SecaoTransversal} SecaoTransversal - Informações sobre a seção transversal.
 * @param {DiscretizacaoCalc} Discretizacao - Dados de discretização da seção.
 * @param {Armaduras} Armaduras - Informações sobre a armadura da seção.
 * @param {number} epsilonCu, epsilonC2, epsilonAs, epsilonAsFy, GamaC, GamaS, beta - Propriedades dos materiais e fatores de segurança.
 * @returns Um objeto contendo a força resultante (FxLN), as tensões calculadas e os logs de operação.
 */
export function CalculaFxLN(fck: number, fyk: number, xLN: number, d: number, Nd: number, SecaoTransversal: SecaoTransversal, Discretizacao: DiscretizacaoCalc, Armaduras: Armaduras, epsilonCu: number,
    epsilonC2: number, epsilonAs: number, epsilonAsFy: number, GamaC: number, GamaS: number, beta: number) {
    let logs: Logs = [];
    let TensoesAco: Tensoes = [];
    let TensoesConcreto: Tensoes = [];
    let TensoesPosBarras: Tensoes = [];

    let yConcreto: number[] = SecaoTransversal.flatMap(secao => secao.poligonal.map(ponto => ponto.y));
    let alturaSecao = Math.max(...yConcreto) - Math.min(...yConcreto);
    let yLinhaSup = Math.abs(Math.max(...yConcreto))
    let yLinhaInf = d - yLinhaSup;
    let Phi = 0;
    let EpsilonCG = 0;
    let dominio = 0;

    // Determinação do domínio
    let LimD2 = (-epsilonCu / (-epsilonCu + epsilonAs)) * d;
    if (xLN <= LimD2) {
        dominio = 2;
        Phi = -epsilonAs / (d - xLN);
        EpsilonCG = (epsilonAs + (Phi * yLinhaInf));

    } else if (xLN <= alturaSecao) {
        dominio = 4;
        Phi = epsilonCu / xLN;
        EpsilonCG = epsilonCu + (-Phi * yLinhaSup);

    } else {
        dominio = 5;
        let Lambda = ((-epsilonCu + epsilonC2) / -epsilonCu);
        Phi = epsilonC2 / (xLN - (Lambda * alturaSecao));
        EpsilonCG = Phi * (xLN - yLinhaSup);

    }

    // Cálculo das deformações e tensões
    Discretizacao.forEach(item => {
        item.discret.forEach(discret => {
            let Epsilon = EpsilonCG + Phi * discret.cgYCalc;
            let Tensao = calculoTensaoConcreto(Epsilon, epsilonCu, epsilonC2, fck, fck / GamaC, beta);
            TensoesConcreto.push({ Epsilon, Tensao, Area: discret.area, dy: discret.cgY, dx: discret.cgX, dyCalc: discret.cgYCalc, dxCalc: discret.cgXCalc });
        });
    });

    Armaduras.forEach(armadura => {
        let Epsilon = EpsilonCG + Phi * armadura.cgYCalc;
        let Tensao = calculoTensaoAco(Epsilon, epsilonAsFy, fyk / GamaS);
        TensoesAco.push({ Epsilon, Tensao, Area: armadura.area, dy: Number(armadura.cgY), dx: Number(armadura.cgX), dyCalc: armadura.cgYCalc, dxCalc: armadura.cgXCalc });

    });

    //diminuindo a parcela de concreto onde tem aço
    Armaduras.forEach(armadura => {
        let Epsilon = EpsilonCG + Phi * armadura.cgYCalc;
        if (Epsilon < 0) {
            let Tensao = calculoTensaoConcreto(Epsilon, epsilonCu, epsilonC2, fck, fck / GamaC, beta);
            TensoesPosBarras.push({ Epsilon, Tensao, Area: armadura.area, dy: Number(armadura.cgY), dx: Number(armadura.cgX), dyCalc: armadura.cgYCalc, dxCalc: armadura.cgXCalc });
        }


    });
    // Calcula forças no concreto e no aço, e determina FxLN
    let ForcaCompressao = 0;
    let ForcaTracao = 0;

    for (let i = 0; i < TensoesConcreto.length; i++) {
        ForcaCompressao += TensoesConcreto[i].Area * TensoesConcreto[i].Tensao;
    }
    for (let i = 0; i < TensoesPosBarras.length; i++) {
        ForcaCompressao -= TensoesPosBarras[i].Area * TensoesPosBarras[i].Tensao;
    }
    for (let i = 0; i < TensoesAco.length; i++) {
        let CalcAco = TensoesAco[i].Area * TensoesAco[i].Tensao;

        if (CalcAco > 0) {
            ForcaTracao += CalcAco;
        } else {
            ForcaCompressao += CalcAco;
        }
    }

    //As tensoes precisam estar nas mesmas coordenadas da discretização
    let FxLN = Nd - ForcaCompressao - ForcaTracao;
    const resultado = { FxLN, TensoesAco, TensoesConcreto, TensoesPosBarras, dominio, logs, ForcaTracao, ForcaCompressao, EpsilonCG }


    return resultado;
}


/**
 * Calcula o momento resistente em torno do eixo X de uma seção.
 *
 * Esta função calcula o momento resistente resultante das forças
 * de tração e compressão atuantes na armadura e no concreto,
 * respectivamente, considerando a distância ao eixo neutro e ajustando
 * pela taxa de segurança GamaF3.
 *
 * @param {Tensoes} TensoesAco - As tensões atuantes na armadura.
 * @param {Tensoes} TensoesConcreto - As tensões atuantes no concreto.
 * @param {Tensoes} TensosBarrasConcreto - As tensões nas barras de concreto consideradas separadamente.
 * @param {number} GamaF3 - Fator de segurança.
 * @returns {number} - O momento resistente em torno do eixo X (Mx).
 */

export function momentoResistenteX(TensoesAco: Tensoes, TensoesConcreto: Tensoes, TensosBarrasConcreto: Tensoes, GamaF3: number, larguraSecao: number, alturaSecao: number): number {

    // Centro geométrico da seção
    const centroY = alturaSecao / 2;

    let ForcaConcreto = 0;
    let ForcaAco = 0;
    TensoesConcreto.forEach(item => {
        // Ajustar dy para ser relativo ao centro geométrico
        const dyRelativo = item.dy - centroY;
        ForcaConcreto += item.Area * item.Tensao * dyRelativo;
    });
    TensosBarrasConcreto.forEach(item => {
        // Ajustar dy para ser relativo ao centro geométrico
        const dyRelativo = item.dy - centroY;
        ForcaConcreto -= item.Area * item.Tensao * dyRelativo;
    });
    TensoesAco.forEach(item => {
        // Ajustar dy para ser relativo ao centro geométrico
        const dyRelativo = item.dy - centroY;
        ForcaAco += item.Area * item.Tensao * dyRelativo;
    });
    const Mx = ((ForcaConcreto + ForcaAco) / (GamaF3)) / 100;
    return Mx
}


/**
 * Calcula o momento resistente em torno do eixo Y de uma seção.
 *
 * Esta função calcula o momento resistente resultante das forças
 * de tração e compressão atuantes na armadura e no concreto,
 * respectivamente, considerando a distância ao eixo neutro e ajustando
 * pela taxa de segurança GamaF3.
 *
 * @param {Tensoes} TensoesAco - As tensões atuantes na armadura.
 * @param {Tensoes} TensoesConcreto - As tensões atuantes no concreto.
 * @param {Tensoes} TensosBarrasConcreto - As tensões nas barras de concreto consideradas separadamente.
 * @param {number} GamaF3 - Fator de segurança.
 * @returns {number} - O momento resistente em torno do eixo Y (My).
 */
export function momentoResistenteY(TensoesAco: Tensoes, TensoesConcreto: Tensoes, TensosBarrasConcreto: Tensoes, GamaF3: number, larguraSecao: number, alturaSecao: number): number {

    // Centro geométrico da seção
    const centroX = larguraSecao / 2;

    let ForcaConcreto = 0;
    let ForcaAco = 0;
    TensoesConcreto.forEach(item => {
        // Ajustar dx para ser relativo ao centro geométrico
        const dxRelativo = item.dx - centroX;
        ForcaConcreto += item.Area * item.Tensao * dxRelativo;
    });
    TensosBarrasConcreto.forEach(item => {
        // Ajustar dx para ser relativo ao centro geométrico
        const dxRelativo = item.dx - centroX;
        ForcaConcreto -= item.Area * item.Tensao * dxRelativo;
    });
    TensoesAco.forEach(item => {
        // Ajustar dx para ser relativo ao centro geométrico
        const dxRelativo = item.dx - centroX;
        ForcaAco += item.Area * item.Tensao * dxRelativo;
    });

    const My = -((ForcaConcreto + ForcaAco) / (GamaF3)) / 100;

    return My
}