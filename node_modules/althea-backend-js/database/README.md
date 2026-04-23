# Base de donnees

Ce dossier contient le modele relationnel du backend Althea.

- `schema.dbml` : modele source compatible avec dbdiagram.io.
- `001_initial_schema.sql` : migration SQL initiale compatible MySQL/MariaDB.

Pour initialiser une base MySQL :

```bash
mysql -u <user> -p <database_name> < backend/database/001_initial_schema.sql
```

Le backend Express utilise encore le stockage JSON dans `backend/data/store.js`.
La prochaine etape sera de remplacer ce stockage par un client SQL une fois le moteur choisi.
