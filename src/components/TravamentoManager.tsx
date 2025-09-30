import type { Travamento } from "../compute";
import { THEME } from "../config/theme";
import SegmentosPilarVisualizacao from "./SegmentosPilarVisualizacao";
import TravamentoInput from "./TravamentoInput";

function TravamentosManager({
  travamentos,
  onTravamentosChange,
  alturaTotal,
}: {
  travamentos: Travamento[];
  onTravamentosChange: (travamentos: Travamento[]) => void;
  alturaTotal: number;
}) {
  const adicionarTravamento = (direcao: 'x' | 'y') => {
    const novoTravamento: Travamento = {
      id: `trav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coordenada: alturaTotal / 2, // posição padrão no meio
      compressao: 0, // valor padrão
      momentoSuperior: 0, // valor padrão
      momentoInferior: 0, // valor padrão
      direcao,
    };
    onTravamentosChange([...travamentos, novoTravamento]);
  };

  const removerTravamento = (id: string) => {
    onTravamentosChange(travamentos.filter(t => t.id !== id));
  };

  const atualizarTravamento = (id: string, campo: keyof Travamento, valor: any) => {
    onTravamentosChange(
      travamentos.map(t => {
        if (t.id === id) {
          if (campo === 'coordenada') {
            return { ...t, [campo]: Math.max(0, Math.min(alturaTotal, Number(valor))) };
          }
          return { ...t, [campo]: valor };
        }
        return t;
      })
    );
  };

  const travamentosX = travamentos.filter(t => t.direcao === 'x');
  const travamentosY = travamentos.filter(t => t.direcao === 'y');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Botões para adicionar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => adicionarTravamento('x')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Travamento X
        </button>
        <button
          onClick={() => adicionarTravamento('y')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Travamento Y
        </button>
      </div>

      {/* Lista de travamentos */}
      {(travamentosX.length > 0 || travamentosY.length > 0) && (
        <div style={{ display: 'flex', gap: 40 }}>
          {/* Travamentos X */}
          {travamentosX.length > 0 && (
            <div>
              <h4 style={{
                fontSize: 14,
                fontWeight: 600,
                margin: '0 0 8px',
                color: '#2563eb'
              }}>
                Direção X
              </h4>
              {travamentosX.map(travamento => (
                <div key={travamento.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  padding: '8px',
                  background: '#1e293b',
                  borderRadius: 6,
                }}>
                  <TravamentoInput
                    label="Coordenada (cm)"
                    value={travamento.coordenada}
                    onChange={(value) => atualizarTravamento(travamento.id, 'coordenada', value)}
                    min={0}
                    max={alturaTotal}
                    step={1}
                  />
                  <TravamentoInput
                    label="Compressão (kN)"
                    value={travamento.compressao}
                    onChange={(value) => atualizarTravamento(travamento.id, 'compressao', value)}
                    step={0.1}
                  />
                  <TravamentoInput
                    label="Momento Superior (kN·m)"
                    value={travamento.momentoSuperior}
                    onChange={(value) => atualizarTravamento(travamento.id, 'momentoSuperior', value)}
                    step={0.1}
                  />
                  <TravamentoInput
                    label="Momento Inferior (kN·m)"
                    value={travamento.momentoInferior}
                    onChange={(value) => atualizarTravamento(travamento.id, 'momentoInferior', value)}
                    step={0.1}
                  />
                  <button
                    onClick={() => removerTravamento(travamento.id)}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'end',
                      lineHeight: 1,
                      fontWeight: 'bold',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Travamentos Y */}
          {travamentosY.length > 0 && (
            <div>
              <h4 style={{
                fontSize: 14,
                fontWeight: 600,
                margin: '0 0 8px',
                color: '#dc2626'
              }}>
                Direção Y
              </h4>
              {travamentosY.map(travamento => (
                <div key={travamento.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  padding: '8px',
                  background: '#1e293b',
                  borderRadius: 6,
                }}>
                  <TravamentoInput
                    label="Coordenada (cm)"
                    value={travamento.coordenada}
                    onChange={(value) => atualizarTravamento(travamento.id, 'coordenada', value)}
                    min={0}
                    max={alturaTotal}
                    step={1}
                  />
                  <TravamentoInput
                    label="Compressão (kN)"
                    value={travamento.compressao}
                    onChange={(value) => atualizarTravamento(travamento.id, 'compressao', value)}
                    step={0.1}
                  />
                  <TravamentoInput
                    label="Momento Superior (kN·m)"
                    value={travamento.momentoSuperior}
                    onChange={(value) => atualizarTravamento(travamento.id, 'momentoSuperior', value)}
                    step={0.1}
                  />
                  <TravamentoInput
                    label="Momento Inferior (kN·m)"
                    value={travamento.momentoInferior}
                    onChange={(value) => atualizarTravamento(travamento.id, 'momentoInferior', value)}
                    step={0.1}
                  />
                  <button
                    onClick={() => removerTravamento(travamento.id)}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'end',
                      lineHeight: 1,
                      fontWeight: 'bold',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informação útil */}
      {travamentos.length === 0 && (
        <div style={{
          fontSize: 12,
          color: THEME.subtle,
          fontStyle: 'italic'
        }}>
          Use os botões acima para adicionar travamentos nas direções X ou Y
        </div>
      )}

      {/* Visualização dos segmentos */}
      {travamentos.length > 0 && (
        <SegmentosPilarVisualizacao
          alturaPilar={alturaTotal}
          travamentos={travamentos}
        />
      )}
    </div>
  );
}
export default TravamentosManager;