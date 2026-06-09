-- =============================================================================
-- 006_seed_data.sql — Althea Systems
-- Données de démonstration : utilisateurs, catégories, produits, carrousel,
-- messages de contact, commandes sample.
--
-- Exécution :
--   psql "$DATABASE_URL" -f database/006_seed_data.sql
--
-- Comptes créés :
--   admin@althea.medical          / Admin123!
--   dr.martin@cabinet-medical.fr  / Client123!
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. LANGUE
-- ---------------------------------------------------------------------------
INSERT INTO language (name, code, is_rtl)
VALUES ('Français', 'fr', FALSE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. UTILISATEURS
-- ---------------------------------------------------------------------------
INSERT INTO users (email, password, first_name, last_name, is_admin, is_verified)
VALUES
  ('admin@althea.medical',
   '$2b$12$CfPC0A5kr3/ZsbFCh44lmeMy.eulqJbu5T6tiEGyj6LHc79cHSJ4m',
   'Sophie', 'Durand', TRUE, TRUE),
  ('dr.martin@cabinet-medical.fr',
   '$2b$12$sFBTHISSf38eWAUrpp.Ki.h3/H/hZMUbqkh/Dqgo0BXTXuEXGzIxu',
   'Jean', 'Martin', FALSE, TRUE),
  ('infirmier.dupont@ehpad.fr',
   '$2b$12$sFBTHISSf38eWAUrpp.Ki.h3/H/hZMUbqkh/Dqgo0BXTXuEXGzIxu',
   'Marc', 'Dupont', FALSE, TRUE)
ON CONFLICT (email) DO UPDATE
  SET password  = EXCLUDED.password,
      is_admin  = EXCLUDED.is_admin,
      is_verified = TRUE;

-- ---------------------------------------------------------------------------
-- 3. CATÉGORIES
-- ---------------------------------------------------------------------------
INSERT INTO category (name, slug, description, image_url, order_index)
VALUES
  ('Diagnostic',
   'diagnostic',
   'Tensiomètres, stéthoscopes, ECG portables et dispositifs de mesure pour examens courants en cabinet.',
   'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&h=500&fit=crop&q=80',
   1),
  ('Monitoring',
   'monitoring',
   'Moniteurs multiparamétriques, oxymètres et holters pour le suivi continu des patients en milieu hospitalier.',
   'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=500&fit=crop&q=80',
   2),
  ('Stérilisation',
   'sterilisation',
   'Autoclaves, soudeuses et solutions de traçabilité pour les protocoles de stérilisation certifiés.',
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop&q=80',
   3),
  ('Imagerie médicale',
   'imagerie',
   'Échographes portables, numériseurs DR et dermatoscopes connectés pour le point of care.',
   'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=800&h=500&fit=crop&q=80',
   4),
  ('Chirurgie',
   'chirurgie',
   'Instruments chirurgicaux, scialytiques et bistouris électriques pour les interventions.',
   'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop&q=80',
   5),
  ('Consommables',
   'consommables',
   'Gants, masques, seringues et consommables médicaux certifiés pour l''usage quotidien.',
   'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=800&h=500&fit=crop&q=80',
   6)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      image_url   = EXCLUDED.image_url,
      order_index = EXCLUDED.order_index;

-- ---------------------------------------------------------------------------
-- 4. PRODUITS  (avec traductions FR)
-- Pour chaque produit on fait un INSERT … RETURNING id puis la traduction.
-- On passe par une CTE pour garder le script en pur SQL.
-- ---------------------------------------------------------------------------

-- ── DIAGNOSTIC ──────────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 189.90, 42,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80',
    c.id, 3, 5, 'tensiometre-connecte-pro'
  FROM category c WHERE c.slug = 'diagnostic'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Tensiomètre connecté Pro',
  'Tensiomètre brassard électronique de précision clinique. Mesure simultanée de la pression artérielle et de la fréquence cardiaque avec technologie AFIB. Connectivité Bluetooth intégrée pour synchronisation avec applications santé. Mémoire 120 mesures. Idéal pour cabinet médical et suivi à domicile.',
  'Précision : ±3 mmHg' || chr(10) || 'Taille brassard : 22–42 cm' || chr(10) || 'Alimentation : 4 piles AA ou adaptateur secteur' || chr(10) || 'Connectivité : Bluetooth 4.2' || chr(10) || 'Mémoire : 120 mesures' || chr(10) || 'Détection AFIB : Oui' || chr(10) || 'Certification : CE, ISO 81060-2'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 299.00, 18,
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop&q=80',
    c.id, 0, 3, 'stethoscope-electronique-littmann'
  FROM category c WHERE c.slug = 'diagnostic'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Stéthoscope électronique 3M Littmann',
  'Stéthoscope électronique de référence mondiale pour l''auscultation cardiaque, pulmonaire et vasculaire. Amplification sonore jusqu''à 24× avec réduction des bruits ambiants. Mode électronique et acoustique. Compatible avec systèmes d''enregistrement audio pour télémédecine.',
  'Amplification : 24×' || chr(10) || 'Fréquences : 20 Hz–20 kHz' || chr(10) || 'Bluetooth : 4.0' || chr(10) || 'Autonomie : 100h' || chr(10) || 'Longueur tube : 69 cm' || chr(10) || 'Certification : ISO 13485'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 1290.00, 6,
    'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=600&h=400&fit=crop&q=80',
    c.id, 2, 4, 'ecg-12-derivations-portable'
  FROM category c WHERE c.slug = 'diagnostic'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'ECG 12 dérivations portable',
  'Électrocardiographe 12 dérivations léger et portable pour cabinet et urgences. Acquisition en 10 secondes, interprétation automatique avec algorithme clinique certifié. Impression thermique intégrée. Stockage 500 ECG avec export PDF et HL7. Interface tactile couleur.',
  'Dérivations : 12 (I, II, III, aVR, aVL, aVF, V1–V6)' || chr(10) || 'Écran : TFT 7" tactile' || chr(10) || 'Imprimante : Thermique 80 mm' || chr(10) || 'Mémoire : 500 ECG' || chr(10) || 'Interprétation auto : Oui' || chr(10) || 'Connectivité : USB, Wi-Fi' || chr(10) || 'Autonomie batterie : 4h' || chr(10) || 'Poids : 2.1 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 420.00, 24,
    'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'otoscope-led-professionnel'
  FROM category c WHERE c.slug = 'diagnostic'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Otoscope LED professionnel',
  'Otoscope à fibre optique LED pour examen ORL de haute précision. Lumière froide LED sans ombres, grossissement 3×. Kit complet avec ophthalmoscope et spécula jetables. Manche rechargeable lithium-ion universel.',
  'Éclairage : LED 6 500K' || chr(10) || 'Grossissement : 3×' || chr(10) || 'Spécula inclus : 2.5 / 3 / 4 / 5 mm' || chr(10) || 'Manche : Rechargeable Li-ion 3.7V' || chr(10) || 'Charge : USB-C' || chr(10) || 'Certification : CE Classe I'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 85.00, 120,
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop&q=80',
    c.id, 0, 1, 'glucometre-accu-chek-guide'
  FROM category c WHERE c.slug = 'diagnostic'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Glucomètre ACCU-CHEK Guide',
  'Glucomètre connecté pour auto-surveillance glycémique. Résultats en 4 secondes. Application mobile mySugr incluse. Pas de code de calibration. Compatible bandelettes ACCU-CHEK Guide.',
  'Volume sang : 0.6 µL' || chr(10) || 'Temps mesure : 4 secondes' || chr(10) || 'Plage : 0.6–33.3 mmol/L' || chr(10) || 'Mémoire : 720 résultats' || chr(10) || 'Bluetooth : Oui' || chr(10) || 'Alimentation : 2 piles CR2032'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ── MONITORING ───────────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 3200.00, 4,
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop&q=80',
    c.id, 5, 5, 'moniteur-multiparametrique-patient'
  FROM category c WHERE c.slug = 'monitoring'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Moniteur multiparamétrique patient',
  'Moniteur patient 5 paramètres pour soins intensifs et bloc opératoire. Écran tactile TFT 12" haute résolution. Mesure simultanée ECG, SpO2, NIBP, température et fréquence respiratoire. Alarmes configurables intelligentes. Interface HL7 pour intégration DPI.',
  'Écran : TFT 12" 1024×768 tactile' || chr(10) || 'Paramètres : ECG, SpO2, NIBP, Temp, FR' || chr(10) || 'Alarmes : 30 alarmes configurables' || chr(10) || 'Mémoire : 96h de tendances' || chr(10) || 'Connectivité : HL7, Wi-Fi, Ethernet' || chr(10) || 'Poids : 4.5 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 189.00, 67,
    'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop&q=80',
    c.id, 4, 4, 'oxymetre-de-pouls-doigt'
  FROM category c WHERE c.slug = 'monitoring'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Oxymètre de pouls doigt',
  'Oxymètre de pouls doigt à affichage OLED double couleur. Mesure SpO2, fréquence cardiaque et index de perfusion en 6 secondes. Alarme sonore et visuelle. Idéal pour suivi ambulatoire, sport de haute altitude et patients BPCO.',
  'SpO2 : 70–99% (±2%)' || chr(10) || 'Fréquence cardiaque : 20–250 bpm' || chr(10) || 'Temps réponse : 6 secondes' || chr(10) || 'Écran : OLED 4 orientations' || chr(10) || 'Alarme : Oui (SpO2 < 90%)' || chr(10) || 'Alimentation : 2 piles AAA' || chr(10) || 'Autonomie : 30h' || chr(10) || 'Poids : 45 g'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 2100.00, 3,
    'https://images.unsplash.com/photo-1559757175-5b3a37c2e1b8?w=600&h=400&fit=crop&q=80',
    c.id, 0, 3, 'holter-ecg-24h-mortara'
  FROM category c WHERE c.slug = 'monitoring'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Holter ECG 24h enregistreur Mortara',
  'Enregistreur Holter ECG 3 canaux pour analyse cardiaque ambulatoire sur 24 à 48 heures. Logiciel d''analyse avec détection automatique des arythmies, extrasystoles et fibrillations. Export PDF et intégration HL7.',
  'Canaux : 3 (configurable 12 dérivations)' || chr(10) || 'Durée enregistrement : 24–48h' || chr(10) || 'Mémoire : 512 Mo flash' || chr(10) || 'Fréquence échantillonnage : 1024 Hz' || chr(10) || 'Algorithmes : AECG, arythmie, ST' || chr(10) || 'Poids : 68 g' || chr(10) || 'Certification : CE, IEC 60601-2-47'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 145.00, 89,
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop&q=80',
    c.id, 0, 1, 'thermometre-infrarouge-frontal'
  FROM category c WHERE c.slug = 'monitoring'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Thermomètre infrarouge frontal',
  'Thermomètre infrarouge sans contact pour mesure frontale en 1 seconde. Précision médicale ±0.2°C. Double mode front/objet. Mémoire 32 mesures. Alarme fièvre visuelle et sonore.',
  'Précision : ±0.2°C' || chr(10) || 'Plage : 34.0–42.9°C' || chr(10) || 'Temps mesure : 1 seconde' || chr(10) || 'Distance mesure : 1–5 cm' || chr(10) || 'Mémoire : 32 mesures' || chr(10) || 'Alarme fièvre : 37.5°C (réglable)' || chr(10) || 'Certification : CE Classe IIa'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ── STÉRILISATION ────────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 4800.00, 2,
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop&q=80',
    c.id, 0, 5, 'autoclave-vapeur-classe-b-23l'
  FROM category c WHERE c.slug = 'sterilisation'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Autoclave vapeur classe B 23L',
  'Autoclave à vapeur saturée classe B 23 litres conforme EN 13060. Cycles pré-vide fractionnés pour stérilisation de charges creuses et poreuses. 3 programmes automatiques. Imprimante intégrée pour traçabilité. Connexion USB pour export des cycles.',
  'Volume chambre : 23 litres' || chr(10) || 'Classe : B (EN 13060)' || chr(10) || 'Température max : 135°C' || chr(10) || 'Pression max : 2.1 bar' || chr(10) || 'Cycles : 134°C 4min, 121°C 20min, Prion' || chr(10) || 'Imprimante : Thermique intégrée' || chr(10) || 'Connectivité : USB, RS232' || chr(10) || 'Poids : 64 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 890.00, 8,
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop&q=80',
    c.id, 0, 3, 'soudeuse-sachets-sealtech-pro'
  FROM category c WHERE c.slug = 'sterilisation'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Soudeuse à sachets SealTech Pro',
  'Soudeuse pour sachets de stérilisation avec contrôle continu de la qualité de soudure. Largeur de soudure 10 mm. Vitesse réglable 0.5–8 m/min. Conformité EN 868-8.',
  'Largeur soudure : 10 mm' || chr(10) || 'Vitesse : 0.5–8 m/min (réglable)' || chr(10) || 'Température : 140–250°C (réglable)' || chr(10) || 'Bobines compatibles : 50–400 mm' || chr(10) || 'Contrôle soudure : Continu automatique' || chr(10) || 'Certification : CE, EN 868-8' || chr(10) || 'Poids : 18 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 320.00, 25,
    'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'desinfectant-surfaces-ld12-5l'
  FROM category c WHERE c.slug = 'sterilisation'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Désinfectant surfaces LD12 5L',
  'Désinfectant de surfaces et petit matériel médical à base d''ammoniums quaternaires. Spectre bactéricide, fongicide, lévuricide et virucide (EN 14476). Prêt à l''emploi, sans rinçage.',
  'Volume : 5 litres' || chr(10) || 'Spectre : Bactéricide + Fongicide + Virucide' || chr(10) || 'Normes : EN 1276, EN 13727, EN 14476' || chr(10) || 'Temps contact : 5 min' || chr(10) || 'Base active : Ammoniums quaternaires 0.5%' || chr(10) || 'Conservation : 3 ans'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 2600.00, 3,
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop&q=80',
    c.id, 0, 4, 'laveur-desinfecteur-automatique'
  FROM category c WHERE c.slug = 'sterilisation'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Laveur désinfecteur automatique',
  'Laveur désinfecteur thermique automatique pour endoscopes semi-rigides et instruments creux. Cycle complet 35 minutes. Traçabilité par code-barres. Validation AER conforme EN 15883.',
  'Capacité : 2 paniers simultanés' || chr(10) || 'Cycle complet : 35 minutes' || chr(10) || 'Température désinfection : 93°C / 10 min' || chr(10) || 'Traçabilité : Lecteur code-barres' || chr(10) || 'Connectivité : Ethernet (LIS)' || chr(10) || 'Certification : CE, EN 15883-1/2' || chr(10) || 'Poids : 110 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ── IMAGERIE MÉDICALE ────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 8900.00, 2,
    'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&h=400&fit=crop&q=80',
    c.id, 1, 5, 'echographe-portable-clarius-hd3'
  FROM category c WHERE c.slug = 'imagerie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Échographe portable Clarius HD3',
  'Échographe portable sans fil haute définition. Connexion Wi-Fi 5 GHz à tablette ou smartphone iOS/Android. Sonde large bande 5–16 MHz pour imagerie multiorgane. Modes B, M, Doppler couleur et puissance. Idéal pour urgences et anesthésie locorégionale.',
  'Sondes : L7HD (linéaire), C3HD (convexe)' || chr(10) || 'Fréquence : 5–16 MHz (linéaire)' || chr(10) || 'Modes : B, M, Doppler couleur/puissance' || chr(10) || 'Connexion : Wi-Fi 802.11ac 5 GHz' || chr(10) || 'Autonomie : 60 min par charge' || chr(10) || 'Compatibilité : iOS 12+, Android 9+' || chr(10) || 'Certification : CE, FDA 510(k)'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 1890.00, 5,
    'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d9?w=600&h=400&fit=crop&q=80',
    c.id, 0, 3, 'numeriseur-radiologie-dr-portable'
  FROM category c WHERE c.slug = 'imagerie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Numériseur de radiologie DR portable',
  'Capteur plan portable pour radiologie numérique directe. Compatible avec toute installation RX existante. Transfert image DICOM en 3 secondes via Wi-Fi. Format 35×43 cm pour thorax, abdomen et membres.',
  'Format : 35×43 cm' || chr(10) || 'Résolution : 3.2 lp/mm' || chr(10) || 'Protocole : DICOM 3.0' || chr(10) || 'Transfert : Wi-Fi (3 secondes)' || chr(10) || 'Connectivité : RIS/PACS' || chr(10) || 'Durée vie scintillateur : 200 000 expositions' || chr(10) || 'Poids : 3.9 kg'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 490.00, 12,
    'https://images.unsplash.com/photo-1559757175-5b3a37c2e1b8?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'dermatoscope-polarise-led'
  FROM category c WHERE c.slug = 'imagerie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Dermatoscope polarisé LED',
  'Dermatoscope à lumière polarisée LED pour examen des lésions cutanées. Grossissement 10× avec objectif détachable. Connexion smartphone via adaptateur universel. Idéal pour dépistage mélanome et suivi des nœvi.',
  'Grossissement : 10×' || chr(10) || 'Éclairage : LED polarisé 6 500K' || chr(10) || 'Connexion smartphone : Adaptateur universel inclus' || chr(10) || 'Autonomie : 2h (batterie rechargeable)' || chr(10) || 'Charge : USB-C' || chr(10) || 'Certification : CE Classe I' || chr(10) || 'Poids : 95 g'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ── CHIRURGIE ────────────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 6200.00, 1,
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop&q=80',
    c.id, 0, 5, 'scialytique-led-rimsa-60000-lux'
  FROM category c WHERE c.slug = 'chirurgie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Scialytique LED Rimsa 60 000 lux',
  'Plafonnier scialytique LED de bloc opératoire 60 000 lux. Monobras plafond, tête orientable 360°. Température de couleur réglable 3 800–6 500 K. Faible dégagement thermique. Durée de vie LED : 50 000 heures.',
  'Éclairement : 60 000 lux' || chr(10) || 'Température couleur : 3 800–6 500 K (réglable)' || chr(10) || 'IRC : > 96' || chr(10) || 'Chaleur radiant : < 1°C' || chr(10) || 'Durée vie LED : 50 000 h' || chr(10) || 'Certification : CE, IEC 60601-2-41'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 1250.00, 7,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&q=80',
    c.id, 0, 3, 'set-instruments-microchirurgie-jarit'
  FROM category c WHERE c.slug = 'chirurgie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Set instruments microchirurgie Jarit',
  'Set de 12 instruments de microchirurgie pour anastomoses vasculaires et nerveuses. Acier inoxydable 316L titanisé anti-reflet. Stérilisable autoclave 134°C, livré avec plateau de transport perforé.',
  'Nb instruments : 12 pièces' || chr(10) || 'Matériau : Inox 316L titanisé' || chr(10) || 'Contenu : 4 pinces, 3 ciseaux, 3 porte-aiguilles, 2 dilatateurs' || chr(10) || 'Longueur : 15–18 cm' || chr(10) || 'Stérilisation : Autoclave 134°C' || chr(10) || 'Certification : CE, ISO 7153-1'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 3800.00, 3,
    'https://images.unsplash.com/photo-1530026405591-6e4a8e72d2b0?w=600&h=400&fit=crop&q=80',
    c.id, 2, 4, 'bistouri-electrique-hf-350w'
  FROM category c WHERE c.slug = 'chirurgie'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Bistouri électrique HF 350W',
  'Unité de bistouri électrique haute fréquence 350W monopolaire et bipolaire. Modes coupe, coagulation et mixte. Détection automatique retour d''électrode. Puissance mémorisable par chirurgien.',
  'Puissance max : 350W (monopolaire), 70W (bipolaire)' || chr(10) || 'Modes : Coupe, Coag, Mixte, SprayCoag' || chr(10) || 'Fréquence : 400 kHz' || chr(10) || 'Détection REM : Oui (automatique)' || chr(10) || 'Mémoire : 3 chirurgiens' || chr(10) || 'Certification : CE, EN 60601-2-2'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ── CONSOMMABLES ─────────────────────────────────────────────────────────────

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 24.90, 500,
    'https://images.unsplash.com/photo-1578496479914-7d4e6e97d1ab?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'gants-nitrile-non-poudres-m-100'
  FROM category c WHERE c.slug = 'consommables'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Gants nitrile non poudrés M (100)',
  'Boîte de 100 gants d''examen nitrile non poudrés taille M. Résistants aux perforations et aux produits chimiques courants. AQL ≤ 1.0. Sans latex pour prévention allergie.',
  'Matériau : Nitrile' || chr(10) || 'Poudre : Non poudrée' || chr(10) || 'Taille : M' || chr(10) || 'AQL : ≤ 1.0' || chr(10) || 'Épaisseur : 0.12 mm' || chr(10) || 'Longueur : 240 mm' || chr(10) || 'Certifications : EN 455-1/2/3, EN 374-1' || chr(10) || 'Contenu : 100 gants/boîte'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 38.50, 250,
    'https://images.unsplash.com/photo-1583483804173-a5b31a5a3e07?w=600&h=400&fit=crop&q=80',
    c.id, 0, 1, 'masques-chirurgicaux-type-iir-50'
  FROM category c WHERE c.slug = 'consommables'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Masques chirurgicaux Type II R (50)',
  'Boîte de 50 masques chirurgicaux 3 plis Type II R à haute résistance aux éclaboussures. Filtration BFE ≥ 98%. Indiqués pour bloc opératoire, soins intensifs et zones à risque d''aérosols.',
  'Type : II R (EN 14683)' || chr(10) || 'BFE : ≥ 98%' || chr(10) || 'Résistance éclaboussures : 120 mmHg' || chr(10) || 'Plissure : 3 plis' || chr(10) || 'Couleur : Bleu' || chr(10) || 'Certification : CE, EN 14683 Type IIR' || chr(10) || 'Contenu : 50 masques/boîte'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 18.00, 1000,
    'https://images.unsplash.com/photo-1618863099019-c6b86ffe9e6f?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'seringues-10ml-luer-lock-100'
  FROM category c WHERE c.slug = 'consommables'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Seringues 10 mL Luer Lock (100)',
  'Boîte de 100 seringues stériles 10 mL avec aiguille Luer Lock. Graduation 1 mL double échelle. Corps transparent pour contrôle visuel. Piston en caoutchouc siliconé sans latex. Stérile, usage unique.',
  'Volume : 10 mL' || chr(10) || 'Graduation : 1 mL (double échelle)' || chr(10) || 'Cône : Luer Lock' || chr(10) || 'Stérilisation : EO' || chr(10) || 'Piston : Caoutchouc siliconé sans latex' || chr(10) || 'Certification : CE, ISO 7886-1' || chr(10) || 'Contenu : 100/boîte'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 89.00, 180,
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop&q=80',
    c.id, 0, 1, 'electrodes-ecg-adulte-100'
  FROM category c WHERE c.slug = 'consommables'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Électrodes ECG adulte (100)',
  'Pack 100 électrodes ECG pré-gelées adulte pour monitoring continu et ECG de repos. Adhésif hypoallergénique acrylique médical. Gel conducteur hydrogel stable jusqu''à 72h. Compatible tous moniteurs du marché.',
  'Diamètre : 55 mm' || chr(10) || 'Connecteur : Snap 4 mm' || chr(10) || 'Gel : Hydrogel (stable 72h)' || chr(10) || 'Adhésif : Acrylique hypoallergénique' || chr(10) || 'Conservation : 2 ans' || chr(10) || 'Contenu : 100 électrodes/sachet'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

WITH p AS (
  INSERT INTO product (price, stock, image, category_id, featured, priority, slug)
  SELECT 145.00, 95,
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80',
    c.id, 0, 2, 'sachets-sterilisation-90x230-200'
  FROM category c WHERE c.slug = 'consommables'
  ON CONFLICT (slug) DO UPDATE
    SET price=EXCLUDED.price, stock=EXCLUDED.stock, image=EXCLUDED.image,
        featured=EXCLUDED.featured, priority=EXCLUDED.priority
  RETURNING id
)
INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
SELECT p.id, l.id,
  'Sachets stérilisation 90×230 mm (200)',
  'Boîte 200 sachets auto-soudants pour stérilisation vapeur et EO. Papier crêpé 56 g/m² + film complexe polyester/polyéthylène. Indicateur intégré changement de couleur classe 1 ISO.',
  'Dimensions : 90×230 mm' || chr(10) || 'Matériau : Papier 56 g/m² + PET/PE complexe' || chr(10) || 'Indicateur : Classe 1 ISO 11140-1' || chr(10) || 'Stérilisation compatible : Vapeur (134°C) + EO' || chr(10) || 'Conservation : 5 ans' || chr(10) || 'Certification : CE, EN 868-5' || chr(10) || 'Contenu : 200 sachets/boîte'
FROM p, language l WHERE l.code = 'fr'
ON CONFLICT (product_id, language_id) DO UPDATE
  SET name=EXCLUDED.name, description=EXCLUDED.description, characteristics=EXCLUDED.characteristics;

-- ---------------------------------------------------------------------------
-- 5. CONTENU PAGE D'ACCUEIL
-- ---------------------------------------------------------------------------
INSERT INTO homepage_content (fixed_message)
VALUES ('Matériel médical certifié CE — livraison express en 48h — SAV dédié pour professionnels de santé.')
ON CONFLICT DO NOTHING;

UPDATE homepage_content
SET fixed_message = 'Matériel médical certifié CE — livraison express en 48h — SAV dédié pour professionnels de santé.',
    updated_at = NOW()
WHERE fixed_message IS DISTINCT FROM 'Matériel médical certifié CE — livraison express en 48h — SAV dédié pour professionnels de santé.';

-- ---------------------------------------------------------------------------
-- 6. CARROUSEL
-- ---------------------------------------------------------------------------
DELETE FROM carousel;

INSERT INTO carousel (title, subtitle, image_url, link_url, order_index) VALUES
  ('Diagnostic de précision',
   'Tensiomètres connectés, ECG portables et stéthoscopes électroniques pour des examens fiables.',
   'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&h=500&fit=crop&q=85',
   '/category/diagnostic', 1),
  ('Monitoring patient temps réel',
   'Équipez vos soins intensifs et blocs opératoires avec nos moniteurs multiparamétriques haute précision.',
   'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=500&fit=crop&q=85',
   '/category/monitoring', 2),
  ('Stérilisation certifiée classe B',
   'Autoclaves conformes EN 13060, soudeuses et désinfectants pour vos protocoles d''hygiène.',
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=500&fit=crop&q=85',
   '/category/sterilisation', 3),
  ('Imagerie médicale portable',
   'Échographes Wi-Fi, numériseurs DR et dermatoscopes connectés pour le point of care.',
   'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=500&fit=crop&q=85',
   '/category/imagerie', 4);

-- ---------------------------------------------------------------------------
-- 7. ADRESSE CLIENT
-- ---------------------------------------------------------------------------
INSERT INTO user_address
  (user_id, label, type, first_name, last_name, address1, city, postal_code,
   region, country, phone, email, is_default)
SELECT
  u.id, 'Cabinet médical', 'billing', 'Jean', 'Martin',
  '12 rue de la République', 'Lyon', '69001',
  'Auvergne-Rhône-Alpes', 'France',
  '+33 4 72 00 00 00', 'dr.martin@cabinet-medical.fr', TRUE
FROM users u WHERE u.email = 'dr.martin@cabinet-medical.fr'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. COMMANDES SAMPLE
-- ---------------------------------------------------------------------------

-- Commande 1 : livrée il y a 45 jours
WITH ord AS (
  INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
  SELECT
    u.id,
    'Livrée',
    (
      SELECT COALESCE(SUM(p.price * oi.qty), 0)
      FROM (VALUES
        ((SELECT id FROM product WHERE slug = 'tensiometre-connecte-pro'),   1),
        ((SELECT id FROM product WHERE slug = 'ecg-12-derivations-portable'), 1)
      ) AS oi(pid, qty)
      JOIN product p ON p.id = oi.pid
    ),
    '{"firstName":"Jean","lastName":"Martin","address1":"12 rue de la République","city":"Lyon","postalCode":"69001","country":"France"}'::jsonb,
    'Carte **** 4242',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '40 days'
  FROM users u WHERE u.email = 'dr.martin@cabinet-medical.fr'
  RETURNING id
),
t AS (
  INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
  SELECT ord.id, 'simulated', 'completed',
    (SELECT COALESCE(SUM(p.price), 0) FROM product p
     WHERE p.slug IN ('tensiometre-connecte-pro','ecg-12-derivations-portable')),
    'SIM-ORD1-SEED'
  FROM ord
)
INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total)
SELECT ord.id, p.id, oi.qty, p.price, p.price * oi.qty
FROM ord,
  (VALUES
    ((SELECT id FROM product WHERE slug = 'tensiometre-connecte-pro'),   1),
    ((SELECT id FROM product WHERE slug = 'ecg-12-derivations-portable'), 1)
  ) AS oi(pid, qty)
