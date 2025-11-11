// compute.ts - gerado a partir de PP-kappa.txt
export type Travamento = {
  id: string;
  coordenada: number; // coordenada da base até o travamento (cm)
  compressao: number; // compressão no travamento (kN)
  momentoSuperior: number; // momento superior aplicado no travamento (kN·m)
  momentoInferior: number; // momento inferior aplicado no travamento (kN·m)
  direcao: 'x' | 'y';
};

export type SegmentoPilar = {
  inicio: number; // coordenada de início do segmento (cm)
  fim: number;    // coordenada de fim do segmento (cm)
  comprimento: number; // comprimento do segmento (cm)
  travamentosX: boolean; // se há travamento em X no início e fim
  travamentosY: boolean; // se há travamento em Y no início e fim
};

export type Inputs = {
  // Seção transversal (cm)
  a: number; // largura
  b: number; // altura
  h: number; // altura do pilar
  // Coeficientes
  gama_c: number;
  gama_s: number;
  gama_f: number;
  // Materiais
  fck: number; // MPa
  fyk: number; // MPa
  // Esforços característicos
  Nsk: number;   // kN
  Msk_tx: number; // kN·m
  Msk_bx: number; // kN·m
  Msk_ty: number; // kN·m
  Msk_by: number; // kN·m
  // Travamentos
  travamentos: Travamento[];
  // Armaduras
  armaduras?: Array<{
    cgX: string;
    cgY: string;
    cgXCalc: number;
    cgYCalc: number;
    area: number;
    diametro: number;
  }>;
  // Momentos resistentes da envoltória (kN·m)
  MRdX?: number;
  MRdY?: number;
};

export type SegmentoResultado = {
  inicio: number; // coordenada inicial (cm)
  fim: number; // coordenada final (cm)
  centro: number; // coordenada do centro (cm)
  Nk_superior: number; // compressão aplicada na coordenada superior (kN)
  Mbase: number; // momento na coordenada inferior (kN·m)
  Mtop: number; // momento na coordenada superior (kN·m)
  M2d: number | null; // momento de segunda ordem calculado (kN·m) ou null se não convergiu
};

export type Outputs = {
  fcd: number; // kN/cm²
  fyd: number; // kN/cm²
  Nsd: number; // kN
  Msd_tx: number; // kN·m
  Msd_bx: number; // kN·m
  Msd_ty: number; // kN·m
  Msd_by: number; // kN·m
  Ix: number; // cm^4
  As: number; // cm²
  ix: number;  // cm
  lamda_x: number; // adim
  lamda_y: number; // adim
  MAx: number; // kN·m
  MBx: number;    // kN·m
  MAy: number; // kN·m
  MBy: number;    // kN·m
  alfa_bx: number; // adim
  alfa_by: number; // adim
  ex: number;   // m
  erx: number;  // adim
  lamda1_x: number; // adim
  lamda1_y: number; // adim
  fa: number; // adim
  M1dminxx: number; // kN·m
  M1dminyy: number; // kN·m
  Mdtotminxx: number; // kN·m (M2d,min direção X)
  Mdtotminyy: number; // kN·m (M2d,min direção Y)
  segmentos_x: SegmentoResultado[]; // resultados por segmento direção X
  segmentos_y: SegmentoResultado[]; // resultados por segmento direção Y
  // Resultados globais de M2d
  resKappax: { kappax: number; Msdx_tot: number; iterations: number; convergiu: boolean; erro: string | null };
  resKappay: { kappay: number; Msdy_tot: number; iterations: number; convergiu: boolean; erro: string | null };
};

