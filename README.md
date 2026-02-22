# client.renoviapro.fr — Espace client

Auth par lien magique (email), JWT, tickets SAV, chantiers/documents/maintenance (connecteurs mock).

## Run local

```bash
# Backend
cd client-portal/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
set MONGO_URI=mongodb://localhost:27017
uvicorn app.main:app --reload --port 8000

# Frontend
cd client-portal/frontend
npm install
set VITE_API_URL=http://localhost:8000
npm run dev
```

Connexion : aller sur /login, saisir un email. Configurer SMTP pour recevoir le lien (sinon le token est créé en base ; pour tester, on peut appeler POST /api/v1/auth/verify?token=XXX après avoir récupéré un token en base).

## API (exemples)

- **POST /api/v1/auth/magic-link** — body: `{"email":"client@example.com"}`
- **POST /api/v1/auth/verify?token=XXX** — retourne `access_token`, `refresh_token`
- **GET /api/v1/me** — Header: `Authorization: Bearer <access_token>`
- **GET /api/v1/chantiers** — Liste chantiers (mock)
- **GET /api/v1/documents** — Liste documents (mock)
- **POST /api/v1/tickets** — multipart: subject, description, photos (optionnel)
- **GET /api/v1/tickets** — Liste tickets du client
- **GET /api/v1/maintenance** — Contrat maintenance (mock)

## Déploiement

1. DNS : A ou CNAME `client.renoviapro.fr` → IP du serveur.
2. Nginx : utiliser `nginx.client.conf.example` (backend en 127.0.0.1:8001).
3. HTTPS : `certbot --nginx -d client.renoviapro.fr`
4. Variables : JWT_SECRET, MONGO_URI, SMTP_*.
