# 🀄 Mahjong Solitaire Offline para Android

Jogo de **Mahjong Solitaire (Shanghai / Taipei)** 100% offline, desenvolvido com carinho especialmente para jogabilidade relaxante em dispositivos Android.

---

## 🌟 Principais Recursos

- **Acessibilidade para Idosos:**
  - **Peças Grandes com Auto-Fit:** Cálculo inteligente de escala para aproveitar ao máximo a tela do celular/tablet sem cortar nenhuma peça.
  - **Numerais de Apoio nos Cantos:** Numerais arábicos (1 a 9) nítidos no canto superior das pedras chinesas (caracteres, ventos e flores) para identificação instantânea.
  - **Destaque de Peças Livres:** Peças bloqueadas recebem um filtro suave, permitindo que a mãe veja imediatamente quais peças estão disponíveis para jogar.
  - **Ergonomia do Polegar:** Botões inferiores ampliados para toque confortável com o polegar.
- **Zero Estresse (Modo Zen):**
  - Sem cronômetro regressivo com punição ou game over forçado.
  - **Desfazer (Undo)** ilimitado com retorno passo a passo.
  - **Dicas (Hint)** inteligentes com pulso dourado/esmeralda no par livre.
  - **Embaralhar (Shuffle)** garantindo novas jogadas sem perder o progresso.
- **Geração 100% Solucionável:** Algoritmo matemático reverso que assegura que todo início de jogo possui solução.
- **Áudio Procedural:** Sons realistas de pedras de marfim batendo (*clack*) e chimes suaves sem exigir downloads externos.
- **4 Temas de Mesa:** Feltro Verde Clássico, Madeira Nobre, Jardim Zen Dark e Linho Claro.

---

## 🚀 Como Testar no Navegador do Computador

Para testar localmente no seu computador antes de gerar o APK:

```bash
npm run dev
```

Abra o link local (ex: `http://localhost:3000`) no Google Chrome ou Edge. Pressione `F12` e ative o modo de emulação de celular/tablet (orientação horizontal/paisagem) para testar a experiência de toque.

---

## 📱 Como Gerar o APK para o Celular da Sua Mãe

### 1. Build da Aplicação
```bash
npm run build
npx cap sync android
```

### 2. Gerar o APK via Linha de Comando (Gradle)
```bash
cd android
./gradlew assembleDebug
```
*O APK de instalação rápida estará disponível em:*
`android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Enviar e Instalar no Celular dela (Sideloading)
1. Envie o arquivo `.apk` para o celular dela via WhatsApp, Telegram ou cabo USB.
2. No celular Android dela, abra o gerenciador de arquivos e toque no `.apk`.
3. Quando o Android perguntar sobre fontes desconhecidas, marque **"Permitir desta fonte"**.
4. Toque em **Instalar** e o jogo estará pronto na tela inicial!
