define({
    "ERR_LOADING" : "Caricamento fallito :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Apri Connection Manager",
    "SIDEPANEL_FILETREE_NAME" : "Nome",
    "SIDEPANEL_FILETREE_SIZE" : "Dim.",
    "SIDEPANEL_FILETREE_TYPE" : "Tipo",
    "SIDEPANEL_FILETREE_MODIFIED" : "Modificato",
    "SIDEPANEL_CONDISCONNECT" : "(Dis)connetti",
    "SIDEPANEL_REFRESH" : "Aggiorna",
    "SIDEPANEL_RELOADSETTINGS" : "Ricarica le impostazioni e reinserisci la password",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "Il Server Non Esiste",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Sembra che questo server non esista. <br>Controlla l'URL del server nelle impostazioni di connessione.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "Non Posso Connettermi Al Server",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "Non posso connettermi al server.<br>Forse il tuo firewall non mi permette di farlo.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Dati Di Autenticazione Errati",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "Non riesco ad autorizzare l'accesso con la login e la password inseriti.<br>Ti prego di verificarli.",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "Nessuna connessione specificata",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "Non hai specificato nessuna connessione in eqFTP che associ il tuo progetto corrente ad un server remoto.<br>Specifica un server remoto per la connessione oppure utilizza l'attuale cartella del progetto come percorso locale nelle impostazioni.",
    "ERR_DIAG_ECONNRESET_TITLE" : "Server sta rifiutando le connessioni",
    "ERR_DIAG_ECONNRESET_CONTENT" : "Non riesco a connettermi al server, non mi é permesso.<br>Prova a riavviare Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "You've been disconnected from server", //NEW
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Connection aborted. Trying to reconnect...", //NEW
    "ERR_DIAG_UNIVERSAL_TITLE" : "C'é un errore",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Guarda questo errore! Come è potuto accadere?",

    "NOT_DIAG_CONNECTED" : "Connected to server.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Disconnected from server.", //NEW
    "NOT_DIAG_FILESDIFFERENT" : "There's a difference between local and remote files. Click here for more actions.", //NEW

    "PASSWDWIND_TITLE" : "Inserisci La Master Password",
    "PASSWDWIND_CONTENT" : "La tua Master Password per eqFTP:",

    "CHECKDIFF_TITLE" : "There's difference between files", //NEW
    "CHECKDIFF_CONTENT" : "Remote and local copies of file are different. Please choose an action you would like to do.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Compare files", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Show changes", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Keep local", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Keep local copies for current queue", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Get remote", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Get remote copies for current queue", //NEW

    "SETTINGSWIND_TITLE" : "eqFTP Gestore Connessione",
    "SETTINGSWIND_ERR_BLANKS" : "Oh! Qualcosa è andato storto... controlla il contenuto dei campi e riprova.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Qualcosa è andato davvero storto! Non posso scrivere le impostazioni sul file!",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Il percorso che stai cercando di inserire è attualmente in uso da parte di un'altra connessione.",
    "SETTINGSWIND_NOTIF_DONE" : "Detto, fatto! :)",
    "SETTINGSWIND_SAVEDCONN" : "Connessioni FTP Memorizzate",
    "SETTINGSWIND_DELETECONN_HOVER" : "Rimuovi Questa Connessione",
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "You can't delete connection you're using now", //NEW
    "SETTINGSWIND_ADDCONN_HOVER" : "Aggiungi Nuova Connessione",
    "SETTINGSWIND_ADDCONN_STRING" : "Crea Una Nuova Connessione...",
    "SETTINGSWIND_DELETECONNCONF_1" : "Conferma la rimozione della connessione ",
    "SETTINGSWIND_DELETECONNCONF_2" : ".",
    "SETTINGSWIND_OPENGLOBSET" : "Apri Le Impostazioni FTP Globali...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Seleziona una connessione da modificare nella barra laterale o creane una nuova.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Cartella Progetti:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Cartella Dei i Progetti Con i File Scaricati:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Cartella Impostazioni:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Cartella Con il File Delle Impostazioni",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Non Aprire i Progetti Dopo Il Download",
    "SETTINGSWIND_GLOB_MASTERPASSWORD" : "Master Password", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Nome Connessione:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Inserisci il nome della connessione",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Server:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Tipo Di Protocollo:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Nome utente:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "Utente FTP",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Password:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "Password FTP",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA key", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Click to select RSA key", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Choose path to RSA key", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Percorso Remoto:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Inserisci il percorso remoto alla cartella radice del progetto",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Percorso Locale:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Crea una nuova cartella nella posizione di default se vuoto",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Esegui Upload Dei Files Durante Il Salvataggio",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Add to paused queue.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Anche Quando Disconnesso",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Questa opzione permette di collegarsi automaticamente ad un server quando un file salvato viene aperto dal server oppure quando si trova dentro il progetto corrente ed il progetto è stato creato da questa estensione FTP. Beh, spero che tu mi abbia capito..",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Aggiungi il percorso al progetto corrente",
    "SETTINGSWIND_GLOB_USELIST" : "Alternative folder retrieving", //NEW
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Keep alive interval:", //NEW
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Value in seconds. Recommended value is 10. Use zero to forbid keep alive commands and disconnect from server every time command is done.", //NEW
    "SETTINGSWIND_GLOB_DEBUG" : "Debug:", //NEW
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Formato data:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "US",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Europeo",
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

    "QUEUE_TITLE" : "Coda di eqFTP",
    "QUEUE_HEADER_NAME" : "Nome",
    "QUEUE_HEADER_PATH" : "Percorso",
    "QUEUE_HEADER_FROM" : "Percorso sorgente",
    "QUEUE_HEADER_TO" : "Percorso destinazione",
    "QUEUE_HEADER_STATUS" : "Stato",
    "QUEUE_CLEARQ" : "Ripulisci La Coda",
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
    
    "ERR_FILE_ACCESSDENIED" : "Accesso Negato. Controlla i permessi del file.",
    "ERR_FILE_AUTHORIZATION" : "Autorizzazione fallita. Controlla la tua login e la tua password.",
    "ERR_FILE_SERVNOEXIST" : "Il Server Non Esiste. Forse hai sbagliato a trascriverlo.",
    "ERR_FILE_SERVCANTREACH" : "Non Posso Collegarmi Al Server. Controlla il Firewall.",
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

    "CONTEXTM_DOWNLOAD" : "Download",
    "CONTEXTM_UPLOAD" : "Upload",
    "CONTEXTM_ADDQUEUE" : "Aggiungi Alla Coda",
    "CONTEXTM_OPEN" : "Apri",
    "CONTEXTM_DELETE" : "Cancella",
    "CONTEXTM_RENAME" : "Rinnomina",
    "CONTEXTM_REDOWNLOAD" : "Download from server", //NEW
    "CONTEXTM_CREATEFILE" : "Create file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Create folder", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Seleziona un server remoto...",
    "OTHER_ERROR" : "Errore",
    "OTHER_PAUSED" : "In pausa",
    "OTHER_COMPLETED" : "Completato",
    "OTHER_CANCELLED" : "Cancellato",
    "OTHER_WAITING" : "In attesa",
    "OTHER_OK" : "Ok",
    "OTHER_OFF" : "Off", //NEW
    "OTHER_CANCEL" : "Annulla",
    "OTHER_APPLY" : "Applica",
    "OTHER_SAVE" : "Save", //NEW
    "OTHER_CLOSE" : "Chiudi",
    "OTHER_DELETE" : "Elimina",
    "OTHER_CONFIRM_DELETE" : "Are you sure you want to delete this item?", //NEW
    "OTHER_ERROR_EVENDISCONN" : "Can't upload file. 'Even If Disconnected' option is off.", //NEW
    "OTHER_ERROR_CANTREADSETTINGS" : "Can't read settings file. You probably mistyped your master password." //NEW
});