export function compute(inp: Inputs): Outputs {
  const { a, b, h, gama_c, gama_s, gama_f, fck, fyk, Nsk, Msk_tx, Msk_bx, Msk_ty, Msk_by, travamentos } = inp;

  // Materiais em kN/cm². 1 MPa = 10 kN/cm²
  const fcd = fck / gama_c / 10;
  const fyd = fyk / gama_s / 10;

  // Esforços de cálculo
  const Nsd = Nsk * gama_f;
  const Msd_tx = Msk_tx * gama_f;
  const Msd_bx = Msk_bx * gama_f;
  const Msd_ty = Msk_ty * gama_f;
  const Msd_by = Msk_by * gama_f;

  // Geometria
  const As = a * b;

  const Ix = (a * Math.pow(b, 3)) / 12;
  const ix = Math.sqrt(Ix / As);
  
  const Iy = (b * Math.pow(a, 3)) / 12;
  const iy = Math.sqrt(Iy / As);
  
  // Comprimentos de flambagem considerando travamentos
  const comprimentoFlambagemX = calcularComprimentoFlambagem(h, travamentos, 'x');
  const comprimentoFlambagemY = calcularComprimentoFlambagem(h, travamentos, 'y');
  
  // Índices de esbeltez com comprimentos de flambagem
  const lamda_x = comprimentoFlambagemX / ix;
  const lamda_y = comprimentoFlambagemY / iy;

  // Combinação de momentos
  const MAx = Math.max(Math.abs(Msd_tx), Math.abs(Msd_bx));
  const MBxMin = Math.min(Math.abs(Msd_tx), Math.abs(Msd_bx));
  const MBx = Msd_tx * Msd_bx >= 0 ? MBxMin : -MBxMin;

  const MAy = Math.max(Math.abs(Msd_ty), Math.abs(Msd_by));
  const MByMin = Math.min(Math.abs(Msd_ty), Math.abs(Msd_by));
  const MBy = Msd_ty * Msd_by >= 0 ? MByMin : -MByMin;

  // Parâmetro alfa_b
  const alfa_bx = MAx !== 0 ? Math.max(0.4, Math.min(1.0, 0.6 + 0.4 * (MBx / MAx))) : 1.0;
  const alfa_by = MAy !== 0 ? Math.max(0.4, Math.min(1.0, 0.6 + 0.4 * (MBy / MAy))) : 1.0;

  // Excentricidades
  const ex = Nsd !== 0 ? (Math.abs(Msd_bx) / Nsd) * 100 : 0;
  const erx = a !== 0 ? ex / a : 0;

  const ey = Nsd !== 0 ? (Math.abs(Msd_by) / Nsd) * 100 : 0;
  const ery = a !== 0 ? ey / a : 0;

  // Esbeltez limite
  const lamda1_x = alfa_bx !== 0 ? (25 + 12.5 * erx) / alfa_bx : Number.NaN;
  const lamda1_y = alfa_by !== 0 ? (25 + 12.5 * ery) / alfa_by : Number.NaN;

  // Força adimensional
  const fa = As !== 0 && fcd !== 0 ? Nsd / (As * fcd) : Number.NaN;

  // Momento mínimo de primeira ordem
  const M1dminxx = Nsd * (0.015 + 0.03 * b / 100);
  const M1dminyy = Nsd * (0.015 + 0.03 * a / 100);

  // Calcular resultados por segmento para direção X
  const segmentosX = dividirPilarEmSegmentos(h, travamentos, 'x');
  const segmentos_x: SegmentoResultado[] = segmentosX.map(segmento => {

    // Determinar Nk_superior (compressão na coordenada superior)
    let Nk_superior = 0;
    const travamentoNoFim = travamentos.find(t => t.coordenada === segmento.fim && t.direcao === 'x');
    if (travamentoNoFim) {
      Nk_superior = travamentoNoFim.compressao * gama_f; // majorar compressão do travamento
    } else if (segmento.fim === h) {
      Nk_superior = Nsd; // no topo do pilar (valor de cálculo majorado)
    }

    // Determinar momentos na base e topo do segmento
    let Mbase = 0, Mtop = 0;
    // Momento na base: se existe travamento logo abaixo, pega momentoSuperior dele
    if (segmento.inicio === 0) {
      Mbase = Msd_bx; // base do pilar (valor de cálculo majorado)
    } else {
      const travamentoAbaixo = travamentos.find(t => t.coordenada === segmento.inicio && t.direcao === 'x');
      if (travamentoAbaixo) {
        Mbase = travamentoAbaixo.momentoSuperior * gama_f; // majorar momento do travamento
      }
    }
    // Momento no topo: se existe travamento logo acima, pega momentoInferior dele
    if (segmento.fim === h) {
      Mtop = Msd_tx; // topo do pilar (valor de cálculo majorado)
    } else {
      const travamentoAcima = travamentos.find(t => t.coordenada === segmento.fim && t.direcao === 'x');
      if (travamentoAcima) {
        Mtop = travamentoAcima.momentoInferior * gama_f; // majorar momento do travamento
      }
    }
    
    // Calcular lambda para o segmento
    const lamda_segmento = segmento.comprimento / ix;
    
    // Calcular M2d para o segmento
    const resultadoM2d = calcularM2dPorSegmento({
      segmentoComprimento: segmento.comprimento,
      Nk_superior: Nk_superior,
      Mbase: Mbase,
      Mtop: Mtop,
      lamda_segmento: lamda_segmento,
      fa: fa,
      alfa_b_segmento: alfa_bx,
      dimensaoTransversal: b,
      Nsd: Nsd,
      MRd: inp.MRdX // Passa MRdX para direção X
    });
    
    return {
      inicio: segmento.inicio,
      fim: segmento.fim,
      centro: (segmento.inicio + segmento.fim) / 2,
      Nk_superior: Nk_superior,
      Mbase: Mbase,
      Mtop: Mtop,
      M2d: resultadoM2d.convergiu ? resultadoM2d.M2d : null
    };
  });

  // Calcular resultados por segmento para direção Y
  const segmentosY = dividirPilarEmSegmentos(h, travamentos, 'y');
  const segmentos_y: SegmentoResultado[] = segmentosY.map(segmento => {
    // Determinar Nk_superior (compressão na coordenada superior)
    let Nk_superior = 0;
    const travamentoNoFim = travamentos.find(t => t.coordenada === segmento.fim && t.direcao === 'y');
    if (travamentoNoFim) {
      Nk_superior = travamentoNoFim.compressao * gama_f; // majorar compressão do travamento
    } else if (segmento.fim === h) {
      Nk_superior = Nsd; // no topo do pilar (valor de cálculo majorado)
    }

    // Determinar momentos na base e topo do segmento
    let Mbase = 0, Mtop = 0;
    // Momento na base: se existe travamento logo abaixo, pega momentoSuperior dele
    if (segmento.inicio === 0) {
      Mbase = Msd_by; // base do pilar (valor de cálculo majorado)
    } else {
      const travamentoAbaixo = travamentos.find(t => t.coordenada === segmento.inicio && t.direcao === 'y');
      if (travamentoAbaixo) {
        Mbase = travamentoAbaixo.momentoSuperior * gama_f; // majorar momento do travamento
      }
    }
    // Momento no topo: se existe travamento logo acima, pega momentoInferior dele
    if (segmento.fim === h) {
      Mtop = Msd_ty; // topo do pilar (valor de cálculo majorado)
    } else {
      const travamentoAcima = travamentos.find(t => t.coordenada === segmento.fim && t.direcao === 'y');
      if (travamentoAcima) {
        Mtop = travamentoAcima.momentoInferior * gama_f; // majorar momento do travamento
      }
    }
    
    // Calcular lambda para o segmento (direção Y usa raio de giração iy)
    const iy = Math.sqrt(Iy / As);
    const lamda_segmento = segmento.comprimento / iy;
    
    // Calcular M2d para o segmento
    const resultadoM2d = calcularM2dPorSegmento({
      segmentoComprimento: segmento.comprimento,
      Nk_superior: Nk_superior,
      Mbase: Mbase,
      Mtop: Mtop,
      lamda_segmento: lamda_segmento,
      fa: fa,
      alfa_b_segmento: alfa_by,
      dimensaoTransversal: a,
      Nsd: Nsd,
      MRd: inp.MRdY // Passa MRdY para direção Y
    });
    
    return {
      inicio: segmento.inicio,
      fim: segmento.fim,
      centro: (segmento.inicio + segmento.fim) / 2,
      Nk_superior: Nk_superior,
      Mbase: Mbase,
      Mtop: Mtop,
      M2d: resultadoM2d.convergiu ? resultadoM2d.M2d : null
    };
  });

  // Calcular M2d global para direção X
  const resKappax = resolverKappaMsd_x({
    lamda_x,
    fa,
    alfa_bx,
    MAx,
    b,
    Nsd,
    MRdX: inp.MRdX // Passa MRdX da envoltória
  });

  // Calcular M2d global para direção Y
  const resKappay = resolverKappaMsd_y({
    lamda_y,
    fa,
    alfa_by,
    MAy,
    a,
    Nsd,
    MRdY: inp.MRdY // Passa MRdY da envoltória
  });

  // Calcular M2d,mín para direção X usando M1d,mín como momento de 1ª ordem
  // MA = MB = M1d,mín para o cálculo de M2d,mín
  const alfa_b_min_x = 0.6 + 0.4 * (M1dminxx / M1dminxx); // = 1.0 (momentos iguais)
  const M2dmin_x = calcularM2d({
    lambda: lamda_x,
    fa,
    alfa_b: alfa_b_min_x,
    MA: M1dminxx,
    dimensaoTransversal: b,
    N: Nsd,
    MRd: inp.MRdX
  });

  // Calcular M2d,mín para direção Y usando M1d,mín como momento de 1ª ordem
  const alfa_b_min_y = 0.6 + 0.4 * (M1dminyy / M1dminyy); // = 1.0 (momentos iguais)
  const M2dmin_y = calcularM2d({
    lambda: lamda_y,
    fa,
    alfa_b: alfa_b_min_y,
    MA: M1dminyy,
    dimensaoTransversal: a,
    N: Nsd,
    MRd: inp.MRdY
  });

  // Calcular Md,tot,mín = M2d,mín (não é soma, é apenas M2d,mín)
  const Mdtotminxx = M2dmin_x.convergiu ? M2dmin_x.M2d : 0;
  const Mdtotminyy = M2dmin_y.convergiu ? M2dmin_y.M2d : 0;

  console.log('📊 Momento Mínimo Total:');
  console.log(`  M1d,min,xx = ${M1dminxx.toFixed(2)} kN·m`);
  console.log(`  M2d,min,xx = ${M2dmin_x.convergiu ? M2dmin_x.M2d.toFixed(2) : 'N/A'} kN·m`);
  console.log(`  Md,tot,min,xx = ${Mdtotminxx.toFixed(2)} kN·m`);
  console.log(`  M1d,min,yy = ${M1dminyy.toFixed(2)} kN·m`);
  console.log(`  M2d,min,yy = ${M2dmin_y.convergiu ? M2dmin_y.M2d.toFixed(2) : 'N/A'} kN·m`);
  console.log(`  Md,tot,min,yy = ${Mdtotminyy.toFixed(2)} kN·m`);

  return { 
    fcd, fyd, Nsd, Msd_tx, Msd_bx, Msd_ty, Msd_by, Ix, As, ix, lamda_x, lamda_y, 
    MAx, MBx, MAy, MBy, alfa_bx, alfa_by, ex, erx, lamda1_x, lamda1_y, fa, 
    M1dminxx, M1dminyy, Mdtotminxx, Mdtotminyy, segmentos_x, segmentos_y, resKappax, resKappay
  };
}

