// Translation system for the game
export interface TranslationData {
  // Settings modal
  settings: string;
  fixedGradient: string;
  scrollGradient: string;
  randomLandscape: string;
  unlockSpeed: string;
  showFPS: string;
  teslaMode: string;
  enableMultiplayer: string;
  enableWebRTC: string;
  webrtcHelpGeneral: string;
  webrtcHelpGithubPages: string;
  directP2PTitle: string;
  directP2PDesc: string;
  p2pCreateRoom: string;
  p2pJoinRoom: string;
  p2pOfferCode: string;
  p2pEnterOffer: string;
  p2pYourAnswer: string;
  p2pEnterAnswer: string;
  p2pGathering: string;
  p2pWaitingAnswer: string;
  p2pConnected: string;
  p2pDisconnect: string;
  p2pCopy: string;
  p2pCopied: string;
  verticalMode: string;
  playerName: string;
  language: string;

  // Keyboard controls
  keyboardControls: string;
  pressT: string;
  arrowKeys: string;
  spaceJump: string;
  pressE: string;

  // Shop items - Characters
  characters: string;
  yellowSquare: string;
  yellowCircle: string;
  redCircle: string;
  blueCircle: string;
  greenCircle: string;
  smileyFace: string;
  grinningFace: string;
  coolFace: string;
  beamingFace: string;
  star: string;
  roflFace: string;
  crown: string;
  huggingFace: string;
  partyFace: string;
  rocket: string;
  cherryBlossom: string;
  revolvingHearts: string;
  alien: string;
  koala: string;

  // Shop items - Gameplay upgrades
  gameplay: string;
  extraLife: string;
  extraLifeDesc: string;
  doubleJumpStart: string;
  doubleJumpStartDesc: string;
  speedBoost: string;
  speedBoostDesc: string;
  coinValue: string;
  coinValueDesc: string;
  megaLife: string;
  megaLifeDesc: string;

  // Shop status text
  selected: string;
  owned: string;
  points: string;

  // Game UI
  installGame: string;

  // Common words
  close: string;
}

