# Push vers GitHub

1. Crée un **nouveau dépôt** sur GitHub : https://github.com/new  
   - Nom suggéré : `renovia-pro-client-portal`  
   - Ne coche pas "Add README" (tu as déjà un commit).

2. Dans ce dossier, exécute (remplace `VOTRE_USERNAME` par ton identifiant GitHub) :

```powershell
cd C:\Users\swass\Documents\GitHub\renovia-pro-client-portal
git remote add origin https://github.com/VOTRE_USERNAME/renovia-pro-client-portal.git
git branch -M main
git push -u origin main
```

Si tu utilises SSH :
```powershell
git remote add origin git@github.com:VOTRE_USERNAME/renovia-pro-client-portal.git
git branch -M main
git push -u origin main
```
