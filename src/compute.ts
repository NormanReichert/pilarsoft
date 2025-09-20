// compute.ts - gerado a partir de PP-kappa.txt
export type Travamento = {
  id: string;
  coordenada: number; // coordenada da base até o travamento (cm)
  compressao: number; // compressão no travamento (kN)
  momento: number; // momento aplicado no travamento (kN·m)
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
  const alfa_bx = MAx !== 0 ? 0.6 + 0.4 * (MBx / MAx) : 1.0;
  const alfa_by = MAy !== 0 ? 0.6 + 0.4 * (MBy / MAy) : 1.0;

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

  return { fcd, fyd, Nsd, Msd_tx, Msd_bx, Msd_ty, Msd_by, Ix, As, ix, lamda_x, lamda_y, MAx, MBx, MAy, MBy, alfa_bx, alfa_by, ex, erx, lamda1_x, lamda1_y, fa, M1dminxx, M1dminyy };
}

// Valores padrão
export const defaultInputs: Inputs = {
  a: 20, b: 20, h: 500,
  gama_c: 1.4, gama_s: 1.15, gama_f: 1.4,
  fck: 30, fyk: 500,
  Nsk: 500,
  Msk_tx: -20, Msk_bx: 30,
  Msk_ty: -20, Msk_by: 30,
  travamentos: [],
};

// Função para dividir o pilar em segmentos baseado nos travamentos
export function dividirPilarEmSegmentos(
  alturaPilar: number, 
  travamentos: Travamento[]
): SegmentoPilar[] {
  // Criar lista de coordenadas únicas (base, topo e travamentos)
  const coordenadas = new Set<number>();
  coordenadas.add(0); // base do pilar
  coordenadas.add(alturaPilar); // topo do pilar
  
  // Adicionar coordenadas dos travamentos
  travamentos.forEach(t => {
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
};
export type _KappaIterOpts = { tol?: number; maxIter?: number; relax?: number };

export function resolverKappaMsd_x(p: _KappaIterParams_x, opts: _KappaIterOpts = {}) {
  const tol = opts.tol ?? 1e-6;
  const maxIter = opts.maxIter ?? 200;
  const relax = opts.relax ?? 0.6;

  const base = (p.b * p.Nsd) / 100;
  if (!Number.isFinite(base) || Math.abs(base) < 1e-12) {
    return { kappax: Number.NaN, Msdx_tot: Number.NaN, iterations: 0, convergiu: false, erro: "b*Nsd/100 inválido" };
  }

  let kappax = (2 * p.lamda_x * p.lamda_x * p.fa) / 120; // primeira aproximação
  let Msdx_tot = Number.NaN;

  for (let i = 0; i < maxIter; i++) {
    const denom = 1 - (p.lamda_x * p.lamda_x * p.fa) / (120 * kappax);
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) {
      return { kappax: Number.NaN, Msdx_tot: Number.NaN, iterations: i + 1, convergiu: false, erro: "Denominador ~ 0 em Msdx_tot" };
    }
    const Mx = (p.alfa_bx * p.MAx) / denom;

    const kappax_next = 32 * p.fa * (1 + 5 * (Mx / base));
    const kappax_mix = kappax + relax * (kappax_next - kappax);

    const err = Math.abs(kappax_mix - kappax) / Math.max(1, Math.abs(kappax));
    kappax = kappax_mix;
    Msdx_tot = Mx;

    if (err <= tol) {
      // arredonda só para exibir na UI
      const arred2 = (v: number) => Math.round(v * 100) / 100;
      return { kappax: arred2(kappax), Msdx_tot: arred2(Msdx_tot), iterations: i + 1, convergiu: true, erro: null };
    }
  }

  const arred2 = (v: number) => Math.round(v * 100) / 100;
  return { kappax: arred2(kappax), Msdx_tot: arred2(Msdx_tot), iterations: maxIter, convergiu: false, erro: "Não convergiu no máximo de iterações" };
}

// Iterador κ e Msd_tot em torno de y
export type _KappaIterParams_y = {
  lamda_y: number;
  fa: number;
  alfa_by: number;
  MAy: number;
  a: number;
  Nsd: number;
};

export function resolverKappaMsd_y(p: _KappaIterParams_y, opts: _KappaIterOpts = {}) {
  const tol = opts.tol ?? 1e-6;
  const maxIter = opts.maxIter ?? 200;
  const relax = opts.relax ?? 0.6;

  const base = (p.a * p.Nsd) / 100;
  if (!Number.isFinite(base) || Math.abs(base) < 1e-12) {
    return { kappay: Number.NaN, Msdy_tot: Number.NaN, iterations: 0, convergiu: false, erro: "a*Nsd/100 inválido" };
  }

  let kappay = (2 * p.lamda_y * p.lamda_y * p.fa) / 120; // primeira aproximação
  let Msdy_tot = Number.NaN;

  for (let i = 0; i < maxIter; i++) {
    const denom = 1 - (p.lamda_y * p.lamda_y * p.fa) / (120 * kappay);
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) {
      return { kappay: Number.NaN, Msdy_tot: Number.NaN, iterations: i + 1, convergiu: false, erro: "Denominador ~ 0 em Msdy_tot" };
    }
    const My = (p.alfa_by * p.MAy) / denom;

    const kappay_next = 32 * p.fa * (1 + 5 * (My / base));
    const kappay_mix = kappay + relax * (kappay_next - kappay);

    const err = Math.abs(kappay_mix - kappay) / Math.max(1, Math.abs(kappay));
    kappay = kappay_mix;
    Msdy_tot = My;

    if (err <= tol) {
      // arredonda só para exibir na UI
      const arred2 = (v: number) => Math.round(v * 100) / 100;
      return { kappay: arred2(kappay), Msdy_tot: arred2(Msdy_tot), iterations: i + 1, convergiu: true, erro: null };
    }
  }

  const arred2 = (v: number) => Math.round(v * 100) / 100;
  return { kappay: arred2(kappay), Msdy_tot: arred2(Msdy_tot), iterations: maxIter, convergiu: false, erro: "Não convergiu no máximo de iterações" };
}