// Valores padrão
export const defaultInputs: Inputs = {
  a: 20, b: 40, h: 340,
  gama_c: 1.4, gama_s: 1.15, gama_f: 1,
  fck: 30, fyk: 500,
  Nsk: 540,
  Msk_tx: -30, Msk_bx: 50,
  Msk_ty: -10, Msk_by: 48,
  travamentos: [],
  armaduras: [
    { cgX: '5', cgY: '5', cgXCalc: 5, cgYCalc: 5, area: 2, diametro: 16 },
    { cgX: '15', cgY: '5', cgXCalc: 15, cgYCalc: 5, area: 2, diametro: 16 },
    { cgX: '5', cgY: '35', cgXCalc: 5, cgYCalc: 35, area: 2, diametro: 16 },
    { cgX: '15', cgY: '35', cgXCalc: 15, cgYCalc: 35, area: 2, diametro: 16 }
  ],
};

// Função para cálculo de M2d
export function calcularM2d(params: {
  lambda: number;
  fa: number;
  alfa_b: number;
  MA: number;
  dimensaoTransversal: number; // a ou b conforme direção
  N: number; // Nsd ou Nk_superior conforme o caso
  MRd?: number; // Momento resistente da envoltória (opcional)
}): { M2d: number; kappa: number; convergiu: boolean } {
  const { lambda, fa, alfa_b, MA, dimensaoTransversal, N, MRd } = params;
  
  // Se não há compressão, não há M2d
  if (N <= 0) {
    return { M2d: 0, kappa: 0, convergiu: true };
  }
  
  // Se não há momentos, não há M2d
  if (MA === 0) {
    return { M2d: 0, kappa: 0, convergiu: true };
  }
  
  const base = (dimensaoTransversal * N) / 100;
  if (!Number.isFinite(base) || Math.abs(base) < 1e-12) {
    return { M2d: 0, kappa: 0, convergiu: false };
  }
  
  // Se MRd foi fornecido, calcular diretamente sem iteração
  if (MRd !== undefined && MRd > 0) {
    // κaprox = 32 × (1 + 5 × MRd,tot / (h × Nd)) × v
    const kappa = 32 * fa * (1 + 5 * (MRd / base));
    
    const denom = 1 - (lambda * lambda * fa) / (120 * kappa);
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) {
      return { M2d: 0, kappa: 0, convergiu: false };
    }
    
    const M2d = (alfa_b * MA) / denom;
    
    console.log(`✓ M2d calculado DIRETO com MRd=${MRd.toFixed(2)}: kappa=${kappa.toFixed(3)}, M2d=${M2d.toFixed(3)}`);
    
    return { M2d, kappa, convergiu: true };
  }
  
  // Caso contrário, usar processo iterativo (fallback)
  console.log(`⟲ Usando processo ITERATIVO (MRd não fornecido)`);
  
  let kappa = (2 * lambda * lambda * fa) / 120; // primeira aproximação
  let M2d = 0;
  
  const tol = 0.001; // 0.1% conforme especificação
  const maxIter = 9999;
  
  for (let i = 0; i < maxIter; i++) {
    const denom = 1 - (lambda * lambda * fa) / (120 * kappa);
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) {
      return { M2d: 0, kappa: 0, convergiu: false };
    }
    const M_iter = (alfa_b * MA) / denom;
    const kappa_next = 32 * fa * (1 + 5 * (M_iter / base));
    const kappa_mix = (kappa + kappa_next) / 2;
    
    // Critério de convergência baseado em M2d: abs(M2d,k+1 - M2d,k)/abs(M2d,k) < 0.1%
    const err = Math.abs(M_iter - M2d) / Math.max(1e-12, Math.abs(M2d));
    kappa = kappa_mix;
    M2d = M_iter;
    
    if (err <= tol) {
      console.log(`✓ Convergiu em ${i+1} iterações: kappa=${kappa.toFixed(3)}, M2d=${M2d.toFixed(3)}`);
      return { M2d, kappa, convergiu: true };
    }
  }
  
  return { M2d, kappa, convergiu: false };
}

