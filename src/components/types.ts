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