-- Migration v2 : à exécuter UNE SEULE FOIS si la base existe déjà (schema.sql déjà exécuté).
-- Sur une base neuve, exécutez seulement schema.sql.

ALTER TABLE users
  ADD COLUMN username VARCHAR(30) NULL UNIQUE AFTER name,
  ADD COLUMN company_name VARCHAR(150) NULL AFTER username,
  ADD COLUMN address VARCHAR(255) NULL AFTER phone,
  ADD COLUMN website VARCHAR(255) NULL AFTER city;

ALTER TABLE categories
  ADD COLUMN parent_id INT NULL,
  ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE ads
  ADD COLUMN ad_type VARCHAR(50) NULL AFTER city,
  ADD COLUMN ad_year SMALLINT NULL AFTER ad_type,
  ADD COLUMN expires_at DATETIME NULL;

-- Les annonces existantes reçoivent 30 jours à partir de maintenant
UPDATE ads SET expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY);
ALTER TABLE ads MODIFY expires_at DATETIME NOT NULL, ADD INDEX idx_ads_expiry (status, expires_at);

-- Sous-catégories (une annonce peut être rattachée à une catégorie ou à une sous-catégorie)
INSERT INTO categories (name, parent_id)
SELECT v.n, c.id FROM (
  SELECT 'Voitures' AS n, 'Véhicules' AS p UNION ALL SELECT 'Motos', 'Véhicules' UNION ALL SELECT 'Camions et utilitaires', 'Véhicules'
  UNION ALL SELECT 'Appartements', 'Immobilier' UNION ALL SELECT 'Maisons et villas', 'Immobilier'
  UNION ALL SELECT 'Terrains', 'Immobilier' UNION ALL SELECT 'Locaux commerciaux', 'Immobilier'
  UNION ALL SELECT 'Smartphones', 'Électronique' UNION ALL SELECT 'Tablettes', 'Électronique'
  UNION ALL SELECT 'Ordinateurs', 'Électronique' UNION ALL SELECT 'Télévisions', 'Électronique'
  UNION ALL SELECT 'Meubles', 'Maison & Jardin' UNION ALL SELECT 'Électroménager', 'Maison & Jardin' UNION ALL SELECT 'Décoration', 'Maison & Jardin'
  UNION ALL SELECT 'Vêtements', 'Mode' UNION ALL SELECT 'Chaussures', 'Mode' UNION ALL SELECT 'Accessoires', 'Mode'
  UNION ALL SELECT 'Offres d''emploi', 'Emploi' UNION ALL SELECT 'Demandes d''emploi', 'Emploi'
  UNION ALL SELECT 'Formation', 'Services' UNION ALL SELECT 'Réparation', 'Services' UNION ALL SELECT 'Transport et déménagement', 'Services'
  UNION ALL SELECT 'Sport', 'Loisirs' UNION ALL SELECT 'Livres et musique', 'Loisirs' UNION ALL SELECT 'Jeux et jouets', 'Loisirs'
) v JOIN categories c ON c.name = v.p AND c.parent_id IS NULL;
