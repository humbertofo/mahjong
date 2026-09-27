export interface WorldGroup {
  id: string;
  title: string;
  description: string;
  levelRange: [number, number];
  bg: string;
}

export const WORLDS: WorldGroup[] = [
  { id: 'world-1', title: 'Jardim do Aprendiz', description: 'Trilhas zen e pedras fáceis para relaxar', levelRange: [1, 5], bg: 'radial-gradient(circle at center, #1b382b 0%, #0a1410 100%)' },
  { id: 'world-2', title: 'Bosque da Fortuna', description: 'O Camaleão Dourado e os segredos do baú', levelRange: [6, 10], bg: 'radial-gradient(circle at center, #203318 0%, #0b1209 100%)' },
  { id: 'world-3', title: 'Vale Glacial', description: 'Águas geladas, auroras boreais e peças de gelo', levelRange: [11, 15], bg: 'radial-gradient(circle at center, #142a38 0%, #061118 100%)' },
  { id: 'world-4', title: 'Floresta de Bambu', description: 'Santuário do Panda Zen e cipós da selva', levelRange: [16, 20], bg: 'radial-gradient(circle at center, #173628 0%, #081710 100%)' },
  { id: 'world-5', title: 'Santuário de Pedra', description: 'Megálitos ancestrais, rochas e casulos místicos', levelRange: [21, 25], bg: 'radial-gradient(circle at center, #362214 0%, #120b06 100%)' },
  { id: 'world-6', title: 'Rios Ancestrais', description: 'Pontes pênseis sobre águas límpidas e labirintos', levelRange: [26, 30], bg: 'radial-gradient(circle at center, #112a45 0%, #040c14 100%)' },
  { id: 'world-7', title: 'Reino dos Espelhos', description: 'Salões de mármore imperial e reflexos místicos', levelRange: [31, 35], bg: 'radial-gradient(circle at center, #2e1842 0%, #0d0614 100%)' },
  { id: 'world-8', title: 'Savana dos Segredos', description: 'Grandes predadores e o enigma da Chave Mestra', levelRange: [36, 40], bg: 'radial-gradient(circle at center, #3d200a 0%, #140b04 100%)' },
  { id: 'world-9', title: 'Cumes Celestiais', description: 'Montanhas sagradas e o voo do Dragão Vermelho', levelRange: [41, 45], bg: 'radial-gradient(circle at center, #1b214a 0%, #080a1a 100%)' },
  { id: 'world-10', title: 'Templo dos Mestres', description: 'A glória suprema: Classic Shanghai com 144 peças', levelRange: [46, 50], bg: 'radial-gradient(circle at center, #420f1a 0%, #140408 100%)' }
];
