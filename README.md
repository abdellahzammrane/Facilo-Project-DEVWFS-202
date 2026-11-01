# Facilo – Backend (PHP + Aiven MySQL + Cloudinary + Vercel)

## Installation
1. Copier ces dossiers/fichiers à la racine du projet Facilo (à côté de index.html) :
   `api/ includes/ config/ certs/ sql/ composer.json vercel.json` (fusionner `.gitignore`).
2. Mettre le certificat Aiven dans `certs/ca.pem`.
3. Base **neuve** : exécuter `sql/schema.sql` dans Aiven (mysql -h ... defaultdb).
   Base **déjà créée** avec l'ancienne version : exécuter seulement `sql/migration_v2.sql` (une seule fois).
4. Variables Vercel : DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, CLOUDINARY_URL
   + **JWT_SECRET** (longue chaîne aléatoire, 32+ caractères).
5. git push puis Redeploy.

## API  (réponses JSON : {success: true, ...} ou {success: false, message})
| Page front | Appel |
|---|---|
| Inscription | POST /api/auth.php?action=register {name,email,password,username?,company_name?,address?,city?,phone?,website?} |
| Connexion | POST /api/auth.php?action=login {email,password} (le champ email accepte aussi le nom d'utilisateur) |
| Déconnexion | POST /api/auth.php?action=logout |
| Utilisateur connecté | GET /api/auth.php?action=me |
| index.html | GET /api/ads.php?action=list&q=&category_id=&city=&min_price=&max_price=&page=&limit= |
| Catégories + sous-catégories | GET /api/ads.php?action=categories  => [{id,name,children:[{id,name}]}] |
| Détail annonce | GET /api/ads.php?action=get&id=ID |
| my-ads.html | GET /api/ads.php?action=mine |
| Publier | POST /api/ads.php?action=create (FormData: title,description,price,city,category_id,ad_type?,ad_year?,images[]) — category_id peut être une catégorie ou une sous-catégorie ; l'annonce expire après 30 jours |
| Prolonger (+30 jours) | POST /api/ads.php?action=extend&id=ID |
| Modifier / vendre / masquer | POST /api/ads.php?action=update&id=ID (title,description,price,city,category_id,ad_type,ad_year,status: active/sold/hidden) |
| Supprimer annonce | POST /api/ads.php?action=delete&id=ID |
| Supprimer une image | POST /api/ads.php?action=delete_image&id=IMAGE_ID |
| favorites.html | GET /api/favorites.php?action=list |
| Coeurs | GET /api/favorites.php?action=ids  /  POST ?action=toggle {ad_id} |
| profile-setting.html | GET ?action=get, POST ?action=update (FormData name,username,company_name,address,phone,city,website,avatar), POST ?action=change_password — /api/profile.php |
| seller-profile.html | GET /api/sellers.php?id=ID |
| contact.html | POST /api/contact.php {name,email,subject,message} |

Envoi JSON : `fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...})})`
Envoi fichiers : `fetch(url,{method:'POST',body:formData})` (ne pas mettre Content-Type à la main).
Le cookie de connexion est envoyé automatiquement (même domaine).

## Durée de vie des annonces
- Chaque annonce a une date d'expiration (`expires_at`) fixée à **30 jours** après sa publication.
- Les annonces expirées disparaissent de la liste publique, des favoris et du profil vendeur ; seul leur propriétaire les voit (`expired: true` dans `mine` et `get`).
- Le propriétaire peut les prolonger avec `action=extend` (+30 jours).
