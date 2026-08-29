# Événements AfroCodeurs synchronisés avec Discord

AfroCodeurs peut créer un événement externe planifié dans le serveur Discord
lorsqu’un membre publie un cours, un live, un atelier ou une visioconférence.
La fiche AfroCodeurs reste la source principale pour l’inscription et le lien
privé du direct. Discord apporte la visibilité communautaire et les rappels.

## Configuration

1. Créer une application dans le portail développeur Discord.
2. Ajouter son bot au serveur AfroCodeurs.
3. Lui accorder la permission **Create Events**. La permission **Manage Events**
   sera nécessaire si la modification et l’annulation synchronisées sont
   ajoutées plus tard.
4. Ajouter uniquement dans `/opt/afrocodeurs/.env` :

   ```env
   DISCORD_BOT_TOKEN="jeton-secret-du-bot"
   DISCORD_GUILD_ID="1539974218551140504"
   ```

Le jeton ne doit jamais être ajouté à GitHub, aux captures d’écran ou aux
journaux publics.

## Fonctionnement

- Sans jeton, les événements continuent de fonctionner sur AfroCodeurs et
  pointent vers l’invitation communautaire.
- Avec le jeton, la case de synchronisation apparaît activée par défaut pour
  Discord.
- Discord reçoit le titre, le résumé, les horaires et le lien communautaire.
- L’identifiant et l’URL Discord sont conservés dans la base AfroCodeurs.
- Si Discord refuse la création, l’événement AfroCodeurs reste publié et son
  organisateur peut relancer la synchronisation depuis la fiche.

BigBlueButton est traité comme une plateforme externe : l’organisateur colle
le lien de sa salle. Il n’est pas auto-hébergé sur le VPS partagé avec
AfroCodeurs, MATOSPRO et Cine Light Studio.
