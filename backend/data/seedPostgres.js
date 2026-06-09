'use strict';

/**
 * Seed PostgreSQL — Althea Systems
 * Peuple la base avec des données réalistes :
 *   - 2 utilisateurs (1 admin + 1 client)
 *   - 6 catégories de matériel médical
 *   - 30 produits avec images Unsplash
 *   - Contenu page d'accueil + 4 slides carrousel
 *   - 5 commandes sample
 *   - 4 messages de contact
 *
 * Usage : node backend/data/seedPostgres.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

// ---------------------------------------------------------------------------
// DONNÉES
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    name: 'Diagnostic',
    slug: 'diagnostic',
    description: 'Tensiomètres, stéthoscopes, ECG portables et dispositifs de mesure pour examens courants en cabinet.',
    image_url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&h=500&fit=crop&q=80',
    order_index: 1,
  },
  {
    name: 'Monitoring',
    slug: 'monitoring',
    description: 'Moniteurs multiparamétriques, oxymètres et holters pour le suivi continu des patients en milieu hospitalier.',
    image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=500&fit=crop&q=80',
    order_index: 2,
  },
  {
    name: 'Stérilisation',
    slug: 'sterilisation',
    description: 'Autoclaves, soudeuses et solutions de traçabilité pour les protocoles de stérilisation certifiés.',
    image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop&q=80',
    order_index: 3,
  },
  {
    name: 'Imagerie médicale',
    slug: 'imagerie',
    description: 'Échographes portables, appareils de radiologie et solutions de téléradiologie pour le diagnostic d\'image.',
    image_url: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=800&h=500&fit=crop&q=80',
    order_index: 4,
  },
  {
    name: 'Chirurgie',
    slug: 'chirurgie',
    description: 'Instruments chirurgicaux, tables d\'opération et éclairages de bloc pour les interventions.',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop&q=80',
    order_index: 5,
  },
  {
    name: 'Consommables',
    slug: 'consommables',
    description: 'Gants, masques, seringues et consommables médicaux certifiés pour l\'usage quotidien.',
    image_url: 'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=800&h=500&fit=crop&q=80',
    order_index: 6,
  },
];

// Chaque produit : { categorySlug, price, stock, image, featured, priority, name, description, characteristics }
const PRODUCTS = [
  // ── DIAGNOSTIC ──
  {
    categorySlug: 'diagnostic',
    price: 189.90, stock: 42, featured: 3, priority: 5,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80',
    name: 'Tensiomètre connecté Pro',
    description: 'Tensiomètre brassard électronique de précision clinique. Mesure simultanée de la pression artérielle et de la fréquence cardiaque avec technologie AFIB. Connectivité Bluetooth intégrée pour synchronisation avec applications santé. Mémoire 120 mesures (60 par utilisateur). Idéal pour cabinet médical et suivi à domicile.',
    characteristics: 'Précision : ±3 mmHg\nTaille brassard : 22–42 cm\nAlimentation : 4 piles AA ou adaptateur secteur\nConnectivité : Bluetooth 4.2\nMémoire : 120 mesures\nAffichage : LCD rétroéclairé 2.5"\nDétection AFIB : Oui\nCertification : CE, ISO 81060-2',
  },
  {
    categorySlug: 'diagnostic',
    price: 299.00, stock: 18, featured: 0, priority: 3,
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop&q=80',
    name: 'Stéthoscope électronique 3M Littmann',
    description: 'Stéthoscope électronique de référence mondiale pour l\'auscultation cardiaque, pulmonaire et vasculaire. Amplification sonore jusqu\'à 24× avec réduction des bruits ambiants. Mode électronique et acoustique. Compatible avec systèmes d\'enregistrement audio pour télémédecine.',
    characteristics: 'Amplification : 24×\nFréquences : 20 Hz–20 kHz\nAmbulance Noise Reduction : Oui\nBluetooth : 4.0\nAutonomie : 100h\nLongueur tube : 69 cm\nTête double face : Non (simple)\nCertification : ISO 13485',
  },
  {
    categorySlug: 'diagnostic',
    price: 1290.00, stock: 6, featured: 2, priority: 4,
    image: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=600&h=400&fit=crop&q=80',
    name: 'ECG 12 dérivations portable',
    description: 'Électrocardiographe 12 dérivations léger et portable pour cabinet et urgences. Acquisition en 10 secondes, interprétation automatique avec algorithme clinique certifié. Impression thermique intégrée. Stockage 500 ECG avec export PDF et HL7. Interface intuitive avec écran tactile couleur.',
    characteristics: 'Dérivations : 12 (I, II, III, aVR, aVL, aVF, V1–V6)\nÉcran : TFT 7" tactile\nImprimante : Thermique 80 mm\nMémoire : 500 ECG\nInterprétation auto : Oui\nConnectivité : USB, Wi-Fi\nAutonomie batterie : 4h\nPoids : 2.1 kg',
  },
  {
    categorySlug: 'diagnostic',
    price: 420.00, stock: 24, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&h=400&fit=crop&q=80',
    name: 'Otoscope LED professionnel',
    description: 'Otoscope à fibre optique LED pour examen ORL de haute précision. Lumière froide LED sans ombres, grossissement 3×. Kit complet avec ophthalmoscope, 5 spécula jetables tailles 2–5 mm. Manche rechargeable lithium-ion universel.',
    characteristics: 'Éclairage : LED 6 500K\nGrossissement : 3×\nSpécula inclus : 2.5 / 3 / 4 / 5 mm (×20 chaque)\nManche : Rechargeable Li-ion 3.7V\nCharge : USB-C\nCertification : CE Classe I\nPoids manche : 110 g',
  },
  {
    categorySlug: 'diagnostic',
    price: 85.00, stock: 120, featured: 0, priority: 1,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop&q=80',
    name: 'Glucomètre ACCU-CHEK Guide',
    description: 'Glucomètre connecté pour auto-surveillance glycémique. Résultats en 4 secondes. Application mobile mySugr incluse pour suivi et rapports. Pas de code de calibration. Compatible bandelettes ACCU-CHEK Guide. Idéal pour diabétiques et professionnels de santé.',
    characteristics: 'Volume sang : 0.6 µL\nTemps mesure : 4 secondes\nPlage : 0.6–33.3 mmol/L\nMémoire : 720 résultats\nBluetooth : Oui (application mySugr)\nAlimentation : 2 piles CR2032\nContrôle qualité : auto',
  },

  // ── MONITORING ──
  {
    categorySlug: 'monitoring',
    price: 3200.00, stock: 4, featured: 5, priority: 5,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop&q=80',
    name: 'Moniteur multiparamétrique patient',
    description: 'Moniteur patient 5 paramètres pour soins intensifs et bloc opératoire. Écran tactile TFT 12" haute résolution. Mesure simultanée ECG, SpO2, NIBP, température et fréquence respiratoire. Alarmes configurables intelligentes. Interface HL7 pour intégration DPI. Supports mural et trolley inclus.',
    characteristics: 'Écran : TFT 12" 1024×768 tactile\nParamètres : ECG, SpO2, NIBP, Temp, FR\nFréquence ECG : 3/5/12 dérivations\nSaturation : 0–100%\nAlarmes : 30 alarmes configurables\nMémoire : 96h de tendances\nConnectivité : HL7, Wi-Fi, Ethernet\nPoids : 4.5 kg',
  },
  {
    categorySlug: 'monitoring',
    price: 189.00, stock: 67, featured: 4, priority: 4,
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop&q=80',
    name: 'Oxymètre de pouls doigt',
    description: 'Oxymètre de pouls doigt à affichage OLED double couleur. Mesure SpO2, fréquence cardiaque et index de perfusion en 6 secondes. Alarme sonore et visuelle. Idéal pour suivi ambulatoire, sport de haute altitude et patients BPCO.',
    characteristics: 'SpO2 : 70–99% (±2%)\nFréquence cardiaque : 20–250 bpm\nTemps réponse : 6 secondes\nÉcran : OLED 4 orientations\nAlarme : Oui (SpO2 < 90%)\nAlimentation : 2 piles AAA\nAutonomie : 30h\nPoids : 45 g',
  },
  {
    categorySlug: 'monitoring',
    price: 2100.00, stock: 3, featured: 0, priority: 3,
    image: 'https://images.unsplash.com/photo-1559757175-5b3a37c2e1b8?w=600&h=400&fit=crop&q=80',
    name: 'Holter ECG 24h enregistreur Mortara',
    description: 'Enregistreur Holter ECG 3 canaux pour analyse cardiaque ambulatoire sur 24 à 48 heures. Mémoire flash 512 Mo. Logiciel d\'analyse inclus avec détection automatique des arythmies, extrasystoles et fibrillations. Export PDF et intégration HL7.',
    characteristics: 'Canaux : 3 (peut être configuré 12 dérivations)\nDurée enregistrement : 24–48h\nMémoire : 512 Mo flash\nFréquence échantillonnage : 1024 Hz\nLogiciel : H-Scribe (PC)\nAlgorithmes : AECG, arythmie, ST\nPoids : 68 g\nCertification : CE, IEC 60601-2-47',
  },
  {
    categorySlug: 'monitoring',
    price: 560.00, stock: 15, featured: 1, priority: 2,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop&q=80',
    name: 'Capnographe portable EtCO2',
    description: 'Capnographe portable pour mesure du CO2 expiré (EtCO2) et de la SpO2. Idéal pour surveillance en anesthésie ambulatoire et urgences pré-hospitalières. Courbe capnographique temps réel, alarmes programmables, mémoire de tendances 8h.',
    characteristics: 'EtCO2 : 0–99 mmHg (±2 mmHg)\nSpO2 : 70–99%\nFR respiratoire : 0–150 rpm\nÉcran : 3.5" couleur\nAlarmes : EtCO2, SpO2, FR\nAutonomie : 6h\nConnectivité : USB, export PDF\nPoids : 310 g',
  },
  {
    categorySlug: 'monitoring',
    price: 145.00, stock: 89, featured: 0, priority: 1,
    image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&h=400&fit=crop&q=80',
    name: 'Thermomètre infrarouge frontal',
    description: 'Thermomètre infrarouge sans contact pour mesure frontale en 1 seconde. Précision médicale ±0.2°C. Double mode front/objet. Mémoire 32 mesures. Alarme fièvre visuelle et sonore. Hygiénique, désinfectable, idéal cabinet et bloc.',
    characteristics: 'Précision : ±0.2°C\nPlage : 34.0–42.9°C\nTemps mesure : 1 seconde\nDistance mesure : 1–5 cm\nMémoire : 32 mesures\nAlarme fièvre : 37.5°C (réglable)\nAlimentation : 2 piles AAA\nCertification : CE Classe IIa',
  },

  // ── STÉRILISATION ──
  {
    categorySlug: 'sterilisation',
    price: 4800.00, stock: 2, featured: 0, priority: 5,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop&q=80',
    name: 'Autoclave vapeur classe B 23L',
    description: 'Autoclave à vapeur saturée classe B 23 litres conforme EN 13060. Cycles pré-vide fractionnés pour stérilisation de charges creuses et poreuses. 3 programmes automatiques (134°C, 121°C, Prion). Imprimante intégrée pour traçabilité. Connexion USB pour export des cycles. Conforme aux normes SFI et DASRI.',
    characteristics: 'Volume chambre : 23 litres\nClasse : B (EN 13060)\nTempérature max : 135°C\nPression max : 2.1 bar\nCycles : 134°C 4min, 121°C 20min, Prion\nImprimante : Thermique intégrée\nConnectivité : USB, RS232\nPoids : 64 kg',
  },
  {
    categorySlug: 'sterilisation',
    price: 890.00, stock: 8, featured: 0, priority: 3,
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop&q=80',
    name: 'Soudeuse à sachets SealTech Pro',
    description: 'Soudeuse pour sachets de stérilisation avec contrôle continu de la qualité de soudure. Largeur de soudure 10 mm. Affichage numérique température et pression. Conformité EN 868-8. Détection automatique d\'ouverture de sachet. Vitesse réglable 0.5–8 m/min.',
    characteristics: 'Largeur soudure : 10 mm\nVitesse : 0.5–8 m/min (réglable)\nTempérature : 140–250°C (réglable)\nBobines compatibles : 50–400 mm\nAffichage : Digital\nContrôle soudure : Continu automatique\nCertification : CE, EN 868-8\nPoids : 18 kg',
  },
  {
    categorySlug: 'sterilisation',
    price: 320.00, stock: 25, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=600&h=400&fit=crop&q=80',
    name: 'Désinfectant surfaces LD12 5L',
    description: 'Désinfectant de surfaces et petit matériel médical à base d\'ammoniums quaternaires. Spectre bactéricide, fongicide, lévuricide et virucide (EN 14476). Prêt à l\'emploi, sans rinçage sur surfaces non poreuses. Compatible matériaux médicaux : acier inox, verre, plastique ABS.',
    characteristics: 'Volume : 5 litres\nSpectre : Bactéricide + Fongicide + Virucide\nNormes : EN 1276, EN 13727, EN 14476\nTemps contact : 5 min\nBase active : Ammoniums quaternaires 0.5%\nCompatibilité matériaux : Inox, verre, plastique\nConditionnement : Bidon HDPE avec bouchon sécurité\nConservation : 3 ans',
  },
  {
    categorySlug: 'sterilisation',
    price: 2600.00, stock: 3, featured: 0, priority: 4,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop&q=80',
    name: 'Laveur désinfecteur automatique',
    description: 'Laveur désinfecteur thermique automatique pour endoscopes semi-rigides et instruments creux. Cycle complet 35 minutes (lavage, rinçage, désinfection thermique 93°C). Traçabilité par code-barres. Validation AER conforme EN 15883.',
    characteristics: 'Capacité : 2 paniers simultanés\nCycle complet : 35 minutes\nTempérature désinfection : 93°C / 10 min\nTraçabilité : Lecteur code-barres\nPressure tests : Automatique\nConnectivité : Ethernet (LIS)\nCertification : CE, EN 15883-1/2\nPoids : 110 kg',
  },

  // ── IMAGERIE MÉDICALE ──
  {
    categorySlug: 'imagerie',
    price: 8900.00, stock: 2, featured: 1, priority: 5,
    image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&h=400&fit=crop&q=80',
    name: 'Échographe portable Clarius HD3',
    description: 'Échographe portable sans fil haute définition. Connexion Wi-Fi 5 GHz à tablette ou smartphone iOS/Android. Sonde large bande 5–16 MHz pour imagerie multiorgane. Modes B, M, Doppler couleur et puissance. Idéal pour urgences, anesthésie locorégionale et point of care.',
    characteristics: 'Sondes : L7HD (linéaire), C3HD (convexe)\nFréquence : 5–16 MHz (linéaire)\nModes : B, M, Doppler couleur/puissance\nConnexion : Wi-Fi 802.11ac 5 GHz\nAutonomie : 60 min par charge\nStockage cloud : Clarius Cloud inclus\nCompatibilité : iOS 12+, Android 9+\nCertification : CE, FDA 510(k)',
  },
  {
    categorySlug: 'imagerie',
    price: 1890.00, stock: 5, featured: 0, priority: 3,
    image: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=600&h=400&fit=crop&q=80',
    name: 'Numériseur de radiologie DR portable',
    description: 'Capteur plan portable pour radiologie numérique directe (DR). Remplacement économique du couple écran-film. Compatible avec toute installation RX existante. Transfert image DICOM en 3 secondes via Wi-Fi. Taille 35×43 cm pour thorax, abdomen et membres.',
    characteristics: 'Format : 35×43 cm\nRésolution : 3.2 lp/mm\nProtocole : DICOM 3.0\nTransfert : Wi-Fi (3 secondes)\nConnectivité : RIS/PACS\nDurée vie scintillateur : 200 000 expositions\nAutonomie batterie : 400 expositions\nPoids : 3.9 kg',
  },
  {
    categorySlug: 'imagerie',
    price: 490.00, stock: 12, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1559757175-5b3a37c2e1b8?w=600&h=400&fit=crop&q=80',
    name: 'Dermatoscope polarisé LED',
    description: 'Dermatoscope à lumière polarisée LED pour examen des lésions cutanées. Grossissement 10× avec objectif détachable. Éclairage LED blanc 6 500 K sans ombres. Connexion smartphone via adaptateur universel. Idéal pour dépistage mélanome et suivi des nœvi.',
    characteristics: 'Grossissement : 10×\nÉclairage : LED polarisé 6 500K\nConnexion smartphone : Adaptateur universel inclus\nAutonomie : 2h (batterie rechargeable)\nCharge : USB-C\nObjectif : Détachable\nCertification : CE Classe I\nPoids : 95 g',
  },

  // ── CHIRURGIE ──
  {
    categorySlug: 'chirurgie',
    price: 6200.00, stock: 1, featured: 0, priority: 5,
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop&q=80',
    name: 'Scialytique LED Rimsa 60 000 lux',
    description: 'Plafonnier scialytique LED de bloc opératoire 60 000 lux. Monobras plafond, tête orientable 360°. Température de couleur réglable 3 800–6 500 K. Faible dégagement thermique (< 1°C). Durée de vie LED : 50 000 heures. Stérilisable, commande tactile sur la tête.',
    characteristics: 'Éclairement : 60 000 lux\nTempérature couleur : 3 800–6 500 K (réglable)\nIRC : > 96\nAngle faisceau : 10–30° (réglable)\nChaleur radiant : < 1°C\nDurée vie LED : 50 000 h\nBras : Monobras plafond avec 5 pivots\nCertification : CE, IEC 60601-2-41',
  },
  {
    categorySlug: 'chirurgie',
    price: 1250.00, stock: 7, featured: 0, priority: 3,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
    name: 'Set instruments microchirurgie Jarit',
    description: 'Set de 12 instruments de microchirurgie pour anastomoses vasculaires et nerveuses. Pinces, ciseaux, porte-aiguilles en acier inoxydable 316L. Finition titanisée anti-reflet. Stérilisable autoclave 134°C, livré avec plateau de transport perforé.',
    characteristics: 'Nb instruments : 12 pièces\nMatériau : Inox 316L titanisé\nFinition : Anti-reflet\nContenu : 4 pinces, 3 ciseaux, 3 porte-aiguilles, 2 dilatateurs\nLongueur : 15–18 cm\nSérilisation : Autoclave 134°C\nPlateaux : Perforé 20×10 cm inclus\nCertification : CE, ISO 7153-1',
  },
  {
    categorySlug: 'chirurgie',
    price: 3800.00, stock: 3, featured: 2, priority: 4,
    image: 'https://images.unsplash.com/photo-1530026405591-6e4a8e72d2b0?w=600&h=400&fit=crop&q=80',
    name: 'Bistouri électrique HF 350W',
    description: 'Unité de bistouri électrique haute fréquence 350W monopolaire et bipolaire. Modes coupe, coagulation et mixte. Détection automatique retour d\'électrode. Puissance mémorisable par chirurgien. Compatible instruments HF standards. Conformité EN 60601-2-2.',
    characteristics: 'Puissance max : 350W (monopolaire), 70W (bipolaire)\nModes : Coupe, Coag, Mixte, SprayCoag\nFréquence : 400 kHz\nDétection REM : Oui (automatique)\nMémoire : 3 chirurgiens\nConnexion électrode : SU-Barre standard\nAlarmes : Sonores et visuelles\nCertification : CE, EN 60601-2-2',
  },

  // ── CONSOMMABLES ──
  {
    categorySlug: 'consommables',
    price: 24.90, stock: 500, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1578496479914-7d4e6e97d1ab?w=600&h=400&fit=crop&q=80',
    name: 'Gants nitrile non poudrés M (100)',
    description: 'Boîte de 100 gants d\'examen nitrile non poudrés taille M. Résistants aux perforations et aux produits chimiques courants. AQL ≤ 1.0. Double certification examen médical et protection chimique. Texturés bout des doigts pour grip. Sans latex pour prévention allergie.',
    characteristics: 'Matériau : Nitrile\nPoudre : Non poudrée (Powder Free)\nTaille : M\nAQL : ≤ 1.0\nÉpaisseur : 0.12 mm\nLongueur : 240 mm\nCertifications : EN 455-1/2/3, EN 374-1\nContenu : 100 gants/boîte',
  },
  {
    categorySlug: 'consommables',
    price: 38.50, stock: 250, featured: 0, priority: 1,
    image: 'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=600&h=400&fit=crop&q=80',
    name: 'Masques chirurgicaux Type II R (50)',
    description: 'Boîte de 50 masques chirurgicaux 3 plis Type II R à haute résistance aux éclaboussures. Filtration BFE ≥ 98%. Élastiques oreilles ou à nouer au choix. Indiqués pour bloc opératoire, soins intensifs et zones à risque d\'aérosols.',
    characteristics: 'Type : II R (EN 14683)\nBFE : ≥ 98%\nRésistance éclaboussures : 120 mmHg\nPlissure : 3 plis\nAttache : Élastiques oreilles\nCouleur : Bleu\nCertification : CE, EN 14683 Type IIR\nContenu : 50 masques/boîte',
  },
  {
    categorySlug: 'consommables',
    price: 18.00, stock: 1000, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1618863099019-c6b86ffe9e6f?w=600&h=400&fit=crop&q=80',
    name: 'Seringues 10 mL Luer Lock (100)',
    description: 'Boîte de 100 seringues stériles 10 mL avec aiguille Luer Lock. Graduation 1 mL, graduation double échelle. Corps transparent pour contrôle visuel. Piston en caoutchouc siliconé sans latex. Stérile, usage unique. Conditionnement blister individuel.',
    characteristics: 'Volume : 10 mL\nGraduation : 1 mL (double échelle)\nCône : Luer Lock\nAiguille : Non incluse\nStérilisation : EO\nPiston : Caoutchouc siliconé sans latex\nCertification : CE, ISO 7886-1\nContenu : 100/boîte',
  },
  {
    categorySlug: 'consommables',
    price: 89.00, stock: 180, featured: 0, priority: 1,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop&q=80',
    name: 'Électrodes ECG adulte (100)',
    description: 'Pack 100 électrodes ECG pré-gelées adulte pour monitoring continu et ECG de repos. Adhésif hypoallergénique acrylique médical. Connecteur snap standard 4 mm. Gel conducteur hydrogel stable jusqu\'à 72h. Compatible tous moniteurs du marché.',
    characteristics: 'Diamètre : 55 mm\nConnecteur : Snap 4 mm\nGel : Hydrogel (stable 72h)\nAdhésif : Acrylique hypoallergénique\nCompatibilité : Tous moniteurs standards\nStérilisation : Non stérile\nConservation : 2 ans\nContenu : 100 électrodes/sachet',
  },
  {
    categorySlug: 'consommables',
    price: 12.50, stock: 0, featured: 0, priority: 0,
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop&q=80',
    name: 'Bandelettes glucose HC-750 (50)',
    description: 'Boîte 50 bandelettes réactives pour glucomètre HC-750. Technologie électrochimique. Résultat en 5 secondes avec 0.5 µL de sang. Stockage 2 ans à température ambiante. Non réfrigération requise. Tube hermétique avec dessiccant intégré.',
    characteristics: 'Compatible : Glucomètre HC-750\nVolume sang : 0.5 µL\nTemps mesure : 5 secondes\nConservation : 2 ans à 5–30°C\nConditionnement : Tube hermétique×dessiccant\nPlage mesure : 0.6–33.3 mmol/L\nCertification : CE, ISO 15197:2013\nContenu : 50 bandelettes',
  },
  {
    categorySlug: 'consommables',
    price: 145.00, stock: 95, featured: 0, priority: 2,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80',
    name: 'Sachets stérilisation 90×230 mm (200)',
    description: 'Boîte 200 sachets auto-soudants pour stérilisation vapeur et EO. Papier crêpé 56 g/m² + film complexe polyester/polyéthylène. Indicateur intégré changement de couleur (classe 1 ISO). Compatible soudeuse et thermosoudeuse.',
    characteristics: 'Dimensions : 90×230 mm\nMatériau : Papier 56 g/m² + PET/PE complexe\nIndicateur : Classe 1 ISO 11140-1\nStérilisation compatible : Vapeur (134°C) + EO\nOuverture : Bord festonné pour stérilité\nConservation : 5 ans en milieu propre\nCertification : CE, EN 868-5\nContenu : 200 sachets/boîte',
  },
];

const CAROUSEL = [
  {
    title: 'Diagnostic de précision',
    subtitle: 'Tensiomètres connectés, ECG portables et stéthoscopes électroniques pour des examens fiables.',
    image_url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&h=500&fit=crop&q=85',
    link_url: '/category/diagnostic',
    order_index: 1,
  },
  {
    title: 'Monitoring patient temps réel',
    subtitle: 'Équipez vos soins intensifs et blocs opératoires avec nos moniteurs multiparamétriques haute précision.',
    image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=500&fit=crop&q=85',
    link_url: '/category/monitoring',
    order_index: 2,
  },
  {
    title: 'Stérilisation certifiée classe B',
    subtitle: 'Autoclaves conformes EN 13060, soudeuses et désinfectants pour vos protocoles d\'hygiène.',
    image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=500&fit=crop&q=85',
    link_url: '/category/sterilisation',
    order_index: 3,
  },
  {
    title: 'Imagerie médicale portable',
    subtitle: 'Échographes Wi-Fi, numériseurs DR et dermatoscopes connectés pour le point of care.',
    image_url: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=500&fit=crop&q=85',
    link_url: '/category/imagerie',
    order_index: 4,
  },
];

const CONTACT_MESSAGES = [
  {
    email: 'dr.martin@cabinet-medical.fr',
    subject: 'Devis autoclave classe B 17L',
    message: 'Bonjour, je cherche un autoclave classe B pour un cabinet de chirurgie dentaire. Pouvez-vous me transmettre un devis pour un modèle 17L avec imprimante intégrée ? Merci.',
    status: 'open',
  },
  {
    email: 'achat@clinique-nord.com',
    subject: 'Commande groupée moniteurs patient',
    message: 'Suite à notre appel d\'offre, nous souhaitons commander 12 moniteurs multiparamétriques pour notre extension de réanimation. Quelles sont vos conditions pour une commande de ce volume ?',
    status: 'in_progress',
    admin_reply: 'Bonjour, nous vous avons transmis le devis groupé par email. Une remise de 12% s\'applique dès 10 unités.',
  },
  {
    email: 'infirmier.dupont@ehpad.fr',
    subject: 'Question compatibilité bandelettes',
    message: 'Nos glucomètres HC-750 acceptent-ils les bandelettes d\'autres fabricants ? Nous cherchons à réduire nos coûts de consommables.',
    status: 'closed',
    admin_reply: 'Les HC-750 sont optimisés pour les bandelettes de la référence HC-750-50. L\'utilisation d\'autres bandelettes peut affecter la précision et invalide la garantie.',
  },
  {
    email: 'bloc.op@hopital-central.fr',
    subject: 'SAV scialytique - panne partielle',
    message: 'Notre scialytique LED acheté en 2023 présente une panne sur 1/4 des LED. Nous sommes en période de garantie. Pouvez-vous nous envoyer un technicien en urgence ?',
    status: 'open',
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

async function getOrCreateLanguage(client, code) {
  const { rows } = await client.query('SELECT id FROM language WHERE code = $1', [code]);
  if (rows[0]) return rows[0].id;
  const ins = await client.query(
    "INSERT INTO language (name, code, is_rtl) VALUES ($1, $2, FALSE) RETURNING id",
    [code.toUpperCase(), code],
  );
  return ins.rows[0].id;
}

// ---------------------------------------------------------------------------
// SEED PRINCIPAL
// ---------------------------------------------------------------------------

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Début du seed PostgreSQL...\n');

    // ── 1. Langue française ──
    console.log('  📖 Langue...');
    const frLangId = await getOrCreateLanguage(client, 'fr');

    // ── 2. Utilisateurs ──
    console.log('  👤 Utilisateurs...');
    const adminHash = await bcrypt.hash('Admin123!', 12);
    const customerHash = await bcrypt.hash('Client123!', 12);

    const adminRes = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, is_admin, is_verified)
      VALUES ($1, $2, $3, $4, TRUE, TRUE)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, is_admin = TRUE
      RETURNING id
    `, ['admin@althea.medical', adminHash, 'Sophie', 'Durand']);
    const adminId = adminRes.rows[0].id;

    const customerRes = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, is_admin, is_verified)
      VALUES ($1, $2, $3, $4, FALSE, TRUE)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
      RETURNING id
    `, ['dr.martin@cabinet-medical.fr', customerHash, 'Jean', 'Martin']);
    const customerId = customerRes.rows[0].id;

    await client.query(`
      INSERT INTO users (email, password, first_name, last_name, is_admin, is_verified)
      VALUES ($1, $2, $3, $4, FALSE, TRUE)
      ON CONFLICT (email) DO NOTHING
    `, ['infirmier.dupont@ehpad.fr', customerHash, 'Marc', 'Dupont']);

    console.log(`    → Admin : admin@althea.medical / Admin123!`);
    console.log(`    → Client : dr.martin@cabinet-medical.fr / Client123!`);

    // ── 3. Catégories ──
    console.log('\n  🏷️  Catégories...');
    const categoryIds = {};
    for (const cat of CATEGORIES) {
      const { rows } = await client.query(`
        INSERT INTO category (name, slug, description, image_url, order_index)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          order_index = EXCLUDED.order_index
        RETURNING id
      `, [cat.name, cat.slug, cat.description, cat.image_url, cat.order_index]);
      categoryIds[cat.slug] = rows[0].id;
      console.log(`    → ${cat.name} (id=${rows[0].id})`);
    }

    // ── 4. Produits ──
    console.log('\n  📦 Produits...');
    const productIds = [];
    for (const prod of PRODUCTS) {
      const categoryId = categoryIds[prod.categorySlug];
      if (!categoryId) {
        console.warn(`    ⚠️  Catégorie introuvable : ${prod.categorySlug}`);
        continue;
      }

      const slug = prod.name
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { rows: existing } = await client.query(
        'SELECT id FROM product WHERE slug = $1',
        [slug],
      );

      let productId;
      if (existing[0]) {
        productId = existing[0].id;
        await client.query(`
          UPDATE product SET price=$1, stock=$2, image=$3, category_id=$4,
            featured=$5, priority=$6, updated_at=NOW()
          WHERE id=$7
        `, [prod.price, prod.stock, prod.image, categoryId, prod.featured, prod.priority, productId]);
      } else {
        const { rows } = await client.query(`
          INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [prod.price, prod.stock, prod.image, categoryId, prod.featured, prod.priority, slug]);
        productId = rows[0].id;
      }

      // Traduction française
      await client.query(`
        INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (product_id, language_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          characteristics = EXCLUDED.characteristics
      `, [productId, frLangId, prod.name, prod.description, prod.characteristics]);

      productIds.push({ id: productId, name: prod.name, stock: prod.stock });
      console.log(`    → ${prod.name} (${prod.stock > 0 ? prod.stock + ' en stock' : 'RUPTURE'})`);
    }

    // ── 5. Contenu homepage ──
    console.log('\n  🏠 Page d\'accueil...');
    const hcExists = await client.query('SELECT id FROM homepage_content LIMIT 1');
    if (hcExists.rows[0]) {
      await client.query(
        "UPDATE homepage_content SET fixed_message=$1, updated_at=NOW() WHERE id=$2",
        ['Matériel médical certifié CE — livraison express en 48h — SAV dédié pour professionnels de santé.', hcExists.rows[0].id],
      );
    } else {
      await client.query(
        "INSERT INTO homepage_content (fixed_message) VALUES ($1)",
        ['Matériel médical certifié CE — livraison express en 48h — SAV dédié pour professionnels de santé.'],
      );
    }

    // ── 6. Carrousel ──
    console.log('\n  🎠 Carrousel...');
    // On vide les slides existants pour repartir propre
    await client.query('DELETE FROM carousel');
    for (const slide of CAROUSEL) {
      await client.query(`
        INSERT INTO carousel (title, subtitle, image_url, link_url, order_index)
        VALUES ($1, $2, $3, $4, $5)
      `, [slide.title, slide.subtitle, slide.image_url, slide.link_url, slide.order_index]);
      console.log(`    → Slide ${slide.order_index} : ${slide.title}`);
    }

    // ── 7. Adresse du client ──
    console.log('\n  📍 Adresse client...');
    const addrExists = await client.query('SELECT id FROM user_address WHERE user_id = $1', [customerId]);
    if (addrExists.rows.length === 0) {
      await client.query(`
        INSERT INTO user_address
          (user_id, label, type, first_name, last_name, address1, city, postal_code, region, country, phone, email, is_default)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE)
      `, [customerId, 'Cabinet médical', 'billing', 'Jean', 'Martin',
        '12 rue de la République', 'Lyon', '69001', 'Auvergne-Rhône-Alpes', 'France',
        '+33 4 72 00 00 00', 'dr.martin@cabinet-medical.fr']);
    }

    // ── 8. Commandes sample ──
    console.log('\n  🛒 Commandes sample...');
    const availableProducts = productIds.filter((p) => p.stock > 0);

    const sampleOrders = [
      {
        userId: customerId,
        status: 'Livrée',
        items: [
          { idx: 0, qty: 1 },
          { idx: 2, qty: 2 },
        ],
        address: { firstName: 'Jean', lastName: 'Martin', address1: '12 rue de la République', city: 'Lyon', postalCode: '69001', country: 'France' },
        payment: 'Carte **** 4242',
        daysAgo: 45,
      },
      {
        userId: customerId,
        status: 'Expédiée',
        items: [
          { idx: 5, qty: 1 },
          { idx: 6, qty: 3 },
        ],
        address: { firstName: 'Jean', lastName: 'Martin', address1: '12 rue de la République', city: 'Lyon', postalCode: '69001', country: 'France' },
        payment: 'Carte **** 1234',
        daysAgo: 10,
      },
      {
        userId: customerId,
        status: 'En préparation',
        items: [
          { idx: 19, qty: 2 },
          { idx: 20, qty: 1 },
          { idx: 22, qty: 5 },
        ],
        address: { firstName: 'Jean', lastName: 'Martin', address1: '12 rue de la République', city: 'Lyon', postalCode: '69001', country: 'France' },
        payment: 'Carte **** 5678',
        daysAgo: 1,
      },
    ];

    for (const order of sampleOrders) {
      const items = order.items
        .map((i) => availableProducts[i.idx % availableProducts.length])
        .filter(Boolean);

      if (items.length === 0) continue;

      // Calculer le total à partir des prix en BDD
      const itemPrices = await Promise.all(
        items.map((p) => client.query('SELECT price FROM product WHERE id=$1', [p.id])),
      );

      let total = 0;
      const validatedItems = items.map((p, i) => {
        const price = Number(itemPrices[i].rows[0]?.price || 0);
        const qty = order.items[i % order.items.length]?.qty || 1;
        total += price * qty;
        return { id: p.id, qty, price };
      });

      const createdAt = new Date(Date.now() - order.daysAgo * 86400000);

      const ordRes = await client.query(`
        INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        RETURNING id
      `, [order.userId, order.status, total.toFixed(2), JSON.stringify(order.address), order.payment, createdAt]);

      const orderId = ordRes.rows[0].id;

      for (const item of validatedItems) {
        const lineTotal = (item.price * item.qty).toFixed(2);
        await client.query(`
          INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5)
        `, [orderId, item.id, item.qty, item.price, lineTotal]);
      }

      // Payment transaction simulée
      await client.query(`
        INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
        VALUES ($1, 'simulated', 'completed', $2, $3)
      `, [orderId, total.toFixed(2), `SIM-${orderId}-SEED`]);

      console.log(`    → Commande #${orderId} — ${order.status} — ${total.toFixed(2)} €`);
    }

    // ── 9. Messages de contact ──
    console.log('\n  💬 Messages de contact...');
    for (const msg of CONTACT_MESSAGES) {
      await client.query(`
        INSERT INTO contact_message (email, subject, message, status, admin_reply)
        VALUES ($1, $2, $3, $4, $5)
      `, [msg.email, msg.subject, msg.message, msg.status, msg.admin_reply || null]);
    }
    console.log(`    → ${CONTACT_MESSAGES.length} messages insérés`);

    await client.query('COMMIT');

    console.log('\n✅ Seed terminé avec succès !\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Comptes créés :');
    console.log('  Admin   → admin@althea.medical     / Admin123!');
    console.log('  Client  → dr.martin@cabinet-medical.fr / Client123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ${CATEGORIES.length} catégories`);
    console.log(`  ${productIds.length} produits (${productIds.filter(p => p.stock === 0).length} en rupture)`);
    console.log(`  ${CAROUSEL.length} slides carrousel`);
    console.log(`  ${CONTACT_MESSAGES.length} messages de contact`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erreur durant le seed :', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