// Função para calcular M2d por segmento usando a formulação unificada
export function calcularM2dPorSegmento(params: {
  segmentoComprimento: number;
  Nk_superior: number;
  Mbase: number;
  Mtop: number;
  lamda_segmento: number;
  fa: number;
  alfa_b_segmento: number;
  dimensaoTransversal: number; // a ou b conforme direção
  Nsd: number;
  MRd?: number; // Momento resistente da envoltória (opcional)
}): { M2d: number; kappa: number; convergiu: boolean } {
  const { Nk_superior, Mbase, Mtop, lamda_segmento, fa, dimensaoTransversal, MRd } = params;
  
  // Momento MA e MB para o segmento
  const MA_seg = Math.max(Math.abs(Mbase), Math.abs(Mtop));
  const MB_seg_min = Math.min(Math.abs(Mbase), Math.abs(Mtop));
  const MB_seg = Mbase * Mtop >= 0 ? MB_seg_min : -MB_seg_min;
  
  // Parâmetro alfa_b para o segmento
  const alfa_b_calc = Math.max(0.4, Math.min(1.0, 0.6 + 0.4 * (MB_seg / MA_seg)));
  
  const resultado = calcularM2d({
    lambda: lamda_segmento,
    fa,
    alfa_b: alfa_b_calc,
    MA: MA_seg,
    dimensaoTransversal,
    N: Nk_superior,
    MRd // Passa MRd se fornecido
  });
  
  console.log(`[Segmento] M2d = ${resultado.M2d.toFixed(3)}, kappa = ${resultado.kappa.toFixed(3)}, convergiu = ${resultado.convergiu}`);
  
  return resultado;
}