JOIN product p ON p.id = oi.pid;

-- Commande 2 : expédiée il y a 10 jours
WITH ord AS (
  INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
  SELECT
    u.id,
    'Expédiée',
    (
      SELECT COALESCE(SUM(p.price * oi.qty), 0)
      FROM (VALUES
        ((SELECT id FROM product WHERE slug = 'moniteur-multiparametrique-patient'), 1),
        ((SELECT id FROM product WHERE slug = 'oxymetre-de-pouls-doigt'),            3)
      ) AS oi(pid, qty)
      JOIN product p ON p.id = oi.pid
    ),
    '{"firstName":"Jean","lastName":"Martin","address1":"12 rue de la République","city":"Lyon","postalCode":"69001","country":"France"}'::jsonb,
    'Carte **** 1234',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days'
  FROM users u WHERE u.email = 'dr.martin@cabinet-medical.fr'
  RETURNING id
),
t AS (
  INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
  SELECT ord.id, 'simulated', 'completed', 3767.00, 'SIM-ORD2-SEED'
  FROM ord
)
INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total)
SELECT ord.id, p.id, oi.qty, p.price, p.price * oi.qty
FROM ord,
  (VALUES
    ((SELECT id FROM product WHERE slug = 'moniteur-multiparametrique-patient'), 1),
    ((SELECT id FROM product WHERE slug = 'oxymetre-de-pouls-doigt'),            3)
  ) AS oi(pid, qty)
