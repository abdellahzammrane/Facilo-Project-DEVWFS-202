CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(30) NULL UNIQUE,
  company_name VARCHAR(150) NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  city VARCHAR(100) NOT NULL,
  ad_type VARCHAR(50) NULL,
  ad_year SMALLINT NULL,
  status ENUM('active','sold','hidden') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_ads_status_date (status, created_at),
  INDEX idx_ads_user (user_id),
  INDEX idx_ads_expiry (status, expires_at)
);

CREATE TABLE ad_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  user_id INT NOT NULL,
  ad_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, ad_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name) VALUES
('Véhicules'), ('Immobilier'), ('Électronique'), ('Maison & Jardin'),
('Mode'), ('Emploi'), ('Services'), ('Loisirs'), ('Autres');

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
