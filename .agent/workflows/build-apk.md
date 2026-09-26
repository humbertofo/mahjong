# Workflow: Geração do APK Android Offline

1. Executar build do projeto web:
   ```bash
   npm run build
   ```
2. Sincronizar os arquivos com o projeto Capacitor Android:
   ```bash
   npx cap sync android
   ```
3. Gerar o APK com Gradle:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
4. O arquivo gerado estará em `android/app/build/outputs/apk/release/app-release-unsigned.apk` (ou assinado com keystore).
