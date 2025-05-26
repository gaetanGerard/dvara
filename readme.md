# 🛡️ Dvara — Portail centralisé d'applications auto-hébergées

**Dvara** est une plateforme inspirée de Homarr, permettant de centraliser toutes vos applications auto-hébergées dans une interface moderne, responsive et maintenable.
Développée avec Angular 20, NestJS et SQLite, elle vise à offrir un dashboard modulable et sécurisé.

---

## ✨ Fonctionnalités

- Interface responsive moderne (Angular + Tailwind + Sass)
- Ajout et gestion de vos applications par dashboard/catégorie
- Authentification utilisateur
- Backend NestJS avec API REST
- Base de données SQLite via Prisma
- Déploiement facile via Docker

---

## 🚀 Stack technique

| Layer           | Technologie                                   |
| --------------- | --------------------------------------------- |
| Frontend        | Angular 20, Tailwind, Sass, NgRx Signal Store |
| Backend         | NestJS (TypeScript)                           |
| ORM             | Prisma                                        |
| Base de données | SQLite                                        |
| DevOps          | Docker + Docker Compose                       |
| Structure       | Monorepo                                      |

---

## 🧱 Structure du projet

```bash
dvara/
├── apps/frontend         # Application Angular
├── apps/backend          # API NestJS
├── docker/               # Dockerfiles et docker-compose
├── libs/types            # Types partagés
```

## 🐳 Démarrage local

```bash
# Lancer l'environnement complet
docker-compose up --build
```

## 🔮 À venir

- Personnalisation avancée des dashboards
- Authentification OAuth/SAML
- Widgets dynamiques
- Thèmes customisés

## 🧙‍♂️ Nom inspiré de la mythologie thaïlandaise
Dvara signifie “porte” ou “gardien du seuil”.
C'est une référence aux Dvarapala, les gardiens des temples, symboles de protection et d'accès sacré — à l’image de cette application.

## 📄 Licence

Le projet est open source sous licence MIT.