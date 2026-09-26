import { BoardLayout } from '../types';
import { CATALOG_50_LAYOUTS, WORLDS, WorldGroup } from './catalog50';

export { WORLDS, type WorldGroup };

/**
 * ═══════════════════════════════════════════════════════════════
 *  CATÁLOGO OFICIAL DE PROGRESSÃO — 50 NÍVEIS
 *  5 Mundos temáticos:
 *   - Mundo 1: Jardim do Aprendiz (Fases 1 a 10)
 *   - Mundo 2: Vale das Criaturas (Fases 11 a 20)
 *   - Mundo 3: Labirintos & Santuários (Fases 21 a 30)
 *   - Mundo 4: Grandes Estruturas (Fases 31 a 40)
 *   - Mundo 5: Templo dos Mestres (Fases 41 a 50)
 * ═══════════════════════════════════════════════════════════════
 */
export const ALL_LAYOUTS: BoardLayout[] = CATALOG_50_LAYOUTS;

export function getLayoutById(id: string): BoardLayout {
  const found = ALL_LAYOUTS.find((l) => l.id === id);
  return found ?? ALL_LAYOUTS[0];
}

