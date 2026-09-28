import { PlacedTile, SynergyResult } from '../../../types';
import { CascadeResolver } from './CascadeResolver';

export class TheatricalSynergies {
  public static checkFrogTongue(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'frog' && (v2 === 'ladybug' || v2 === 'bee')) ||
      ((v1 === 'ladybug' || v1 === 'bee') && v2 === 'frog') ||
      (v1 === 'frog' && v2 === 'frog')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'frog_tongue',
          title: 'Língua Ágil',
          icon: '🐸',
          preyValues: ['ladybug', 'bee'],
          boardPairDescription: 'O sapo esticou a língua elástica e capturou o par de insetos no tabuleiro!',
          trayRescueDescription: 'O sapo esticou a língua até a bandeja e devorou o inseto preso, aliviando o espaço!',
          loneCatchDescription: 'O sapo capturou o inseto solitário que obstruía o tabuleiro!',
          zenGraceDescription: 'Sem insetos à vista, o sapinho meditou na vitória-régia e concedeu +300 Harmonia Zen!',
          baseScore: 240,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkCatPaw(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'cat' && v2 === 'fish') ||
      (v1 === 'fish' && v2 === 'cat') ||
      (v1 === 'cat' && v2 === 'cat')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'cat_paw',
          title: 'Pata Ágil',
          icon: '🐱',
          preyValues: ['fish'],
          boardPairDescription: 'O gato deu uma patada rápida e pescou um par de peixes do tabuleiro!',
          trayRescueDescription: 'O gato pescou o peixe que ocupava sua bandeja, abrindo espaço imediato!',
          loneCatchDescription: 'O gato fisgou o peixinho isolado e libertou o fluxo!',
          zenGraceDescription: 'Sem peixes na lagoa, o felino ronronou em paz e concedeu +300 Harmonia Zen!',
          baseScore: 220,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkBearFeast(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'bear' && (v2 === 'honeycomb' || v2 === 'fish')) ||
      ((v1 === 'honeycomb' || v1 === 'fish') && v2 === 'bear') ||
      (v1 === 'bear' && v2 === 'bear')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'bear_feast',
          title: 'Banquete do Urso',
          icon: '🐻',
          preyValues: ['honeycomb', 'fish'],
          boardPairDescription: 'O urso saboreou seu banquete e devorou um par completo do tabuleiro!',
          trayRescueDescription: 'O urso encontrou alimento na sua bandeja e o recolheu, aliviando o jogo!',
          loneCatchDescription: 'O urso coletou o petisco solitário no tabuleiro!',
          zenGraceDescription: 'Em plena fartura, o urso adormeceu sereno e concedeu +300 Harmonia Zen!',
          baseScore: 300,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkDolphinSonar(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'dolphin' && v2 === 'shell') ||
      (v1 === 'shell' && v2 === 'dolphin') ||
      (v1 === 'dolphin' && v2 === 'dolphin')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'dolphin_sonar',
          title: 'Eco Sonar',
          icon: '🐬',
          preyValues: ['shell'],
          boardPairDescription: 'O eco sonar das profundezas resgatou um par de conchas do tabuleiro!',
          trayRescueDescription: 'As ondas sonoras resgataram a concha da sua bandeja para as profundezas!',
          loneCatchDescription: 'O sonar localizou e recolheu a concha solitária!',
          zenGraceDescription: 'As ondas cristalinas do golfinho harmonizaram os oceanos (+300 Harmonia Zen)!',
          baseScore: 220,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkPenguinSlide(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'penguin' && v2 === 'fish') ||
      (v1 === 'fish' && v2 === 'penguin') ||
      (v1 === 'penguin' && v2 === 'penguin')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'penguin_slide',
          title: 'Deslize Glacial',
          icon: '🐧',
          preyValues: ['fish'],
          boardPairDescription: 'O pinguim deslizou pelo gelo e pescou um par de peixes no caminho!',
          trayRescueDescription: 'O pinguim deslizou até sua bandeja e recolheu o peixe preso!',
          loneCatchDescription: 'O pinguim recolheu velozmente o peixe isolado!',
          zenGraceDescription: 'O ar puro do polo norte envolveu o tabuleiro com serenidade (+300 Harmonia Zen)!',
          baseScore: 230,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkPandaZen(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'panda' && v2 === 'acorn') ||
      (v1 === 'acorn' && v2 === 'panda') ||
      (v1 === 'panda' && v2 === 'panda')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'panda_zen',
          title: 'Bambu Zen',
          icon: '🐼',
          preyValues: ['acorn'],
          boardPairDescription: 'O panda colheu brotos nutritivos no tabuleiro com sabedoria ancestral!',
          trayRescueDescription: 'O panda aliviou a semente presa na bandeja para seu lanche matinal!',
          loneCatchDescription: 'O panda coletou a noz solitária para seu lanche!',
          zenGraceDescription: 'O panda entrou em meditação profunda concedendo paz e +300 Harmonia Zen!',
          baseScore: 250,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }

  public static checkElephantCrush(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = [],
    isTacticalMode: boolean = false
  ): SynergyResult | null {
    if (
      (v1 === 'elephant' && v2 === 'acorn') ||
      (v1 === 'acorn' && v2 === 'elephant') ||
      (v1 === 'elephant' && v2 === 'elephant')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'elephant_crush',
          title: 'Impacto Monumental',
          icon: '🐘',
          preyValues: ['acorn'],
          boardPairDescription: 'O elefante pisou firme no solo e estremeceu o par de nozes para fora do tabuleiro!',
          trayRescueDescription: 'A tromba do elefante resgatou a peça da bandeja com força monumental!',
          loneCatchDescription: 'A pegada firme do elefante soltou a peça presa no tabuleiro!',
          zenGraceDescription: 'A imponência da manada trouxe segurança e estabilidade (+300 Harmonia Zen)!',
          baseScore: 260,
        },
        activeTiles,
        tray,
        isTacticalMode
      );
    }
    return null;
  }
}
