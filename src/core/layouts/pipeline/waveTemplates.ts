import { LayoutSlot } from '../../types';

// =========================================================================
// BIBLIOTECA DE TEMPLATES VERTICAIS DA ESTEIRA (6 COLUNAS x 8 LINHAS)
// =========================================================================
// Todas as coordenadas respeitam a grade mobile:
// x: [0, 2, 4, 6, 8, 10] (6 colunas = peças de 55-58px em 360px de largura)
// y: [0, 2, 4, 6, 8, 10, 12, 14] (8 linhas = ocupação vertical de 93-98%)
// Z: 100% apoiado fisicamente (0 peças no ar)

/**
 * Template: Santuário / Portal dos Guardiões (44 peças, Z=0..2)
 * Utilizado pelos níveis verticais totem/santuário
 */
export function createShrine44(): LayoutSlot[] {
  const s: LayoutSlot[] = [];
  // Z=0 (28)
  [2, 4, 6, 8].forEach((x) =>
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((y) => {
      if ((x === 4 || x === 6) && (y === 6 || y === 8)) return;
      s.push({ x, y, z: 0 });
    })
  );
  // Z=1 (12)
  [2, 8].forEach((x) =>
    [2, 4, 6, 8, 10, 12].forEach((y) => s.push({ x, y, z: 1 }))
  );
  // Z=2 (4)
  [2, 8].forEach((x) =>
    [4, 10].forEach((y) => s.push({ x, y, z: 2 }))
  );
  return s;
}
