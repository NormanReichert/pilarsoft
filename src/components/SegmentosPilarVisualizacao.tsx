import {  calcularComprimentoFlambagem, dividirPilarEmSegmentos, type Travamento } from "../compute";
import { THEME } from "../config/theme";

function SegmentosPilarVisualizacao({
  alturaPilar,
  travamentos,
}: {
  alturaPilar: number;
  travamentos: Travamento[];
}) {
  const segmentos = dividirPilarEmSegmentos(alturaPilar, travamentos);
  const comprimentoFlambagemX = calcularComprimentoFlambagem(alturaPilar, travamentos, 'x');
  const comprimentoFlambagemY = calcularComprimentoFlambagem(alturaPilar, travamentos, 'y');

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

      {/* Informações de comprimento de flambagem */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 12,
        fontSize: 12
      }}>
        <div>
          <span style={{ color: THEME.subtle }}>Comprimento de flambagem X: </span>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            {comprimentoFlambagemX.toFixed(1)} cm
          </span>
        </div>
        <div>
          <span style={{ color: THEME.subtle }}>Comprimento de flambagem Y: </span>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            {comprimentoFlambagemY.toFixed(1)} cm
          </span>
        </div>
      </div>

      {/* Lista de segmentos */}
      <div style={{ fontSize: 12 }}>
        <div style={{
          fontWeight: 600,
          marginBottom: 6,
          color: THEME.pageText
        }}>
          Segmentos do pilar:
        </div>
        {segmentos.map((segmento, index) => (
          <div key={index} style={{
            padding: '4px 8px',
            marginBottom: 2,
            background: '#1e293b',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {segmento.inicio.toFixed(1)} → {segmento.fim.toFixed(1)} cm
              ({segmento.comprimento.toFixed(1)} cm)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                color: segmento.travamentosX ? '#2563eb' : THEME.subtle,
                fontSize: 11
              }}>
                X: {segmento.travamentosX ? '✓' : '✗'}
              </span>
              <span style={{
                color: segmento.travamentosY ? '#dc2626' : THEME.subtle,
                fontSize: 11
              }}>
                Y: {segmento.travamentosY ? '✓' : '✗'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default SegmentosPilarVisualizacao;