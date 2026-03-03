# Barra Scanner

## ConfiguraciÃ³n segura de Firebase
- **No publiques claves** en el repositorio. No hay ninguna guardada en el cÃ³digo.
- Se aceptan las configs en este orden (la primera que exista):
  1) `config.enc.json` + secreto: coloca tu JSON de Firebase en `secret-config.json` (fuera de git) y ejecuta  
     `node encrypt-config.mjs secret-config.json "frase-secreta-larga"` → se genera `config.enc.json` (el Ãºnico que debes subir).  
     Inyecta `window.__CONFIG_SECRET__="frase-secreta-larga";` antes de cargar `firebase-service.js` (o guÃ¡rdalo en `sessionStorage.CONFIG_SECRET`).
  2) `/__/firebase/init.json` de Firebase Hosting (automÃ¡tico en hosting).
  3) Variable global `window.__FIREBASE_CONFIG__` antes de cargar los scripts:
     ```html
     <script>
       window.__FIREBASE_CONFIG__ = {
         apiKey: "TU_API_KEY",
         authDomain: "TU_AUTH_DOMAIN",
         projectId: "TU_PROJECT_ID",
         storageBucket: "TU_STORAGE_BUCKET",
         messagingSenderId: "TU_SENDER_ID",
         appId: "TU_APP_ID",
         measurementId: "G-XXXXXXXXXX"
       };
     </script>
     ```
- Si no hay configuraciÃ³n, el login y la app quedan bloqueados para evitar uso inseguro.

## Sitio
- Demo/Hosting: https://oryxen.tech/barra/ (asegÃºrate de configurar Firebase antes de usar).