JOIN product p ON p.id = oi.pid;

-- Commande 3 : en préparation (hier)
WITH ord AS (
  INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
  SELECT
    u.id,
    'En préparation',
    (
      SELECT COALESCE(SUM(p.price * oi.qty), 0)
      FROM (VALUES
        ((SELECT id FROM product WHERE slug = 'gants-nitrile-non-poudres-m-100'),    2),
        ((SELECT id FROM product WHERE slug = 'masques-chirurgicaux-type-iir-50'),    1),
        ((SELECT id FROM product WHERE slug = 'seringues-10ml-luer-lock-100'),        5)
      ) AS oi(pid, qty)
      JOIN product p ON p.id = oi.pid
    ),
    '{"firstName":"Marc","lastName":"Dupont","address1":"18 avenue des Soins","city":"Paris","postalCode":"75015","country":"France"}'::jsonb,
    'Carte **** 5678',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  FROM users u WHERE u.email = 'infirmier.dupont@ehpad.fr'
  RETURNING id
),
t AS (
  INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
  SELECT ord.id, 'simulated', 'pending', 178.30, 'SIM-ORD3-SEED'
  FROM ord
)
INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total)
SELECT ord.id, p.id, oi.qty, p.price, p.price * oi.qty
FROM ord,
  (VALUES
    ((SELECT id FROM product WHERE slug = 'gants-nitrile-non-poudres-m-100'),    2),
    ((SELECT id FROM product WHERE slug = 'masques-chirurgicaux-type-iir-50'),    1),
    ((SELECT id FROM product WHERE slug = 'seringues-10ml-luer-lock-100'),        5)
  ) AS oi(pid, qty)
