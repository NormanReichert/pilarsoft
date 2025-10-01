import { dividirPilarEmSegmentos, type Travamento } from "../compute";
import { THEME } from "../config/theme";

function SegmentosPilarVisualizacao({
  alturaPilar,
  travamentos,
  a, // largura da seção
  b, // altura da seção
}: {
  alturaPilar: number;
  travamentos: Travamento[];
  a: number;
  b: number;
}) {
  const segmentosX = dividirPilarEmSegmentos(alturaPilar, travamentos, 'x');
  const segmentosY = dividirPilarEmSegmentos(alturaPilar, travamentos, 'y');

  // Função para calcular lambda do segmento
  const calcularLambdaSegmento = (comprimento: number, direcao: 'x' | 'y') => {
    const As = a * b;
    if (direcao === 'x') {
      const Ix = (a * Math.pow(b, 3)) / 12;
      const ix = Math.sqrt(Ix / As);
      return comprimento / ix;
    } else {
      const Iy = (b * Math.pow(a, 3)) / 12;
      const iy = Math.sqrt(Iy / As);
      return comprimento / iy;
    }
  };

  return (
    <div style={{
      marginTop: 16,
      padding: 12,
      background: '#0f172a',
      borderRadius: 8,
      border: `1px solid ${THEME.border}`
    }}>
      <h4 style={{
        fontSize: 14,
        fontWeight: 600,
        margin: '0 0 12px',
        color: THEME.pageText
      }}>
        Análise de Segmentos
      </h4>

      {/* Segmentos direção X */}
      <div style={{ fontSize: 12, marginBottom: 16 }}>
        <div style={{
          fontWeight: 600,
          marginBottom: 6,
          color: '#2563eb'
        }}>
          Segmentos - Direção X:
        </div>
        {segmentosX.map((segmento, index) => {
          const lambda = calcularLambdaSegmento(segmento.comprimento, 'x');
          const isLambdaExcessivo = lambda > 90;
          
          return (
            <div key={`x-${index}`} style={{
              padding: '6px 8px',
              marginBottom: 2,
              background: isLambdaExcessivo ? '#7f1d1d' : '#1e293b',
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: isLambdaExcessivo ? '1px solid #dc2626' : 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>
                  {segmento.inicio.toFixed(1)} → {segmento.fim.toFixed(1)} cm
                  ({segmento.comprimento.toFixed(1)} cm)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ 
                    fontSize: 10, 
                    color: isLambdaExcessivo ? '#fca5a5' : THEME.subtle,
                    fontWeight: isLambdaExcessivo ? 600 : 'normal'
                  }}>
                    λ = {lambda.toFixed(1)}
                  </span>
                  {isLambdaExcessivo && (
                    <span style={{
                      fontSize: 9,
                      color: '#fca5a5',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      ⚠️ MÉTODO NÃO APLICÁVEL
                    </span>
                  )}
                </div>
              </div>
              <span style={{
                color: segmento.travamentosX ? '#2563eb' : THEME.subtle,
                fontSize: 11,
                fontWeight: 600
              }}>
                {segmento.travamentosX ? 'Travado' : 'Livre'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Segmentos direção Y */}
      <div style={{ fontSize: 12 }}>
        <div style={{
          fontWeight: 600,
          marginBottom: 6,
          color: '#dc2626'
        }}>
          Segmentos - Direção Y:
        </div>
        {segmentosY.map((segmento, index) => {
          const lambda = calcularLambdaSegmento(segmento.comprimento, 'y');
          const isLambdaExcessivo = lambda > 90;
          
          return (
            <div key={`y-${index}`} style={{
              padding: '6px 8px',
              marginBottom: 2,
              background: isLambdaExcessivo ? '#7f1d1d' : '#1e293b',
              borderRadius: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: isLambdaExcessivo ? '1px solid #dc2626' : 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>
                  {segmento.inicio.toFixed(1)} → {segmento.fim.toFixed(1)} cm
                  ({segmento.comprimento.toFixed(1)} cm)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ 
                    fontSize: 10, 
                    color: isLambdaExcessivo ? '#fca5a5' : THEME.subtle,
                    fontWeight: isLambdaExcessivo ? 600 : 'normal'
                  }}>
                    λ = {lambda.toFixed(1)}
                  </span>
                  {isLambdaExcessivo && (
                    <span style={{
                      fontSize: 9,
                      color: '#fca5a5',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      ⚠️ MÉTODO NÃO APLICÁVEL
                    </span>
                  )}
                </div>
              </div>
              <span style={{
                color: segmento.travamentosY ? '#dc2626' : THEME.subtle,
                fontSize: 11,
                fontWeight: 600
              }}>
                {segmento.travamentosY ? 'Travado' : 'Livre'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default SegmentosPilarVisualizacao;