export const translations: Record<string, TranslationData> = {
  en: {
    // Settings modal
    settings: 'Settings',
    fixedGradient: 'Fixed background gradient',
    scrollGradient: 'Scrolling background gradient',
    randomLandscape: 'Random landscape background (scrolls with player)',
    unlockSpeed: 'Unlock maximum speed (2x movement speed)',
    showFPS: 'Show FPS counter',
    teslaMode: 'Tesla Mode (always show onscreen controls)',
    enableMultiplayer: 'Enable Multiplayer (optional)',
    enableWebRTC: 'Prefer WebRTC data channel (experimental)',
    webrtcHelpGeneral:
      'WebRTC improves movement latency after multiplayer connects via the server.',
    webrtcHelpGithubPages:
      'On GitHub Pages, use Direct P2P below to play without any server.',
    directP2PTitle: 'Direct P2P (no server required)',
    directP2PDesc:
      'Play with a friend without any server — works on GitHub Pages. Exchange codes via chat or copy-paste.',
    p2pCreateRoom: 'Create Room',
    p2pJoinRoom: 'Join Room',
    p2pOfferCode: 'Your offer code (share with friend):',
    p2pEnterOffer: 'Paste offer code from friend:',
    p2pYourAnswer: 'Your answer code (send back to friend):',
    p2pEnterAnswer: 'Paste answer code from friend:',
    p2pGathering: 'Gathering connection info…',
    p2pWaitingAnswer: "Waiting for friend's answer code…",
    p2pConnected: '✓ Connected via direct P2P!',
    p2pDisconnect: 'Disconnect',
    p2pCopy: 'Copy',
    p2pCopied: 'Copied!',
    verticalMode: 'Vertical Mode (manual)',
    playerName: 'Player Name:',
    language: 'Language:',

    // Keyboard controls
    keyboardControls: 'Keyboard Controls:',
    pressT: '• Press T to toggle speed',
    arrowKeys: '• Arrow keys or WASD to move',
    spaceJump: '• Space or Up arrow to jump',
    pressE: '• Press E to eat/spit circle enemies',

    // Shop items - Characters
    characters: 'Characters',
    yellowSquare: 'Yellow Square',
    yellowCircle: 'Yellow Circle',
    redCircle: 'Red Circle',
    blueCircle: 'Blue Circle',
    greenCircle: 'Green Circle',
    smileyFace: 'Smiley Face',
    grinningFace: 'Grinning Face',
    coolFace: 'Cool Face',
    beamingFace: 'Beaming Face',
    star: 'Star',
    roflFace: 'ROFL Face',
    crown: 'Crown',
    huggingFace: 'Hugging Face',
    partyFace: 'Party Face',
    rocket: 'Rocket',
    cherryBlossom: 'Cherry Blossom',
    revolvingHearts: 'Revolving Hearts',
    alien: 'Alien',
    koala: 'Koala',

    // Shop items - Gameplay upgrades
    gameplay: 'Gameplay',
    extraLife: 'Start with Extra Life',
    extraLifeDesc: 'Begin each game with 4 lives instead of 3',
    doubleJumpStart: 'Start with Double Jump',
    doubleJumpStartDesc: 'Begin each level with double jump ability',
    speedBoost: 'Permanent Speed Boost',
    speedBoostDesc: '1.5x movement speed permanently',
    coinValue: 'Double Coin Value',
    coinValueDesc: 'Coins are worth 2 points each',
    megaLife: 'Start with Mega Life',
    megaLifeDesc: 'Start each game with 5 lives instead of 3',

    // Shop status text
    selected: 'Selected',
    owned: 'Owned',
    points: 'pts',

    // Game UI
    installGame: 'Install Game',

    // Common words
    close: 'Close',
  },

  nl: {
    // Settings modal
    settings: 'Instellingen',
    fixedGradient: 'Vaste achtergrondverloop',
    scrollGradient: 'Scrollende achtergrondverloop',
    randomLandscape:
      'Willekeurige landschapsachtergrond (scrollt mee met speler)',
    unlockSpeed: 'Ontgrendel maximale snelheid (2x bewegingssnelheid)',
    showFPS: 'Toon FPS-teller',
    teslaMode: 'Tesla-modus (toon altijd schermknoppen)',
    enableMultiplayer: 'Multiplayer inschakelen (optioneel)',
    enableWebRTC: 'Gebruik WebRTC datakanaal (experimenteel)',
    webrtcHelpGeneral:
      'WebRTC verlaagt de bewegingsvertraging zodra multiplayer via de server is verbonden.',
    webrtcHelpGithubPages:
      'Op GitHub Pages gebruik je Directe P2P hieronder om zonder server te spelen.',
    directP2PTitle: 'Directe P2P (geen server nodig)',
    directP2PDesc:
      'Speel met een vriend zonder server — werkt op GitHub Pages. Wissel codes uit via chat of kopieer-plak.',
    p2pCreateRoom: 'Kamer Aanmaken',
    p2pJoinRoom: 'Kamer Joinen',
    p2pOfferCode: 'Jouw aanbiedings-code (deel met vriend):',
    p2pEnterOffer: 'Plak aanbiedings-code van vriend:',
    p2pYourAnswer: 'Jouw antwoord-code (stuur terug naar vriend):',
    p2pEnterAnswer: 'Plak antwoord-code van vriend:',
    p2pGathering: 'Verbindingsinfo verzamelen…',
    p2pWaitingAnswer: 'Wachten op antwoord-code van vriend…',
    p2pConnected: '✓ Verbonden via directe P2P!',
    p2pDisconnect: 'Verbinding verbreken',
    p2pCopy: 'Kopiëren',
    p2pCopied: 'Gekopieerd!',
    verticalMode: 'Verticale modus (handmatig)',
    playerName: 'Spelersnaam:',
    language: 'Taal:',

    // Keyboard controls
    keyboardControls: 'Toetsenbordbesturing:',
    pressT: '• Druk op T om snelheid te schakelen',
    arrowKeys: '• Pijltoetsen of WASD om te bewegen',
    spaceJump: '• Spatie of pijl omhoog om te springen',
    pressE: '• Druk op E om cirkelvijanden te eten/uitspugen',

    // Shop items - Characters
    characters: 'Karakters',
    yellowSquare: 'Geel Vierkant',
    yellowCircle: 'Gele Cirkel',
    redCircle: 'Rode Cirkel',
    blueCircle: 'Blauwe Cirkel',
    greenCircle: 'Groene Cirkel',
    smileyFace: 'Lachend Gezicht',
    grinningFace: 'Grijnzend Gezicht',
    coolFace: 'Cool Gezicht',
    beamingFace: 'Stralend Gezicht',
    star: 'Ster',
    roflFace: 'ROFL Gezicht',
    crown: 'Kroon',
    huggingFace: 'Knuffelend Gezicht',
    partyFace: 'Feest Gezicht',
    rocket: 'Raket',
    cherryBlossom: 'Kersenbloesem',
    revolvingHearts: 'Draaiende Hartjes',
    alien: 'Alien',
    koala: 'Koala',

    // Shop items - Gameplay upgrades
    gameplay: 'Gameplay',
    extraLife: 'Start met Extra Leven',
    extraLifeDesc: 'Begin elk spel met 4 levens in plaats van 3',
    doubleJumpStart: 'Start met Dubbele Sprong',
    doubleJumpStartDesc: 'Begin elk level met dubbele sprong mogelijkheid',
    speedBoost: 'Permanente Snelheidsboost',
    speedBoostDesc: '1.5x bewegingssnelheid permanent',
    coinValue: 'Dubbele Muntwaarde',
    coinValueDesc: 'Munten zijn 2 punten waard elk',
    megaLife: 'Start met Mega Leven',
    megaLifeDesc: 'Start elk spel met 5 levens in plaats van 3',

    // Shop status text
    selected: 'Geselecteerd',
    owned: 'In Bezit',
    points: 'ptn',

    // Game UI
    installGame: 'Spel Installeren',

    // Common words
    close: 'Sluiten',
  },

  de: {
    // Settings modal
    settings: 'Einstellungen',
    fixedGradient: 'Fester Hintergrundverlauf',
    scrollGradient: 'Scrollender Hintergrundverlauf',
    randomLandscape: 'Zufälliger Landschaftshintergrund (scrollt mit Spieler)',
    unlockSpeed:
      'Maximale Geschwindigkeit freischalten (2x Bewegungsgeschwindigkeit)',
    showFPS: 'FPS-Zähler anzeigen',
    teslaMode: 'Tesla-Modus (immer Bildschirmsteuerung anzeigen)',
    enableMultiplayer: 'Mehrspieler aktivieren (optional)',
    enableWebRTC: 'WebRTC-Datenkanal bevorzugen (experimentell)',
    webrtcHelpGeneral:
      'WebRTC reduziert die Bewegungsverzogerung, nachdem die Mehrspieler-Verbindung uber den Server steht.',
    webrtcHelpGithubPages:
      'Auf GitHub Pages nutze Direkt-P2P unten, um ohne Server zu spielen.',
    directP2PTitle: 'Direkt-P2P (kein Server erforderlich)',
    directP2PDesc:
      'Spiele mit einem Freund ohne Server — funktioniert auf GitHub Pages. Tausche Codes per Chat oder Kopieren-Einfügen aus.',
    p2pCreateRoom: 'Raum erstellen',
    p2pJoinRoom: 'Raum beitreten',
    p2pOfferCode: 'Dein Angebotscode (mit Freund teilen):',
    p2pEnterOffer: 'Angebotscode vom Freund einfügen:',
    p2pYourAnswer: 'Dein Antwortcode (zurück an Freund senden):',
    p2pEnterAnswer: 'Antwortcode vom Freund einfügen:',
    p2pGathering: 'Verbindungsinfos werden gesammelt…',
    p2pWaitingAnswer: 'Warte auf Antwortcode vom Freund…',
    p2pConnected: '✓ Verbunden via Direkt-P2P!',
    p2pDisconnect: 'Trennen',
    p2pCopy: 'Kopieren',
    p2pCopied: 'Kopiert!',
    verticalMode: 'Vertikaler Modus (manuell)',
    playerName: 'Spielername:',
    language: 'Sprache:',

    // Keyboard controls
    keyboardControls: 'Tastatursteuerung:',
    pressT: '• T drücken um Geschwindigkeit zu wechseln',
    arrowKeys: '• Pfeiltasten oder WASD zum Bewegen',
    spaceJump: '• Leertaste oder Pfeil nach oben zum Springen',
    pressE: '• E drücken um Kreisfeinde zu fressen/ausspucken',

    // Shop items - Characters
    characters: 'Charaktere',
    yellowSquare: 'Gelbes Quadrat',
    yellowCircle: 'Gelber Kreis',
    redCircle: 'Roter Kreis',
    blueCircle: 'Blauer Kreis',
    greenCircle: 'Grüner Kreis',
    smileyFace: 'Lächelndes Gesicht',
    grinningFace: 'Grinsendes Gesicht',
    coolFace: 'Cooles Gesicht',
    beamingFace: 'Strahlendes Gesicht',
    star: 'Stern',
    roflFace: 'ROFL Gesicht',
    crown: 'Krone',
    huggingFace: 'Umarmungsgesicht',
    partyFace: 'Party Gesicht',
    rocket: 'Rakete',
    cherryBlossom: 'Kirschblüte',
    revolvingHearts: 'Rotierende Herzen',
    alien: 'Außerirdischer',
    koala: 'Koala',

    // Shop items - Gameplay upgrades
    gameplay: 'Gameplay',
    extraLife: 'Mit Extra Leben starten',
    extraLifeDesc: 'Jedes Spiel mit 4 Leben anstatt 3 beginnen',
    doubleJumpStart: 'Mit Doppelsprung starten',
    doubleJumpStartDesc: 'Jedes Level mit Doppelsprung-Fähigkeit beginnen',
    speedBoost: 'Permanenter Geschwindigkeitsschub',
    speedBoostDesc: '1.5x Bewegungsgeschwindigkeit permanent',
    coinValue: 'Doppelter Münzwert',
    coinValueDesc: 'Münzen sind je 2 Punkte wert',
    megaLife: 'Mit Mega Leben starten',
    megaLifeDesc: 'Jedes Spiel mit 5 Leben anstatt 3 starten',

    // Shop status text
    selected: 'Ausgewählt',
    owned: 'Besitzt',
    points: 'Pkt',

    // Game UI
    installGame: 'Spiel Installieren',

    // Common words
    close: 'Schließen',
  },

  es: {
    // Settings modal
    settings: 'Configuración',
    fixedGradient: 'Gradiente de fondo fijo',
    scrollGradient: 'Gradiente de fondo desplazable',
    randomLandscape: 'Fondo de paisaje aleatorio (se desplaza con el jugador)',
    unlockSpeed: 'Desbloquear velocidad máxima (2x velocidad de movimiento)',
    showFPS: 'Mostrar contador FPS',
    teslaMode: 'Modo Tesla (siempre mostrar controles en pantalla)',
    enableMultiplayer: 'Habilitar multijugador (opcional)',
    enableWebRTC: 'Preferir canal de datos WebRTC (experimental)',
    webrtcHelpGeneral:
      'WebRTC mejora la latencia de movimiento despues de conectar multijugador por el servidor.',
    webrtcHelpGithubPages:
      'En GitHub Pages, usa P2P Directo abajo para jugar sin ningun servidor.',
    directP2PTitle: 'P2P Directo (sin servidor)',
    directP2PDesc:
      'Juega con un amigo sin servidor — funciona en GitHub Pages. Intercambia códigos por chat o copia y pega.',
    p2pCreateRoom: 'Crear Sala',
    p2pJoinRoom: 'Unirse a Sala',
    p2pOfferCode: 'Tu código de oferta (comparte con amigo):',
    p2pEnterOffer: 'Pega el código de oferta de tu amigo:',
    p2pYourAnswer: 'Tu código de respuesta (envía de vuelta al amigo):',
    p2pEnterAnswer: 'Pega el código de respuesta de tu amigo:',
    p2pGathering: 'Recopilando información de conexión…',
    p2pWaitingAnswer: 'Esperando código de respuesta del amigo…',
    p2pConnected: '✓ ¡Conectado vía P2P directo!',
    p2pDisconnect: 'Desconectar',
    p2pCopy: 'Copiar',
    p2pCopied: '¡Copiado!',
    verticalMode: 'Modo vertical (manual)',
    playerName: 'Nombre del jugador:',
    language: 'Idioma:',

    // Keyboard controls
    keyboardControls: 'Controles de teclado:',
    pressT: '• Presiona T para alternar velocidad',
    arrowKeys: '• Flechas o WASD para mover',
    spaceJump: '• Espacio o flecha arriba para saltar',
    pressE: '• Presiona E para comer/escupir enemigos circulares',

    // Shop items - Characters
    characters: 'Personajes',
    yellowSquare: 'Cuadrado Amarillo',
    yellowCircle: 'Círculo Amarillo',
    redCircle: 'Círculo Rojo',
    blueCircle: 'Círculo Azul',
    greenCircle: 'Círculo Verde',
    smileyFace: 'Cara Sonriente',
    grinningFace: 'Cara Sonriendo',
    coolFace: 'Cara Genial',
    beamingFace: 'Cara Radiante',
    star: 'Estrella',
    roflFace: 'Cara ROFL',
    crown: 'Corona',
    huggingFace: 'Cara Abrazando',
    partyFace: 'Cara de Fiesta',
    rocket: 'Cohete',
    cherryBlossom: 'Flor de Cerezo',
    revolvingHearts: 'Corazones Giratorios',
    alien: 'Alienígena',
    koala: 'Koala',

    // Shop items - Gameplay upgrades
    gameplay: 'Jugabilidad',
    extraLife: 'Comenzar con Vida Extra',
    extraLifeDesc: 'Comenzar cada juego con 4 vidas en lugar de 3',
    doubleJumpStart: 'Comenzar con Salto Doble',
    doubleJumpStartDesc: 'Comenzar cada nivel con habilidad de salto doble',
    speedBoost: 'Impulso de Velocidad Permanente',
    speedBoostDesc: '1.5x velocidad de movimiento permanentemente',
    coinValue: 'Valor Doble de Monedas',
    coinValueDesc: 'Las monedas valen 2 puntos cada una',
    megaLife: 'Comenzar con Mega Vida',
    megaLifeDesc: 'Comenzar cada juego con 5 vidas en lugar de 3',

    // Shop status text
    selected: 'Seleccionado',
    owned: 'Poseído',
    points: 'pts',

    // Game UI
    installGame: 'Instalar Juego',

    // Common words
    close: 'Cerrar',
  },

  fr: {
    // Settings modal
    settings: 'Paramètres',
    fixedGradient: "Dégradé d'arrière-plan fixe",
    scrollGradient: "Dégradé d'arrière-plan défilant",
    randomLandscape: 'Arrière-plan paysage aléatoire (défile avec le joueur)',
    unlockSpeed: 'Débloquer la vitesse maximale (2x vitesse de mouvement)',
    showFPS: 'Afficher le compteur FPS',
    teslaMode: "Mode Tesla (toujours afficher les contrôles à l'écran)",
    enableMultiplayer: 'Activer le multijoueur (optionnel)',
    enableWebRTC: 'Preferer le canal de donnees WebRTC (experimental)',
    webrtcHelpGeneral:
      'WebRTC reduit la latence des mouvements apres la connexion multijoueur via le serveur.',
    webrtcHelpGithubPages:
      'Sur GitHub Pages, utilisez P2P Direct ci-dessous pour jouer sans serveur.',
    directP2PTitle: 'P2P Direct (sans serveur)',
    directP2PDesc:
      'Jouez avec un ami sans serveur — fonctionne sur GitHub Pages. Échangez des codes par chat ou copier-coller.',
    p2pCreateRoom: 'Créer une Salle',
    p2pJoinRoom: 'Rejoindre une Salle',
    p2pOfferCode: "Votre code d'offre (partagez avec l'ami):",
    p2pEnterOffer: "Collez le code d'offre de votre ami:",
    p2pYourAnswer: "Votre code de réponse (renvoyez à l'ami):",
    p2pEnterAnswer: 'Collez le code de réponse de votre ami:',
    p2pGathering: 'Collecte des informations de connexion…',
    p2pWaitingAnswer: "En attente du code de réponse de l'ami…",
    p2pConnected: '✓ Connecté via P2P direct!',
    p2pDisconnect: 'Déconnecter',
    p2pCopy: 'Copier',
    p2pCopied: 'Copié!',
    verticalMode: 'Mode vertical (manuel)',
    playerName: 'Nom du joueur:',
    language: 'Langue:',

    // Keyboard controls
    keyboardControls: 'Contrôles clavier:',
    pressT: '• Appuyez sur T pour basculer la vitesse',
    arrowKeys: '• Flèches ou WASD pour se déplacer',
    spaceJump: '• Espace ou flèche haut pour sauter',
    pressE: '• Appuyez sur E pour manger/cracher les ennemis circulaires',

    // Shop items - Characters
    characters: 'Personnages',
    yellowSquare: 'Carré Jaune',
    yellowCircle: 'Cercle Jaune',
    redCircle: 'Cercle Rouge',
    blueCircle: 'Cercle Bleu',
    greenCircle: 'Cercle Vert',
    smileyFace: 'Visage Souriant',
    grinningFace: 'Visage Grimaçant',
    coolFace: 'Visage Cool',
    beamingFace: 'Visage Rayonnant',
    star: 'Étoile',
    roflFace: 'Visage ROFL',
    crown: 'Couronne',
    huggingFace: 'Visage Câlin',
    partyFace: 'Visage Fête',
    rocket: 'Fusée',
    cherryBlossom: 'Fleur de Cerisier',
    revolvingHearts: 'Cœurs Tournoyants',
    alien: 'Alien',
    koala: 'Koala',

    // Shop items - Gameplay upgrades
    gameplay: 'Gameplay',
    extraLife: 'Commencer avec Vie Supplémentaire',
    extraLifeDesc: 'Commencer chaque jeu avec 4 vies au lieu de 3',
    doubleJumpStart: 'Commencer avec Double Saut',
    doubleJumpStartDesc:
      'Commencer chaque niveau avec la capacité de double saut',
    speedBoost: 'Boost de Vitesse Permanent',
    speedBoostDesc: '1.5x vitesse de mouvement en permanence',
    coinValue: 'Valeur Double des Pièces',
    coinValueDesc: 'Les pièces valent 2 points chacune',
    megaLife: 'Commencer avec Méga Vie',
    megaLifeDesc: 'Commencer chaque jeu avec 5 vies au lieu de 3',

    // Shop status text
    selected: 'Sélectionné',
    owned: 'Possédé',
    points: 'pts',

    // Game UI
    installGame: 'Installer le Jeu',

    // Common words
    close: 'Fermer',
  },
};

// Current language state
let currentLanguage = localStorage.getItem('gameLanguage') || 'en';

// Get translation function
export function t(key: keyof TranslationData): string {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

// Set language function
export function setLanguage(language: string): void {
  if (translations[language]) {
    currentLanguage = language;
    localStorage.setItem('gameLanguage', language);
  }
}

// Get current language
export function getCurrentLanguage(): string {
  return currentLanguage;
}

// Get available languages
export function getAvailableLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ];
}
