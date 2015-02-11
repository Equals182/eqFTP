define({
	"ERR_LOADING" : "Le chargement a échoué :(",

	"SIDEPANEL_TITLE" : "eqFTP",
	"SIDEPANEL_OPENCONNMANGR" : "Ouvrir le gestionnaire de connexion",
	"SIDEPANEL_FILETREE_NAME" : "Nom",
	"SIDEPANEL_FILETREE_SIZE" : "Taille",
	"SIDEPANEL_FILETREE_TYPE" : "Type",
	"SIDEPANEL_FILETREE_MODIFIED" : "Modifié",
	"SIDEPANEL_CONDISCONNECT" : "(Dé)connecter",
	"SIDEPANEL_REFRESH" : "Rafraîchir",
	"SIDEPANEL_RELOADSETTINGS" : "Recharger les paramètres et re-rentrer son mot de passe",

	"ERR_DIAG_SERVNOEXIST_TITLE" : "Le serveur n'existe pas",
	"ERR_DIAG_SERVNOEXIST_CONTENT" : "Il semblerait que ce serveur n'existe pas.<br>Vérifiez les serveurs renseignés dans le gestionnaire de connexion.",
	"ERR_DIAG_SERVCANTREACH_TITLE" : "Impossible d'atteindre le serveur",
	"ERR_DIAG_SERVCANTREACH_CONTENT" : "Je ne peux pas joindre le serveur<br>Peut-être que votre pare-feu m'en empêche.",
	"ERR_DIAG_AUTHORIZEERR_TITLE" : "Accès impossible",
	"ERR_DIAG_AUTHORIZEERR_CONTENT" : "Je ne peux pas vous autoriser l'accès avec le nom d'utilisateur et le mot de passe que vous m'avez fourni.<br>Merci de les vérifier.",
	"ERR_DIAG_NOSERVERFOUND_TITLE" : "Impossible de trouver la connexion",
	"ERR_DIAG_NOSERVERFOUND_CONTENT" : "Il n'y a aucune connexion eqFTP liée à ce projet et aucun serveur connecté.<br>Connectez-vous à un serveur ou précisez le chemin du projet en cours comme chemin local comme connexion dans les paramètres.",
	"ERR_DIAG_ECONNRESET_TITLE" : "Le serveur refuse la connexion",
	"ERR_DIAG_ECONNRESET_CONTENT" : "Je ne peux pas me connecter au serveur, il ne me laisse pas faire.<br>Essayez de redémarrer Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "You've been disconnected from server", //NEW
	"ERR_DIAG_ECONNABORTED_CONTENT" : "Connection aborted. Trying to reconnect...", //NEW
	"ERR_DIAG_UNIVERSAL_TITLE" : "Il y a une erreur",
	"ERR_DIAG_UNIVERSAL_CONTENT" : "Regardez-moi cette erreur ! Comment ça a pu arriver ?",

    "NOT_DIAG_CONNECTED" : "Connected to server.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Disconnected from server.", //NEW
    "NOT_DIAG_FILESDIFFERENT" : "There's a difference between local and remote files. Click here for more actions.", //NEW
    
	"PASSWDWIND_TITLE" : "Merci de renseigner votre mot de passe",
	"PASSWDWIND_CONTENT" : "Votre mot de passe pour eqFTP:",

    "CHECKDIFF_TITLE" : "There's difference between files", //NEW
    "CHECKDIFF_CONTENT" : "Remote and local copies of file are different. Please choose an action you would like to do.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Compare files", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Show changes", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Keep local", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Keep local copies for current queue", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Get remote", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Get remote copies for current queue", //NEW

	"SETTINGSWIND_TITLE" : "Gestionnaire de connexion eqFTP",
	"SETTINGSWIND_ERR_BLANKS" : "Oh ! On dirait que quelque chose ne va pas. Vérifiez les champs et ré-essayez.",
	"SETTINGSWIND_ERR_CANTWRITE" : "Quelque chose ne va vraiment pas ! Je ne peux pas sauvegarder les paramètres !",
	"SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Le chemin que vous essayez de renseigner est déjà utilisé par une autre connexion.",
	"SETTINGSWIND_NOTIF_DONE" : "Tout est sauvegardé ! :)",
	"SETTINGSWIND_SAVEDCONN" : "Connexions FTP sauvegardée",
	"SETTINGSWIND_DELETECONN_HOVER" : "Supprimer cette connexion",
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "You can't delete connection you're using now", //NEW
	"SETTINGSWIND_ADDCONN_HOVER" : "Ajouter une nouvelle connexion",
	"SETTINGSWIND_ADDCONN_STRING" : "Créer une nouvelle connexion ...",
	"SETTINGSWIND_DELETECONNCONF_1" : "Veuillez confirmer la suppression de ",
	"SETTINGSWIND_DELETECONNCONF_2" : " connexion(s).",
	"SETTINGSWIND_OPENGLOBSET" : "Ouvrir les paramètres FTP généraux...",
	"SETTINGSWIND_NOTHINGYETMSG" : "Choisissez la connexion à modifier dans la barre latérale ou créez en une nouvelle.",
	"SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Dossier pour vos projets :",
	"SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Chemin pour les projets téléchargés :",
	"SETTINGSWIND_GLOB_FOLDERFORSET" : "Dossier pour vos paramètres:",
	"SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Chemin pour sauvegarder vos paramètres",
	"SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Ne pas ouvrir le projet après le téléchargement",
	"SETTINGSWIND_GLOB_MASTERPASSWORD" : "Master Password", //NEW
	"SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Nom de la connexion :",
	"SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Renseignez le nom de votre connexion",
	"SETTINGSWIND_GLOB_SERVER_TITLE" : "Serveur :",
	"SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Protocole :",
	"SETTINGSWIND_GLOB_USERNAME_TITLE" : "Nom d'utilisateur :",
	"SETTINGSWIND_GLOB_USERNAME_FIELD" : "Nom d'utilisateur FTP",
	"SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Mot de passe:",
	"SETTINGSWIND_GLOB_PASSWORD_FIELD" : "Mot de passe FTP",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA key", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Click to select RSA key", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Choose path to RSA key", //NEW
	"SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Chemin d'accès distant :",
	"SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Renseignez le chemin d'accès distant à votre projet",
	"SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Chemin d'accès local :",
	"SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Créé un dossier dans chemin par défaut si non renseigné",
	"SETTINGSWIND_GLOB_UPLOADONSAVE" : "Charger les fichiers à la sauvegarde",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Add to paused queue.", //NEW
	"SETTINGSWIND_GLOB_EVENDISCONN" : "Même si deconnecté",
	"SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Cette option vous permet de vous connecter automatiquement au serveur quand le fichier sauvegardé est ouvert depuis le serveur ou que le fichier appartient au projet ouvert et que celui-ci a été créé par cette extension FTP. Oh, j'espère sincèrement que j'ai réussi à me faire comprendre ...",
	"SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Renseignez le chemin du projet actuel",
	"SETTINGSWIND_GLOB_USELIST" : "Alternative folder retrieving",
	"SETTINGSWIND_GLOB_KEEPALIVE" : "Intervalle de connexion persistante:",
	"SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "En secondes. Recommandé à 10s. Utilisez 0 pour désactiver la connexion persistante et se déconnecter à chaque fin de commande.",
	"SETTINGSWIND_GLOB_DEBUG" : "Debug :",
	"SETTINGSWIND_GLOB_TIMEFORMAT" : "Format de date :",
	"SETTINGSWIND_GLOB_TIMEFORMAT_US" : "US",
	"SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Européen",
	"SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Asian", //NEW
	"SETTINGSWIND_GLOB_AUTOCLEAR" : "Auto-clear Queue", //NEW
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Notifications", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Time Offset:", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Use this option to set correct time for Modified column", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONTAB" : "Connection", //NEW
    "SETTINGSWIND_GLOB_AUTOMATIZATIONTAB" : "Automatization", //NEW
    "SETTINGSWIND_GLOB_ADVANCEDTAB" : "Advanced", //NEW
    "SETTINGSWIND_GLOB_AUTO_SET_TITLE" : "Set automatization:", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC" : "Sync", //NEW
    "SETTINGSWIND_GLOB_AUTO_CLASSIC" : "Classic", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_SELECT_TITLE" : "Select what to sync", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILECREATION" : "File creation", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FOLDERCREATION" : "Folder creation", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILEUPLOAD" : "File update", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_RENAMING" : "Renaming", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_MOVING" : "Moving", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_DELETING" : "Deleting", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_EXTRASETTINGS_TITLE" : "Extra settings", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF" : "Check for differences", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF_EXPLAIN" : "When you open local or remote file", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_TITLE" : "Ignore list", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_EXPLAIN" : "Same syntax as in .gitignore", //NEW
    "SETTINGSWIND_GLOB_SYNCLOCPROJWCONN" : "Open related Local project after switching connection and vice versa", //NEW
    "SETTINGS_NOTIF_RELOADED" : "Settings were successfully reloaded.", //NEW
    "SETTINGS_ERROR_RELOADED" : "Can't reload settings.", //NEW

    "QUEUE_TITLE" : "File d'attente eqFTP",
    "QUEUE_HEADER_NAME" : "Nom",
    "QUEUE_HEADER_PATH" : "Répertoire",
    "QUEUE_HEADER_FROM" : "Chemin source",
    "QUEUE_HEADER_TO" : "Chemin de destination",
    "QUEUE_HEADER_STATUS" : "Statut",
    "QUEUE_CLEARQ" : "Vider la file d'attente",
    "QUEUE_STARTQ" : "Start Queue", //NEW
    "QUEUE_PAUSEQ" : "Pause Queue", //NEW
    "QUEUE_RESTARTQ" : "Restart Failed", //NEW
    "QUEUE_CONTEXTM_STARTT" : "Start", //NEW
    "QUEUE_CONTEXTM_PAUSET" : "Pause", //NEW
    "QUEUE_CONTEXTM_REMOVET" : "Remove", //NEW
    "QUEUE_CONTEXTM_RESTARTT" : "Restart", //NEW
    "QUEUE_TASK_STATUS_WAITING" : "Waiting", //NEW
    "QUEUE_TASK_STATUS_SUCCESS" : "Done", //NEW
    "QUEUE_TASK_STATUS_FAIL" : "Failed", //NEW
    "QUEUE_TASK_STATUS_PAUSE" : "Paused", //NEW
    "QUEUE_TASK_STATUS_STARTED" : "Started", //NEW
    "QUEUE_TASK_STATUS_DELETED" : "Deleted", //NEW
    "QUEUE_DONT_ADD_COMPLETED" : "Auto-clear Completed tasks", //NEW
    
    "ERR_FILE_ACCESSDENIED" : "Accès impossible. Vérifiez les droits.",
    "ERR_FILE_AUTHORIZATION" : "Erreur d'autorisation. Vérifiez votre nom d'utilisateur et votre mot de passe.",
    "ERR_FILE_SERVNOEXIST" : "Le serveur n'existe pas. Peut-être l'avez-vous mal écrit.",
    "ERR_FILE_SERVCANTREACH" : "Impossible de joindre le serveur. Vérifiez votre pare-feu.",
    "ERR_FILE_FILESIZE0" : "Can't download file. Filesize is 0.", //NEW
    "ERR_FILE_DOWNLOAD" : "Can't download file.", //NEW
    "ERR_FILE_UPLOAD" : "Can't upload file.", //NEW
    "ERR_FILE_DOESNTEXIST" : "File doesn't exist", //NEW
    "ERR_FILE_CANTRENAME" : "Can't rename file: ", //NEW
    "ERR_FILE_CANTDELETE" : "Can't delete file: ", //NEW
    "ERR_FILE_CANTCREATEDIR" : "Can't create folder: ", //NEW
    "ERR_FILE_CANTDELETEDIR" : "Can't delete folder: ", //NEW
    "ERR_FILE_CANTCREATEFILE" : "Can't create file: ", //NEW
    "ERR_FOLDER_OPEN" : "There's an error opening folder as project", //NEW

	"CONTEXTM_DOWNLOAD" : "Télécharger",
	"CONTEXTM_UPLOAD" : "Charger",
	"CONTEXTM_ADDQUEUE" : "Ajouter à la liste d'attente",
	"CONTEXTM_OPEN" : "Ouvrir",
	"CONTEXTM_DELETE" : "Supprimer",
	"CONTEXTM_RENAME" : "Renommer",
	"CONTEXTM_REDOWNLOAD" : "Download from server", //NEW
    "CONTEXTM_CREATEFILE" : "Create file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Create folder", //NEW

	"OTHER_SELECT_SERVER_DROPDOWN" : "Sélectionnez le serveur distant à ouvrir ...",
	"OTHER_ERROR" : "Erreur",
	"OTHER_PAUSED" : "En pause",
	"OTHER_COMPLETED" : "Terminé",
	"OTHER_CANCELLED" : "Annulé",
	"OTHER_WAITING" : "En attente",
	"OTHER_OK" : "Ok",
    "OTHER_OFF" : "Off", //NEW
	"OTHER_CANCEL" : "Annuler",
	"OTHER_APPLY" : "Appliquer",
    "OTHER_SAVE" : "Save", //NEW
	"OTHER_CLOSE" : "Fermer",
	"OTHER_DELETE" : "Supprimer",
	"OTHER_CONFIRM_DELETE" : "Are you sure you want to delete this item?", //NEW
	"OTHER_ERROR_EVENDISCONN" : "Can't upload file. 'Even If Disconnected' option is off.", //NEW
    "OTHER_ERROR_CANTREADSETTINGS" : "Can't read settings file. You probably mistyped your master password." //NEW
});