// Função para dividir o pilar em segmentos baseado nos travamentos
export function dividirPilarEmSegmentos(
  alturaPilar: number, 
  travamentos: Travamento[],
  direcao?: 'x' | 'y'
): SegmentoPilar[] {
  // Filtrar travamentos por direção se especificada
  const travamentosFiltrados = direcao 
    ? travamentos.filter(t => t.direcao === direcao)
    : travamentos;
    
  // Criar lista de coordenadas únicas (base, topo e travamentos)
  const coordenadas = new Set<number>();
  coordenadas.add(0); // base do pilar
  coordenadas.add(alturaPilar); // topo do pilar
  
  // Adicionar coordenadas dos travamentos filtrados
  travamentosFiltrados.forEach(t => {
    if (t.coordenada >= 0 && t.coordenada <= alturaPilar) {
      coordenadas.add(t.coordenada);
    }
  });
  
  // Converter para array ordenado
  const coordenadasOrdenadas = Array.from(coordenadas).sort((a, b) => a - b);
  
  // Criar segmentos
  const segmentos: SegmentoPilar[] = [];
  
  for (let i = 0; i < coordenadasOrdenadas.length - 1; i++) {
    const inicio = coordenadasOrdenadas[i];
    const fim = coordenadasOrdenadas[i + 1];
    const comprimento = fim - inicio;
    
    // Verificar se há travamentos nas extremidades
    const travamentosXInicio = travamentos.some(t => 
      t.coordenada === inicio && t.direcao === 'x'
    ) || inicio === 0 || inicio === alturaPilar; // base e topo sempre travados
    
    const travamentosXFim = travamentos.some(t => 
      t.coordenada === fim && t.direcao === 'x'
    ) || fim === 0 || fim === alturaPilar;
    
    const travamentosYInicio = travamentos.some(t => 
      t.coordenada === inicio && t.direcao === 'y'
    ) || inicio === 0 || inicio === alturaPilar;
    
    const travamentosYFim = travamentos.some(t => 
      t.coordenada === fim && t.direcao === 'y'
    ) || fim === 0 || fim === alturaPilar;
    
    segmentos.push({
      inicio,
      fim,
      comprimento,
      travamentosX: travamentosXInicio && travamentosXFim,
      travamentosY: travamentosYInicio && travamentosYFim,
    });
  }
  
  return segmentos;
}

