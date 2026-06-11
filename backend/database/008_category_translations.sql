-- ============================================================
-- 008 — Traductions des catégories (EN / AR / HE)
-- Remplace les noms vides insérés par 007_translations.sql
-- ============================================================

INSERT INTO category_translation (category_id, language_id, name, description)
SELECT c.id, l.id, v.name, v.description
FROM (VALUES
  -- English
  ('diagnostic',   'en', 'Diagnostic',        'Blood pressure monitors, stethoscopes, portable ECG and measuring devices for routine examinations.'),
  ('monitoring',   'en', 'Monitoring',         'Multiparameter monitors, holters and pulse oximeters for continuous patient monitoring.'),
  ('sterilisation','en', 'Sterilisation',      'Autoclaves, sealers and traceability solutions for sterilisation protocols.'),
  ('imagerie',     'en', 'Imaging',            'Ultrasound scanners and visualisation accessories for mobile and versatile practice.'),
  ('consommables', 'en', 'Consumables',        'Sensors, electrodes, cuffs and consumables compatible with catalogue equipment.'),
  ('mobilier',     'en', 'Medical Furniture',  'Examination chairs, trolleys and furniture designed to optimise care spaces.'),

  -- Arabic
  ('diagnostic',   'ar', 'التشخيص',      'مقاييس ضغط الدم والسماعات الطبية وأجهزة القياس للفحوصات الروتينية.'),
  ('monitoring',   'ar', 'المراقبة',     'أجهزة مراقبة متعددة المعاملات وأجهزة هولتر لمتابعة المرضى باستمرار.'),
  ('sterilisation','ar', 'التعقيم',      'الأوتوكلاف وآلات اللحام ومحاليل التتبع لبروتوكولات التعقيم.'),
  ('imagerie',     'ar', 'التصوير الطبي','أجهزة الموجات فوق الصوتية وملحقات التصور للممارسة المتنقلة.'),
  ('consommables', 'ar', 'المستلزمات',   'المستشعرات والأقطاب الكهربائية والمستلزمات المتوافقة مع أجهزة الكتالوج.'),
  ('mobilier',     'ar', 'الأثاث الطبي', 'كراسي الفحص والعربات والأثاث المصمم لتحسين أماكن الرعاية.'),

  -- Hebrew
  ('diagnostic',   'he', 'אבחון',          'מד לחץ דם, סטטוסקופים ומכשירי מדידה לבדיקות שגרתיות.'),
  ('monitoring',   'he', 'ניטור',           'מוניטורים מרובי-פרמטרים, הולטרים ומד-חמצן למעקב רציף אחר המטופל.'),
  ('sterilisation','he', 'עיקור',           'אוטוקלב, מכשירי איטום ופתרונות מעקב לפרוטוקולי עיקור.'),
  ('imagerie',     'he', 'הדמיה',           'מכשירי אולטרסאונד ואביזרי הדמיה לעבודה ניידת ורב-תכליתית.'),
  ('consommables', 'he', 'חומרים מתכלים',   'חיישנים, אלקטרודות וחומרים מתכלים תואמים לציוד הקטלוג.'),
  ('mobilier',     'he', 'ריהוט רפואי',     'כיסאות בדיקה, עגלות וריהוט לאופטימיזציה של חדרי הטיפול.')
) AS v(slug, lang_code, name, description)
JOIN category c ON c.slug = v.slug
JOIN language l ON l.code = v.lang_code
ON CONFLICT (category_id, language_id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description
  WHERE category_translation.name IS NULL OR category_translation.name = '';
