define({
    "ERR_LOADING" : "Laden mislukt :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Open Verbinding Beheer",
    "SIDEPANEL_FILETREE_NAME" : "Naam",
    "SIDEPANEL_FILETREE_SIZE" : "Grootte",
    "SIDEPANEL_FILETREE_TYPE" : "Type",
    "SIDEPANEL_FILETREE_MODIFIED" : "Aangepast",
    "SIDEPANEL_CONDISCONNECT" : "Verbinden/verbreken",
    "SIDEPANEL_REFRESH" : "Ververs",
    "SIDEPANEL_RELOADSETTINGS" : "Ververs Instellingen & Vul wachtwoord opnieuw in",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "Server bestaat niet",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Het lijkt erop dat de server niet bestaat.<br>Check je server adres.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "Server onbereikbaar",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "Ik kan niet verbinden.<br>Misschien doet je Firewall moeilijk.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Foutieve autorisatiegegevens",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "Ik kan niet inloggen met die gegevens.<br>Controleer ze eens, wil je?",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "Kon verbinding niet vinden",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "Er zijn geen eqFTP verbindingen/server gekoppeld aan dit project.<br>Verbind met de server of stel de momentele projectlocatie in als lokale path voor dit project.",
    "ERR_DIAG_ECONNRESET_TITLE" : "Server staat geen verbindingen toe.",
    "ERR_DIAG_ECONNRESET_CONTENT" : "Ik kan niet verbinden met de server. Het sluit me uit.<br>Probeer Brackets eens te herstarten.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "Je bent disconnected van de server",
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Verbinding afgebroken. Probeer om opnieuw te verbinden.",
    "ERR_DIAG_UNIVERSAL_TITLE" : "Er heeft zich een fout voorgedaan",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Kijk naar deze fout! Hoe kon dit ooit gebeuren?",

    "NOT_DIAG_CONNECTED" : "Verbonden met de server.",
    "NOT_DIAG_DISCONNECTED" : "Onverbonden met de server.",
    "NOT_DIAG_FILESDIFFERENT" : "There's a difference between local and remote files. Click here for more actions.", //NEW

    "PASSWDWIND_TITLE" : "Gelieve uw wachtwoord in te voeren",
    "PASSWDWIND_CONTENT" : "Uw wachtwoord voor eqFTP:",

    "CHECKDIFF_TITLE" : "There's difference between files", //NEW
    "CHECKDIFF_CONTENT" : "Remote and local copies of file are different. Please choose an action you would like to do.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Compare files", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Show changes", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Keep local", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Keep local copies for current queue", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Get remote", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Get remote copies for current queue", //NEW

    "SETTINGSWIND_TITLE" : "eqFTP Verbinding Beheer",
    "SETTINGSWIND_ERR_BLANKS" : "Oeps! Het lijkt erop dat iets fout is ingevuld. Kijk alles eens na en probeer opnieuw.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Iets liep compleet mis! Ik kon uw instellingen niet schrijven naar een bestand.",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Het path die u gebruikt wordt momenteel gebruikt door een andere verbinding.",
    "SETTINGSWIND_NOTIF_DONE" : "Alles is opgeslagen! :)",
    "SETTINGSWIND_SAVEDCONN" : "FTP Verbindingen zijn opgeslagen",
    "SETTINGSWIND_DELETECONN_HOVER" : "Verwijder deze verbinding",
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "You can't delete connection you're using now", //NEW
    "SETTINGSWIND_ADDCONN_HOVER" : "Voeg nieuwe verbinding toe",
    "SETTINGSWIND_ADDCONN_STRING" : "Maak nieuwe verbinding aan.",
    "SETTINGSWIND_DELETECONNCONF_1" : "Bevestig de verwijdering van ", // Those 2 strings are going like this: SETTINGSWIND_DELETECONNCONF_1 + VAL + SETTINGSWIND_DELETECONNCONF_2
    "SETTINGSWIND_DELETECONNCONF_2" : ".", // So if in your language there's no need in 2 strings, just leave one of them blank
    "SETTINGSWIND_OPENGLOBSET" : "Open Algemene FTP Instellingen...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Kies verbinding om bij te werken in de zijbalk, of maak een nieuwe.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Map voor projecten:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Map voor projecten met gedownloade bestanden:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Map voor instellingen:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Map voor instellings-bestand:",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Open de projecten NIET na het downloaden",
    "SETTINGSWIND_GLOB_MASTERPASSWORD" : "Master Password", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Verbindingsnaam:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Naam van de verbinding",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Server:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Protocol Type:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Gebruikersnaam:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "FTP Gebruikersnaam",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Wachtwoord:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "FTP Wachtwoord",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA key", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Click to select RSA key", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Choose path to RSA key", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Server Path:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Voer hier de path naar uw project (op de server) in.",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Lokaal Path:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Maakt een nieuwe map aan op standaardlocatie als geen locatie is gegeven",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Upload bestand direct na het opslaan",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Add to paused queue.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Zelfs als niet verbonden",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Deze optie verbind automatisch met de server zodra er een bestand is geopend van de server of een opgeslagen bestand in het momentele project (indien het project aangemaakt is door deze FTP extentie). Zo, Ik hoop dat deze zin duidelijk was :)",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Voer de locatie van uw project in",
    "SETTINGSWIND_GLOB_USELIST" : "Alternatieve map voor het ophalen",
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Verbinding-behouden interval:", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Waarde in seconden, standaard 10. Gebruik 0 om geen keep-alive commands te sturen en de verbinding te verbreken na het uitvoeren van een commando.",
    "SETTINGSWIND_GLOB_DEBUG" : "Debug:",
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Datum formaat:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "Amerikaans",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Europees",
    "SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Aziatisch",
    "SETTINGSWIND_GLOB_AUTOCLEAR" : "Automatisch legen Queue",
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Notificaties",
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Tijd Offset:",
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Gebruik deze optie om de juiste tijd in te stelen voor de aangepaste kolom",
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

    "QUEUE_TITLE" : "eqFTP Wachtrij",
    "QUEUE_HEADER_NAME" : "Naam",
    "QUEUE_HEADER_PATH" : "Path",
    "QUEUE_HEADER_FROM" : "Oorspronkelijke Path",
    "QUEUE_HEADER_TO" : "Bestemmings Path",
    "QUEUE_HEADER_STATUS" : "Status",
    "QUEUE_CLEARQ" : "Wis Wachtrij",
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
    "QUEUE_DONT_ADD_COMPLETED" : "Automatisch verwijder voltooide taken",
    
    "ERR_FILE_ACCESSDENIED" : "Toegang geweigerd. Controleer bestandsrechten.",
    "ERR_FILE_AUTHORIZATION" : "Autorisatiefout. Controleer je logingegevens.",
    "ERR_FILE_SERVNOEXIST" : "Server bestaat niet. Misschien een spellingsfout?",
    "ERR_FILE_SERVCANTREACH" : "Kon server niet bereiken. Controleer je  Firewall.",
    "ERR_FILE_FILESIZE0" : "Kan bestand niet downloaden. Bestandsgrootte is 0.",
    "ERR_FILE_DOWNLOAD" : "Kan bestand niet downloaden.",
    "ERR_FILE_UPLOAD" : "Can't upload file.", //NEW
    "ERR_FILE_DOESNTEXIST" : "Bestand bestaat niet",
    "ERR_FILE_CANTRENAME" : "Can't rename file: ", //NEW
    "ERR_FILE_CANTDELETE" : "Can't delete file: ", //NEW
    "ERR_FILE_CANTCREATEDIR" : "Can't create folder: ", //NEW
    "ERR_FILE_CANTDELETEDIR" : "Can't delete folder: ", //NEW
    "ERR_FILE_CANTCREATEFILE" : "Can't create file: ", //NEW
    "ERR_FOLDER_OPEN" : "Er is en fout opgetreden bij het openen van een folder als een project",

    "CONTEXTM_DOWNLOAD" : "Download",
    "CONTEXTM_UPLOAD" : "Upload",
    "CONTEXTM_ADDQUEUE" : "Voeg aan Wachtrij toe",
    "CONTEXTM_OPEN" : "Open",
    "CONTEXTM_DELETE" : "Verwijder",
    "CONTEXTM_RENAME" : "Hernoem",
    "CONTEXTM_REDOWNLOAD" : "Downloaden van server",
    "CONTEXTM_CREATEFILE" : "Create file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Create folder", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Selecteer server om te verbinden...",
    "OTHER_ERROR" : "Error",
    "OTHER_PAUSED" : "Gepauzeerd",
    "OTHER_COMPLETED" : "Klaar",
    "OTHER_CANCELLED" : "Gestopt",
    "OTHER_WAITING" : "Wachten...",
    "OTHER_OK" : "Ok",
    "OTHER_OFF" : "Off", //NEW
    "OTHER_CANCEL" : "Stoppen",
    "OTHER_APPLY" : "Aanpassen",
    "OTHER_SAVE" : "Save", //NEW
    "OTHER_CLOSE" : "Sluiten",
    "OTHER_DELETE" : "Verwijderen",
    "OTHER_CONFIRM_DELETE" : "Weet je zeker dat je dit item wilt verwijderen?",
    "OTHER_CONFIRM_SETTINGSCLOSE" : "There are some unsaved changes that will be lost if you click OK.<br>Do you want to proceed?", //NEW
    "OTHER_ERROR_EVENDISCONN" : "Kan bestand niet uploaden. 'Zelfs als niet verbonden' optie is uitgeschakeld.",
    "OTHER_ERROR_CANTREADSETTINGS" : "Can't read settings file. You probably mistyped your master password." //NEW
});