// Função para calcular o maior comprimento de flambagem
export function calcularComprimentoFlambagem(
  alturaPilar: number,
  travamentos: Travamento[],
  direcao: 'x' | 'y'
): number {
  const segmentos = dividirPilarEmSegmentos(alturaPilar, travamentos);
  
  // Encontrar o maior segmento não travado na direção especificada
  let maiorComprimento = 0;
  
  for (const segmento of segmentos) {
    const ehTravado = direcao === 'x' ? segmento.travamentosX : segmento.travamentosY;
    
    if (!ehTravado) {
      // Se não há travamento nas duas extremidades, usar comprimento total do pilar
      maiorComprimento = Math.max(maiorComprimento, alturaPilar);
    } else {
      // Se há travamento, usar o comprimento do segmento
      maiorComprimento = Math.max(maiorComprimento, segmento.comprimento);
    }
  }
  
  // Se não há travamentos intermediários, usar altura total
  const travamentosNaDirecao = travamentos.filter(t => t.direcao === direcao);
  if (travamentosNaDirecao.length === 0) {
    return alturaPilar;
  }
  
  return maiorComprimento;
}

// Iterador κ e Msd_tot em torno de x
export type _KappaIterParams_x = {
  lamda_x: number;
  fa: number;
  alfa_bx: number;
  MAx: number;
  b: number;
  Nsd: number;
  MRdX?: number; // Momento resistente da envoltória em X
};
export type _KappaIterOpts = { tol?: number; maxIter?: number; relax?: number };

