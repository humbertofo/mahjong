import { PlacedTile, SynergyResult } from '../../../types';
import { CascadeResolver } from './CascadeResolver';

export class ForagingSynergies {
  public static checkWildcardChameleon(v1: string, v2: string): SynergyResult | null {
    if (v1 === 'chameleon' || v2 === 'chameleon') {
      return {
        type: 'wildcard_chameleon',
        title: '🦎 Camaleão Holográfico!',
        description: 'A peça coringa se adaptou organicamente e completou a combinação.',
        bonusScore: 150,
      };
    }
    return null;
  }

  public static checkMonkeyBanana(
    v1: string,
    v2: string,
    onShuffleRemaining: () => void
  ): SynergyResult | null {
    if (
      (v1 === 'monkey' && v2 === 'banana') ||
      (v1 === 'banana' && v2 === 'monkey') ||
      (v1 === 'monkey' && v2 === 'monkey')
    ) {
      onShuffleRemaining();
      return {
        type: 'monkey_banana',
        title: '🐒🍌 Salto na Copa!',
        description: 'O macaco saltou alegremente entre as árvores e reorganizou as peças do tabuleiro!',
        bonusScore: 200,
      };
    }
    return null;
  }

  public static checkBeeHoney(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'bee' && v2 === 'honeycomb') ||
      (v1 === 'honeycomb' && v2 === 'bee') ||
      (v1 === 'bee' && v2 === 'bee')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'bee_honey',
          title: 'Enxame Dourado',
          icon: '🐝🍯',
          preyValues: ['honeycomb'],
          boardPairDescription: 'O enxame de abelhas colheu o par de mel com segurança no tabuleiro!',
          trayRescueDescription: 'O enxame colheu o mel guardado na bandeja, liberando espaço com doçura!',
          loneCatchDescription: 'A abelha colheu o favo solitário do tabuleiro!',
          zenGraceDescription: 'As abelhinhas polinizam as flores do jardim concedendo +300 Harmonia Zen!',
          baseScore: 250,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkSquirrelAcorn(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'squirrel' && v2 === 'acorn') ||
      (v1 === 'acorn' && v2 === 'squirrel') ||
      (v1 === 'squirrel' && v2 === 'squirrel')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'squirrel_acorn',
          title: 'Reserva Secreta',
          icon: '🐿️🌰',
          preyValues: ['acorn'],
          boardPairDescription: 'O esquilo recolheu o par de nozes completo para sua toca de inverno!',
          trayRescueDescription: 'O esquilo encontrou sua noz na bandeja e a levou para a toca!',
          loneCatchDescription: 'O esquilo guardou a noz solitária em seu estoque secreto!',
          zenGraceDescription: 'Com despensas fartas, o esquilinho descansou tranquilo (+300 Harmonia Zen)!',
          baseScore: 200,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkHedgehogApple(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'hedgehog' && v2 === 'apple') ||
      (v1 === 'apple' && v2 === 'hedgehog') ||
      (v1 === 'hedgehog' && v2 === 'hedgehog')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'hedgehog_apple',
          title: 'Espinho Coletor',
          icon: '🦔🍎',
          preyValues: ['apple'],
          boardPairDescription: 'O ouriço rolou pelo pomar e espetou um par de maçãs doces no tabuleiro!',
          trayRescueDescription: 'O ouriço recolheu a maçã que ocupava sua bandeja com seus espinhos!',
          loneCatchDescription: 'O ouriço espetou a maçã solitária que obstruía o caminho!',
          zenGraceDescription: 'O ouriço aninhou-se sob a folhagem seca trazendo paz e +300 Harmonia Zen!',
          baseScore: 240,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkTurtleShield(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'turtle' && v2 === 'shell') ||
      (v1 === 'shell' && v2 === 'turtle') ||
      (v1 === 'turtle' && v2 === 'turtle')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'turtle_shield',
          title: 'Escudo de Carapaça',
          icon: '🐢🐚',
          preyValues: ['shell'],
          boardPairDescription: 'A tartaruga recolheu o par de conchas para fortalecer seu casco!',
          trayRescueDescription: 'A tartaruga protegeu a concha presa na sua bandeja, aliviando o espaço!',
          loneCatchDescription: 'A tartaruga resgatou a concha solitária do tabuleiro!',
          zenGraceDescription: 'A paciência milenar da tartaruga concedeu equilíbrio e +300 Harmonia Zen!',
          baseScore: 220,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkRabbitHop(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'rabbit' && v2 === 'apple') ||
      (v1 === 'apple' && v2 === 'rabbit') ||
      (v1 === 'rabbit' && v2 === 'rabbit')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'rabbit_hop',
          title: 'Salto Ágil',
          icon: '🐰🍎',
          preyValues: ['apple'],
          boardPairDescription: 'O coelho saltou gracioso e colheu o par de maçãs do tabuleiro!',
          trayRescueDescription: 'O coelho deu um salto e mordiscou a maçã da sua bandeja, liberando espaço!',
          loneCatchDescription: 'O coelho recolheu a maçã solitária no salto!',
          zenGraceDescription: 'Os saltinhos velozes do coelho espalharam boa sorte (+300 Harmonia Zen)!',
          baseScore: 210,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkFoxTrail(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'fox' && v2 === 'grapes') ||
      (v1 === 'grapes' && v2 === 'fox') ||
      (v1 === 'fox' && v2 === 'fox')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'fox_trail',
          title: 'Rastro Astuto',
          icon: '🦊🍇',
          preyValues: ['grapes'],
          boardPairDescription: 'A raposa astuta colheu os cachos de uvas no tabuleiro sem deixar rastros!',
          trayRescueDescription: 'A raposa pegou a uva esquecida na sua bandeja com agilidade!',
          loneCatchDescription: 'A raposa recolheu a uva isolada com elegância!',
          zenGraceDescription: 'A astúcia da raposa iluminou o caminho com serenidade (+300 Harmonia Zen)!',
          baseScore: 230,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkDogCatHarmony(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'dog' && (v2 === 'cat' || v2 === 'fish')) ||
      ((v1 === 'cat' || v1 === 'fish') && v2 === 'dog') ||
      (v1 === 'dog' && v2 === 'dog')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'dog_cat_harmony',
          title: 'Harmonia Doméstica',
          icon: '🐶🐱',
          preyValues: ['cat', 'fish'],
          boardPairDescription: 'Cão e gato brincaram em perfeita harmonia e liberaram o par do tabuleiro!',
          trayRescueDescription: 'O cãozinho resgatou a peça da bandeja em sinal de amizade leal!',
          loneCatchDescription: 'A lealdade do cãozinho recolheu a peça solitária!',
          zenGraceDescription: 'A amizade incondicional transbordou no tabuleiro (+300 Harmonia Zen)!',
          baseScore: 250,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkButterflyFlap(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'butterfly' && v2 === 'lotus') ||
      (v1 === 'lotus' && v2 === 'butterfly') ||
      (v1 === 'butterfly' && v2 === 'butterfly')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'butterfly_flap',
          title: 'Metamorfose Floral',
          icon: '🦋🌸',
          preyValues: ['lotus'],
          boardPairDescription: 'A borboleta dançou sobre a flor de lótus e liberou o par com graça!',
          trayRescueDescription: 'O bater de asas da borboleta purificou a bandeja, resgatando a flor!',
          loneCatchDescription: 'A borboleta pousou suavemente na flor solitária!',
          zenGraceDescription: 'A brisa da metamorfose abençoou o jogo com paz (+300 Harmonia Zen)!',
          baseScore: 240,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkDuckSplash(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'duck' && v2 === 'fish') ||
      (v1 === 'fish' && v2 === 'duck') ||
      (v1 === 'duck' && v2 === 'duck')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'duck_splash',
          title: 'Mergulho na Lagoa',
          icon: '🦆🐟',
          preyValues: ['fish'],
          boardPairDescription: 'O patinho mergulhou na lagoa e pescou o par de peixinhos!',
          trayRescueDescription: 'O patinho mergulhou até sua bandeja e recolheu o peixinho!',
          loneCatchDescription: 'O mergulho certeiro do pato recolheu o peixe solitário!',
          zenGraceDescription: 'As marolas calmas da lagoa trouxeram serenidade (+300 Harmonia Zen)!',
          baseScore: 220,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkLionRoar(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'lion' && v2 === 'sun') ||
      (v1 === 'sun' && v2 === 'lion') ||
      (v1 === 'lion' && v2 === 'lion')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'lion_roar',
          title: 'Rugido Radiante',
          icon: '🦁☀️',
          preyValues: ['sun'],
          boardPairDescription: 'O leão rugiu sob o sol dourado e iluminou o par da savana!',
          trayRescueDescription: 'A presença régia do leão absorveu o sol da sua bandeja!',
          loneCatchDescription: 'A luz dourada do leão recolheu a peça solitária do tabuleiro!',
          zenGraceDescription: 'O sol poente da savana cobriu o tabuleiro com calor nobre (+300 Harmonia Zen)!',
          baseScore: 270,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkBirdSwoop(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'bird' && v2 === 'grapes') ||
      (v1 === 'grapes' && v2 === 'bird') ||
      (v1 === 'bird' && v2 === 'bird')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'bird_swoop',
          title: 'Voo Rasante',
          icon: '🐦🍇',
          preyValues: ['grapes'],
          boardPairDescription: 'O pássaro deu um voo rasante e colheu o par de uvas do vinhedo!',
          trayRescueDescription: 'O pássaro desceu rapidamente e pegou a uva da sua bandeja!',
          loneCatchDescription: 'O bico certeiro do pássaro colheu a fruta isolada!',
          zenGraceDescription: 'O canto melodioso do pássaro acalmou os ares (+300 Harmonia Zen)!',
          baseScore: 220,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }

  public static checkSnailZen(
    v1: string,
    v2: string,
    activeTiles: PlacedTile[],
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    if (
      (v1 === 'snail' && v2 === 'leaf') ||
      (v1 === 'leaf' && v2 === 'snail') ||
      (v1 === 'snail' && v2 === 'snail')
    ) {
      return CascadeResolver.resolve(
        {
          type: 'snail_zen',
          title: 'Passo Sereno',
          icon: '🐌🍃',
          preyValues: ['leaf'],
          boardPairDescription: 'A lesma deslizou serena sobre a folha fresca e liberou o par!',
          trayRescueDescription: 'A lesma recolheu pacientemente a folha guardada na bandeja!',
          loneCatchDescription: 'A lesma alcançou a folhinha solitária do tabuleiro!',
          zenGraceDescription: 'A máxima calma do caracol trouxe foco pleno e +300 Harmonia Zen!',
          baseScore: 210,
        },
        activeTiles,
        tray
      );
    }
    return null;
  }
}
