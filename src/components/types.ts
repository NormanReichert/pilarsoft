export type SecaoTransversal = {
    poligonal: Ponto[];
}[]
export type Ponto = {
    x: number;
    y: number;
}
export type Discretizacao = {
    discret: RetanguloCompleto[];
}[]
export type RetanguloCompleto = {
    cantoSuperiorEsquerdo: Ponto;
    largura: number,
    altura: number,
    cgX: number,
    cgY: number,
    area: number
}
export type Armaduras = {
    cgX: string,
    cgY: string,
    cgXCalc: number,
    cgYCalc: number,
    area: number,
    diametro: number    
}[]

export type RetanguloCalculo = {
    cgX: number,
    cgY: number,
    cgXCalc: number,
    cgYCalc: number
    area: number
}
export type DiscretizacaoCalc = {
    discret: RetanguloCalculo[];

}[]

export type Tensoes = {
    Epsilon: number, Tensao: number, Area: number, dy: number, dx: number, dyCalc: number, dxCalc: number
}[]
export type Logs = { tipo: string, mensagem: string }[];
// export type Secao_inputType = {
//     //nome: string,
//     //divX: number,
//     //divY: number,
//     //fixMalha: boolean,
//     secaoTransversal: SecaoTransversal
//     armaduras: Armaduras,
//     //subdivisaoMalha: number,
//     //anguloDecalculo: number,
//     epsilonCu: number,
//     epsilonC2: number,
//     epsilonAs: number,
//     //epsilonAsFy: number,
//     GamaC: number,
//     GamaS: number,
//     //gamaF3: number,
//     //toleranciaLN: number,
//     //beta: number,
//     nSd: number,
//     //angSelect: number,
//     //parteSecaoSelect: number,
// }