export function resolverKappaMsd_x(p: _KappaIterParams_x, _opts: _KappaIterOpts = {}) {
  const resultado = calcularM2d({
    lambda: p.lamda_x,
    fa: p.fa,
    alfa_b: p.alfa_bx,
    MA: p.MAx,
    dimensaoTransversal: p.b,
    N: p.Nsd,
    MRd: p.MRdX // Passa MRdX
  });

  console.log(`[Global X] M2d = ${resultado.M2d.toFixed(3)}, kappa = ${resultado.kappa.toFixed(3)}, convergiu = ${resultado.convergiu}`);

  if (!resultado.convergiu) {
    return { 
      kappax: Number.NaN, 
      Msdx_tot: Number.NaN, 
      iterations: 0, 
      convergiu: false, 
      erro: "Não convergiu no cálculo de M2d" 
    };
  }

  return { 
    kappax: resultado.kappa, 
    Msdx_tot: resultado.M2d, 
    iterations: 1, 
    convergiu: true, 
    erro: null 
  };
}

// Iterador κ e Msd_tot em torno de y
export type _KappaIterParams_y = {
  lamda_y: number;
  fa: number;
  alfa_by: number;
  MAy: number;
  a: number;
  Nsd: number;
  MRdY?: number; // Momento resistente da envoltória em Y
};

export function resolverKappaMsd_y(p: _KappaIterParams_y, _opts: _KappaIterOpts = {}) {
  const resultado = calcularM2d({
    lambda: p.lamda_y,
    fa: p.fa,
    alfa_b: p.alfa_by,
    MA: p.MAy,
    dimensaoTransversal: p.a,
    N: p.Nsd,
    MRd: p.MRdY // Passa MRdY
  });

  console.log(`[Global Y] M2d = ${resultado.M2d.toFixed(3)}, kappa = ${resultado.kappa.toFixed(3)}, convergiu = ${resultado.convergiu}`);

  if (!resultado.convergiu) {
    return { 
      kappay: Number.NaN, 
      Msdy_tot: Number.NaN, 
      iterations: 0, 
      convergiu: false, 
      erro: "Não convergiu no cálculo de M2d" 
    };
  }

  return { 
    kappay: resultado.kappa, 
    Msdy_tot: resultado.M2d, 
    iterations: 1, 
    convergiu: true, 
    erro: null 
  };
}

/**
 * Calcula o coeficiente de segurança para um par de momentos (Msd_x, Msd_y)
 * em relação a uma envoltória resistente ou elipse de momento mínimo
 */
