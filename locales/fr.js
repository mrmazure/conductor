window.LOCALES = window.LOCALES || {};
window.LOCALES['fr'] = {
  // Conductor empty state
  'conductor.empty': 'Glissez des blocs ici pour commencer',

  // Header
  'header.endTime': 'Fin prévisionnelle',
  'header.totalDuration': 'Durée totale',
  'header.connectionTitle': 'Statut de la connexion',

  // Top bar
  'topbar.showName.label': "Nom de l'émission",
  'topbar.showName.placeholder': "Titre de l'émission",
  'topbar.startTime.label': 'Heure de début',

  // Buttons
  'btn.clearDesc': '🧹 Vider Desc.',
  'btn.clearDesc.title': 'Vider uniquement le texte des descriptions',
  'btn.clearAll': '🗑️ Tout effacer',
  'btn.clearAll.title': 'Tout effacer',
  'btn.save': '💾 Sauver',
  'btn.save.title': 'Sauvegarder (.json)',
  'btn.load': '📂 Ouvrir',
  'btn.load.title': 'Ouvrir (.json)',
  'btn.excel': '📤 Excel',
  'btn.excel.title': 'Exporter ODS',
  'btn.print': '🖨️ Imprimer / PDF',
  'btn.print.title': 'Imprimer / PDF',
  'btn.share': '🔗 Partager / Collaborer',
  'btn.share.title': 'Partager ou collaborer',
  'btn.lang.title': 'Changer de langue',

  // Palette
  'palette.title': 'Blocs',
  'palette.reset.title': 'Réinitialiser les types de bloc',
  'palette.add.title': 'Ajouter un type de bloc',
  'palette.tip': '💡 <em>Clic droit = éditer les paramètres du bloc</em>',

  // Type Modal
  'modal.type.title': 'Gérer le Type',
  'modal.type.labelName': 'Nom du bloc',
  'modal.type.labelColor': 'Couleur',
  'modal.type.labelDuration': 'Durée par défaut (mm:ss)',
  'modal.type.delete': 'Supprimer',
  'modal.type.cancel': 'Annuler',
  'modal.type.confirm': 'Enregistrer',

  // Share Modal
  'share.title': '🔗 Partager / Collaborer',
  'share.close.title': 'Fermer',
  'share.cloud.title': 'Sauvegarde Cloud (chiffrée)',
  'share.cloud.desc': "Génère un lien unique pour partager le conducteur. Les données sont chiffrées, le serveur ne peut pas les lire.",
  'share.cloud.btn': '☁️ Générer lien de partage',
  'share.cloud.placeholder': 'Lien en cours de génération...',
  'share.cloud.copy.title': 'Copier le lien',
  'share.cloud.notice': '🔒 Chiffré de bout en bout. Lien valable 30 jours. Les modifications sont synchronisées automatiquement.',
  'share.live.title': 'Collaboration Live',
  'share.live.desc': 'Travaillez en temps réel avec vos collaborateurs.',
  'share.live.btn': '🤝 Activer session Live',
  'share.live.placeholder': 'Lien en cours de génération...',
  'share.live.copy.title': 'Copier le lien',
  'share.copy': '📋 Copier',
  'share.copied': '✅ Copié !',

  // Dynamic share button states
  'share.cloud.encrypting': '⏳ Chiffrement en cours...',
  'share.live.starting': '⏳ Démarrage...',
  'share.live.active': '🟢 Session Live active',

  // Block
  'block.duration': 'Durée',
  'block.descPlaceholder': 'Description / Titre / Contenu',
  'block.move.title': 'Déplacer',
  'block.duplicate.title': 'Dupliquer',
  'block.delete.title': 'Supprimer',

  // Confirms
  'confirm.deleteBlock': 'Supprimer ce bloc ?',
  'confirm.clearAll': 'Voulez-vous vraiment tout effacer ?',
  'confirm.clearDesc': 'Voulez-vous vider le texte de TOUTES les descriptions ?',
  'confirm.loadFile': 'Charger ce fichier ?',
  'confirm.deleteType': 'Supprimer le type "%s" ?',
  'confirm.resetTypes': 'Réinitialiser tous les types de blocs aux valeurs par défaut ?',

  // Alerts
  'alert.noData': 'Aucune donnée à exporter.',
  'alert.saveError': 'Erreur lors de la sauvegarde : ',
  'alert.networkError': 'Erreur réseau ou de chiffrement.',
  'alert.liveError': 'Impossible de démarrer la collaboration. Vérifiez votre connexion.',
  'alert.fileError': 'Erreur fichier.',

  // Peer / collaboration
  'peer.collaborators': 'Collaborateurs : ',
  'peer.hostTitle': 'Hôte actif — %n collaborateur(s) connecté(s)',
  'peer.connecting': 'Connexion en cours...',
  'peer.connected': 'Connecté (session: %s)',

  // Page title
  'title.default': 'Conducteur Radio - RadioTools.be',

  // Print
  'print.start': 'Début :',
  'print.end': 'Fin :',
  'print.duration': 'Durée :',
  'print.default': 'Conducteur',

  // ODS Export columns
  'ods.time': 'Heure',
  'ods.duration': 'Durée',
  'ods.type': 'Type',
  'ods.title': 'Titre',
  'ods.description': 'Description',
  'ods.sheetName': 'Conducteur',
  'ods.defaultName': 'Conducteur',

  // Default types
  'default.types.sequence': 'Séquence',
  'default.types.speak': 'Speak',
  'default.types.pub': 'Publicité',
  'default.types.musique': 'Musique',
  'default.types.autre': 'Autre',
};