JOIN product p ON p.id = oi.pid;

-- Commande 4 : confirmée il y a 3 jours
WITH ord AS (
  INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
  SELECT
    u.id,
    'Confirmée',
    (
      SELECT COALESCE(SUM(p.price * oi.qty), 0)
      FROM (VALUES
        ((SELECT id FROM product WHERE slug = 'bistouri-electrique-hf-350w'),    1),
        ((SELECT id FROM product WHERE slug = 'set-instruments-microchirurgie-jarit'), 2)
      ) AS oi(pid, qty)
      JOIN product p ON p.id = oi.pid
    ),
    '{"firstName":"Jean","lastName":"Martin","address1":"12 rue de la République","city":"Lyon","postalCode":"69001","country":"France"}'::jsonb,
    'Virement bancaire',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  FROM users u WHERE u.email = 'dr.martin@cabinet-medical.fr'
  RETURNING id
),
t AS (
  INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
  SELECT ord.id, 'wire', 'completed', 6300.00, 'VIR-ORD4-SEED'
  FROM ord
)
INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total)
SELECT ord.id, p.id, oi.qty, p.price, p.price * oi.qty
FROM ord,
  (VALUES
    ((SELECT id FROM product WHERE slug = 'bistouri-electrique-hf-350w'),         1),
    ((SELECT id FROM product WHERE slug = 'set-instruments-microchirurgie-jarit'), 2)
  ) AS oi(pid, qty)
