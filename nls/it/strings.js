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
    "ERR_DIAG_ECONNABORTED_TITLE" : "Sei stato disconnesso dal server", //NEW
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Connessione interrotta. Provo a riconnettermi...", //NEW
    "ERR_DIAG_UNIVERSAL_TITLE" : "C'é un errore",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Guarda questo errore! Come è potuto accadere?",

    "NOT_DIAG_CONNECTED" : "Connesso al server.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Disconnesso dal server.", //NEW
    "NOT_DIAG_FILESDIFFERENT" : "C'è una differenza tra i file locali e remoti. Clicca qui per ulteriori azioni.", //NEW

    "PASSWDWIND_TITLE" : "Inserisci La Master Password",
    "PASSWDWIND_CONTENT" : "La tua Master Password per eqFTP:",

    "CHECKDIFF_TITLE" : "C'è una differenza tra i file", //NEW
    "CHECKDIFF_CONTENT" : "Le copie remote e locali dei file sono diverse. Scegli un azione da compiere.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Compara file", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Mostra cambiamenti", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Mantieni file locale", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Mantieni file locale per la coda corrente", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Scarica file remoti", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Scarica file remoti per la coda corrente", //NEW

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
    "SETTINGSWIND_GLOB_RSA_TITLE" : "Chiave RSA", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Clicca per selezionare la chiave RSA", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Scegli percorso per la chiave RSA", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Percorso Remoto:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Inserisci il percorso remoto alla cartella radice del progetto",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Percorso Locale:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Crea una nuova cartella nella posizione di default se vuoto",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Esegui Upload Dei Files Durante Il Salvataggio",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Aggiungi alla coda in pausa.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Anche Quando Disconnesso",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Questa opzione permette di collegarsi automaticamente ad un server quando un file salvato viene aperto dal server oppure quando si trova dentro il progetto corrente ed il progetto è stato creato da questa estensione FTP. Beh, spero che tu mi abbia capito..",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Aggiungi il percorso al progetto corrente",
    "SETTINGSWIND_GLOB_USELIST" : "Recupero cartella alternativa", //NEW
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Intervallo keep alive:", //NEW
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Valore espresso in secondi. Il valore consigliato è 10. Utilizzare zero per vietare il keep alive dei comandi e disconnettersi dal server ogni volta il comando è eseguito.", //NEW
    "SETTINGSWIND_GLOB_DEBUG" : "Debug:", //NEW
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Formato data:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "US",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Europeo",
    "SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Asiatico", //NEW
    "SETTINGSWIND_GLOB_AUTOCLEAR" : "Eliminazione automatica cosa", //NEW
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Notifiche", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Offset tempo:", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Utilizzare questa opzione per impostare il tempo corretto per la colonna modificata", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONTAB" : "Connessione", //NEW
    "SETTINGSWIND_GLOB_AUTOMATIZATIONTAB" : "Automatizzazione", //NEW
    "SETTINGSWIND_GLOB_ADVANCEDTAB" : "Avanzate", //NEW
    "SETTINGSWIND_GLOB_AUTO_SET_TITLE" : "Imposta automatizzazione:", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC" : "Sincronizzazione", //NEW
    "SETTINGSWIND_GLOB_AUTO_CLASSIC" : "Classico", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_SELECT_TITLE" : "Seleziona cosa sincronizzare", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILECREATION" : "Creazione file", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FOLDERCREATION" : "Creazione cartella", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILEUPLOAD" : "Aggiornamento file", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_RENAMING" : "Rinomina", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_MOVING" : "Spostamento", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_DELETING" : "Eliminazione", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_EXTRASETTINGS_TITLE" : "Impostazioni extra", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF" : "Verifica la presenza di differenze", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF_EXPLAIN" : "Quando apri il file locale o remoto", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_TITLE" : "Lista ignoramenti", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_EXPLAIN" : "Stessa sintassi di .gitignore", //NEW
    "SETTINGSWIND_GLOB_SYNCLOCPROJWCONN" : "Apri i relativi progetti locali dopo lo switching della connessione e viceversa", //NEW
    "SETTINGS_NOTIF_RELOADED" : "Impostazioni ricaricate correttamente.", //NEW
    "SETTINGS_ERROR_RELOADED" : "Impossibile caricare le impostazioni.", //NEW

    "QUEUE_TITLE" : "Coda di eqFTP",
    "QUEUE_HEADER_NAME" : "Nome",
    "QUEUE_HEADER_PATH" : "Percorso",
    "QUEUE_HEADER_FROM" : "Percorso sorgente",
    "QUEUE_HEADER_TO" : "Percorso destinazione",
    "QUEUE_HEADER_STATUS" : "Stato",
    "QUEUE_CLEARQ" : "Ripulisci La Coda",
    "QUEUE_STARTQ" : "Inizia coda", //NEW
    "QUEUE_PAUSEQ" : "Pausa coda", //NEW
    "QUEUE_RESTARTQ" : "Restart fallito", //NEW
    "QUEUE_CONTEXTM_STARTT" : "Start", //NEW
    "QUEUE_CONTEXTM_PAUSET" : "Pausa", //NEW
    "QUEUE_CONTEXTM_REMOVET" : "Rimuovi", //NEW
    "QUEUE_CONTEXTM_RESTARTT" : "Restart", //NEW
    "QUEUE_TASK_STATUS_WAITING" : "Aspettando", //NEW
    "QUEUE_TASK_STATUS_SUCCESS" : "Fatto", //NEW
    "QUEUE_TASK_STATUS_FAIL" : "Fallito", //NEW
    "QUEUE_TASK_STATUS_PAUSE" : "In pausa", //NEW
    "QUEUE_TASK_STATUS_STARTED" : "Iniziato", //NEW
    "QUEUE_TASK_STATUS_DELETED" : "Cancellato", //NEW
    "QUEUE_DONT_ADD_COMPLETED" : "Elimina automaticamente task completati", //NEW
    
    "ERR_FILE_ACCESSDENIED" : "Accesso Negato. Controlla i permessi del file.",
    "ERR_FILE_AUTHORIZATION" : "Autorizzazione fallita. Controlla la tua login e la tua password.",
    "ERR_FILE_SERVNOEXIST" : "Il Server Non Esiste. Forse hai sbagliato a trascriverlo.",
    "ERR_FILE_SERVCANTREACH" : "Non Posso Collegarmi Al Server. Controlla il Firewall.",
    "ERR_FILE_FILESIZE0" : "Impossibile scaricare il file. La grandezza è 0.", //NEW
    "ERR_FILE_DOWNLOAD" : "Impossibile scaricare il file.", //NEW
    "ERR_FILE_UPLOAD" : "Impossibile caricare il file.", //NEW
    "ERR_FILE_DOESNTEXIST" : "Il file non esiste", //NEW
    "ERR_FILE_CANTRENAME" : "Impossibile rinominare il file: ", //NEW
    "ERR_FILE_CANTDELETE" : "Impossibile eliminare il file: ", //NEW
    "ERR_FILE_CANTCREATEDIR" : "Impossibile creare la cartella: ", //NEW
    "ERR_FILE_CANTDELETEDIR" : "Impossibile eliminare la cartella: ", //NEW
    "ERR_FILE_CANTCREATEFILE" : "Impossibile creare il file: ", //NEW
    "ERR_FOLDER_OPEN" : "C'è un errore nell'apertura della cartella come progetto", //NEW

    "CONTEXTM_DOWNLOAD" : "Download",
    "CONTEXTM_UPLOAD" : "Upload",
    "CONTEXTM_ADDQUEUE" : "Aggiungi Alla Coda",
    "CONTEXTM_OPEN" : "Apri",
    "CONTEXTM_DELETE" : "Cancella",
    "CONTEXTM_RENAME" : "Rinnomina",
    "CONTEXTM_REDOWNLOAD" : "Scarica dal server", //NEW
    "CONTEXTM_CREATEFILE" : "Crea file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Crea cartella", //NEW

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
    "OTHER_SAVE" : "Salva", //NEW
    "OTHER_CLOSE" : "Chiudi",
    "OTHER_DELETE" : "Elimina",
    "OTHER_CONFIRM_DELETE" : "Sei sicuro di voler eliminare questo elemento?", //NEW
    "OTHER_CONFIRM_SETTINGSCLOSE" : "Ci sono delle modifiche non salvate che verranno eliminate se clicchi OK.<br>Vuoi procedere?", //NEW
    "OTHER_ERROR_EVENDISCONN" : "Impossibile caricare il file. L'opzione 'Anche se disconnesso' è disabilitata.", //NEW
    "OTHER_ERROR_CANTREADSETTINGS" : "Impossibile leggere il file di configurazione. Probabilmente hai sbagliato la tua Master Password." //NEW
});