export function calcularCoeficienteSeguranca(params: {
  Msd_x: number;
  Msd_y: number;
  envoltoriaResistente?: Array<{MRdX: number, MRdY: number}>;
  M_min_xx?: number;
  M_min_yy?: number;
}): number {
  const { Msd_x, Msd_y, envoltoriaResistente, M_min_xx, M_min_yy } = params;
  
  // Distância do ponto solicitante à origem
  const d_solicitante = Math.sqrt(Msd_x * Msd_x + Msd_y * Msd_y);
  
  // Se não há solicitação, retornar infinito (totalmente seguro)
  if (d_solicitante < 1e-6) {
    return Infinity;
  }
  
  // Tentar usar envoltória resistente primeiro
  if (envoltoriaResistente && envoltoriaResistente.length > 0) {
    // Ângulo do vetor de solicitação
    // Note: MRdX está no eixo Y do gráfico, MRdY está no eixo X
    const theta = Math.atan2(Msd_x, Msd_y);
    
    // Encontrar o ponto na envoltória mais próximo dessa direção
    let melhorPonto = envoltoriaResistente[0];
    let menorDiferencaAngulo = Infinity;
    
    for (const ponto of envoltoriaResistente) {
      const anguloPonto = Math.atan2(ponto.MRdX, ponto.MRdY);
      const diff = Math.abs(anguloPonto - theta);
      const diffNormalizada = Math.min(diff, 2 * Math.PI - diff);
      
      if (diffNormalizada < menorDiferencaAngulo) {
        menorDiferencaAngulo = diffNormalizada;
        melhorPonto = ponto;
      }
    }
    
    // Interpolar entre pontos vizinhos para maior precisão
    const idx = envoltoriaResistente.indexOf(melhorPonto);
    const prevIdx = (idx - 1 + envoltoriaResistente.length) % envoltoriaResistente.length;
    const nextIdx = (idx + 1) % envoltoriaResistente.length;
    
    const prev = envoltoriaResistente[prevIdx];
    const next = envoltoriaResistente[nextIdx];
    
    const anguloPrev = Math.atan2(prev.MRdX, prev.MRdY);
    const anguloAtual = Math.atan2(melhorPonto.MRdX, melhorPonto.MRdY);
    const anguloNext = Math.atan2(next.MRdX, next.MRdY);
    
    let MRd_x, MRd_y;
    
    if (Math.abs(theta - anguloAtual) < 0.01) {
      // Muito próximo do ponto, usar direto
      MRd_x = melhorPonto.MRdX;
      MRd_y = melhorPonto.MRdY;
    } else if (theta > anguloAtual && theta < anguloNext) {
      // Interpolar entre atual e próximo
      const t = (theta - anguloAtual) / (anguloNext - anguloAtual);
      MRd_x = melhorPonto.MRdX + t * (next.MRdX - melhorPonto.MRdX);
      MRd_y = melhorPonto.MRdY + t * (next.MRdY - melhorPonto.MRdY);
    } else {
      // Interpolar entre anterior e atual
      const t = (theta - anguloPrev) / (anguloAtual - anguloPrev);
      MRd_x = prev.MRdX + t * (melhorPonto.MRdX - prev.MRdX);
      MRd_y = prev.MRdY + t * (melhorPonto.MRdY - prev.MRdY);
    }
    
    const d_resistente = Math.sqrt(MRd_x * MRd_x + MRd_y * MRd_y);
    return d_resistente / d_solicitante;
  }
  
  // Usar elipse de momento mínimo como fallback
  if (M_min_xx && M_min_yy && M_min_xx > 0 && M_min_yy > 0) {
    const razao = Math.pow(Msd_x / M_min_xx, 2) + Math.pow(Msd_y / M_min_yy, 2);
    
    if (razao < 1e-6) {
      return Infinity;
    }
    
    return 1 / Math.sqrt(razao);
  }
  
  // Se não tem nenhuma envoltória, retornar NaN
  return NaN;
}
