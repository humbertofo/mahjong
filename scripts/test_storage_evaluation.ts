import { StorageManager } from '../src/storage/StorageManager';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TERCEIRA RODADA DE AVALIAÇÃO — STORAGE & PERSISTÊNCIA ZEN');
console.log('═══════════════════════════════════════════════════════════════\n');

// Mock localStorage para Node.js
const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => memoryStore[key] || null,
  setItem: (key: string, val: string) => { memoryStore[key] = val; },
  removeItem: (key: string) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
  get length() { return Object.keys(memoryStore).length; },
  key: (i: number) => Object.keys(memoryStore)[i] || null,
};

(globalThis as any).localStorage = mockLocalStorage;

// 1. TESTE DE PREFERÊNCIAS PADRÃO
console.log('🔹 Teste 1: Preferências padrão do usuário');
const prefs = StorageManager.getPreferences();
if (!prefs.theme || prefs.soundEnabled !== true || prefs.showHelperNumbers !== true) {
  throw new Error('Falha ao carregar preferências padrão');
}
console.log('  ✅ [PASS] Preferências padrão carregadas com sucesso (Tema, Sons, Acessibilidade).');

// 2. TESTE DE PERSISTÊNCIA DE PREFERÊNCIAS
console.log('\n🔹 Teste 2: Salvar e restaurar preferências');
prefs.theme = 'zen-dark';
prefs.musicVolume = 0.5;
StorageManager.savePreferences(prefs);
const reloadedPrefs = StorageManager.getPreferences();
if (reloadedPrefs.theme !== 'zen-dark' || reloadedPrefs.musicVolume !== 0.5) {
  throw new Error('Preferências salvas não coincidem com as recuperadas');
}
console.log('  ✅ [PASS] Preferências persistidas e restauradas com integridade total.');

// 3. TESTE DE RECORDES E CRITÉRIOS DE ESTRELAS ZEN
console.log('\n🔹 Teste 3: Registro de vitória e regras zen de estrelas (1★, 2★, 3★)');
// Vitória básica: 1★ (completou mas sem ferramentas e sem sinergia)
const stat1 = StorageManager.recordVictory('layout_01', 120, 0, 0, 500);
if (stat1.stars !== 1 || !stat1.completed) {
  throw new Error(`Esperado 1 estrela, obtido: ${stat1.stars}`);
}
console.log('  ✅ [PASS] Cenário 1★ (Conclusão básica sem ferramentas/sinergia) concedido.');

// Vitória média: 2★ (poupou ferramentas OU ativou sinergia)
const stat2 = StorageManager.recordVictory('layout_01', 100, 2, 0, 800);
if (stat2.stars !== 2) {
  throw new Error(`Esperado 2 estrelas, obtido: ${stat2.stars}`);
}
console.log('  ✅ [PASS] Cenário 2★ (Poupou ferramentas ou ativou sinergias) concedido.');

// Vitória máxima zen: 3★ (poupou ferramentas E ativou sinergias)
const stat3 = StorageManager.recordVictory('layout_01', 90, 2, 3, 1500);
if (stat3.stars !== 3) {
  throw new Error(`Esperado 3 estrelas, obtido: ${stat3.stars}`);
}
console.log('  ✅ [PASS] Cenário 3★ Zen Máximo (Poupou ferramentas E ativou sinergias) concedido.');

// 4. TESTE DE DESBLOQUEIO E PROGRESSÃO DE FASES
console.log('\n🔹 Teste 4: Desbloqueio progressivo de fases (Fase 1 a 50)');
if (!StorageManager.isLevelUnlocked(0)) {
  throw new Error('Fase 1 (índice 0) deveria estar sempre desbloqueada');
}
if (StorageManager.isLevelUnlocked(1)) {
  throw new Error('Fase 2 não deveria estar desbloqueada inicialmente');
}
StorageManager.unlockLevel(1);
if (!StorageManager.isLevelUnlocked(1)) {
  throw new Error('Fase 2 deveria estar desbloqueada após unlockLevel');
}
// Desbloquear fase avançada
StorageManager.unlockLevel(49); // Nível 50
if (!StorageManager.isLevelUnlocked(49)) {
  throw new Error('Fase 50 deveria estar desbloqueada');
}
const progress = StorageManager.getProgress();
if (!progress.unlockedLevels.includes(49) || progress.currentLevelIndex !== 49) {
  throw new Error('Estado de progresso corrompido');
}
console.log('  ✅ [PASS] Desbloqueio de fases verificado com sucesso até a Fase 50.');

// 5. TESTE DE ESTATÍSTICAS GLOBAIS E STREAK
console.log('\n🔹 Teste 5: Estatísticas globais e sequência diária');
StorageManager.incrementGamesPlayed();
StorageManager.incrementGamesWon(90, 36, 1, 4);
const globalStats = StorageManager.getGlobalStats();
if (globalStats.totalGamesPlayed < 1 || globalStats.totalGamesWon < 1 || (globalStats.totalSynergiesTriggered || 0) < 4) {
  throw new Error('Estatísticas globais não incrementaram corretamente');
}
console.log(`  ✅ [PASS] Estatísticas globais: ${globalStats.totalGamesWon} vitórias, ${globalStats.totalPairsMatched} pares, ${globalStats.totalSynergiesTriggered} sinergias.`);

// 6. TESTE DE RESET TOTAL
console.log('\n🔹 Teste 6: Limpeza e reinicialização completa (Reset)');
StorageManager.resetAllProgress();
const resetProg = StorageManager.getProgress();
const resetGlob = StorageManager.getGlobalStats();
const resetStat = StorageManager.getLevelStats('layout_01');

if (resetProg.currentLevelIndex !== 0 || resetProg.unlockedLevels.length !== 1 || resetGlob.totalGamesWon !== 0 || resetStat.completed !== false) {
  throw new Error('Falha ao resetar o progresso');
}
console.log('  ✅ [PASS] Reset limpa todas as pranchas, estatísticas e restaura a Fase 1.');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎉 RESULTADO: TODOS OS TESTES DE STORAGE PASSARAM COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════\n');