JOIN product p ON p.id = oi.pid;

-- ---------------------------------------------------------------------------
-- 9. MESSAGES DE CONTACT
-- ---------------------------------------------------------------------------
INSERT INTO contact_message (email, subject, message, status, admin_reply) VALUES
  ('dr.martin@cabinet-medical.fr',
   'Devis autoclave classe B 17L',
   'Bonjour, je cherche un autoclave classe B pour un cabinet de chirurgie dentaire. Pouvez-vous me transmettre un devis pour un modèle 17L avec imprimante intégrée ?',
   'open', NULL),
  ('achat@clinique-nord.com',
   'Commande groupée moniteurs patient',
   'Suite à notre appel d''offre, nous souhaitons commander 12 moniteurs multiparamétriques pour notre extension de réanimation. Quelles sont vos conditions pour ce volume ?',
   'in_progress',
   'Bonjour, nous vous avons transmis le devis groupé par email. Une remise de 12% s''applique dès 10 unités.'),
  ('infirmier.dupont@ehpad.fr',
   'Question compatibilité bandelettes',
   'Nos glucomètres HC-750 acceptent-ils les bandelettes d''autres fabricants ? Nous cherchons à réduire nos coûts de consommables.',
   'closed',
   'Les HC-750 sont optimisés pour les bandelettes de la référence HC-750-50. L''utilisation d''autres bandelettes peut affecter la précision et invalide la garantie.'),
  ('bloc.op@hopital-central.fr',
   'SAV scialytique - panne partielle',
   'Notre scialytique LED acheté en 2023 présente une panne sur 1/4 des LED. Nous sommes en période de garantie. Pouvez-vous nous envoyer un technicien en urgence ?',
   'open', NULL);

COMMIT;

-- Résumé
SELECT 'Seed terminé !' AS info;
SELECT COUNT(*) AS produits FROM product WHERE deleted_at IS NULL;
SELECT COUNT(*) AS utilisateurs FROM users;
SELECT COUNT(*) AS commandes FROM orders;
SELECT COUNT(*) AS slides_carrousel FROM carousel;
