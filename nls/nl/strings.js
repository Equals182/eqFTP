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
    "ERR_DIAG_ECONNABORTED_TITLE" : "You've been disconnected from server", //NEW
	"ERR_DIAG_ECONNABORTED_CONTENT" : "Connection aborted. Trying to reconnect.", //NEW
	"ERR_DIAG_UNIVERSAL_TITLE" : "Er heeft zich een fout voorgedaan",
	"ERR_DIAG_UNIVERSAL_CONTENT" : "Kijk naar deze fout! Hoe kon dit ooit gebeuren?",

    "NOT_DIAG_CONNECTED" : "Connected to server.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Disconnected from server.", //NEW

	"PASSWDWIND_TITLE" : "Gelieve uw wachtwoord in te voeren",
	"PASSWDWIND_CONTENT" : "Uw wachtwoord voor eqFTP:",

	"SETTINGSWIND_TITLE" : "eqFTP Verbinding Beheer",
	"SETTINGSWIND_ERR_BLANKS" : "Oeps! Het lijkt erop dat iets fout is ingevuld. Kijk alles eens na en probeer opnieuw.",
	"SETTINGSWIND_ERR_CANTWRITE" : "Iets liep compleet mis! Ik kon uw instellingen niet schrijven naar een bestand.",
	"SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Het path die u gebruikt wordt momenteel gebruikt door een andere verbinding.",
	"SETTINGSWIND_NOTIF_DONE" : "Alles is opgeslagen! :)",
	"SETTINGSWIND_SAVEDCONN" : "FTP Verbindingen zijn opgeslagen",
	"SETTINGSWIND_DELETECONN_HOVER" : "Verwijder deze verbinding",
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
	"SETTINGSWIND_GLOB_STORESAFELY" : "Wachtwoorden veilig opslaan",
	"SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Verbindingsnaam:",
	"SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Naam van de verbinding",
	"SETTINGSWIND_GLOB_SERVER_TITLE" : "Server:",
	"SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Protocol Type:",
	"SETTINGSWIND_GLOB_USERNAME_TITLE" : "Gebruikersnaam:",
	"SETTINGSWIND_GLOB_USERNAME_FIELD" : "FTP Gebruikersnaam",
	"SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Wachtwoord:",
	"SETTINGSWIND_GLOB_PASSWORD_FIELD" : "FTP Wachtwoord",
	"SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Server Path:",
	"SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Voer hier de path naar uw project (op de server) in.",
	"SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Lokaal Path:",
	"SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Maakt een nieuwe map aan op standaardlocatie als geen locatie is gegeven",
	"SETTINGSWIND_GLOB_UPLOADONSAVE" : "Upload bestand direct na het opslaan",
	"SETTINGSWIND_GLOB_EVENDISCONN" : "Zelfs als niet verbonden",
	"SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Deze optie verbind automatisch met de server zodra er een bestand is geopend van de server of een opgeslagen bestand in het momentele project (indien het project aangemaakt is door deze FTP extentie). Zo, Ik hoop dat deze zin duidelijk was :)",
	"SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Voer de locatie van uw project in",
	"SETTINGSWIND_GLOB_USELIST" : "Alternatieve map voor het ophalen",
	"SETTINGSWIND_GLOB_KEEPALIVE" : "Verbinding-behouden interval", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
	"SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Waarde in seconden, standaard 10. Gebruik 0 om geen keep-alive commands te sturen en de verbinding te verbreken na het uitvoeren van een commando.",
	"SETTINGSWIND_GLOB_DEBUG" : "Debug:",
	"SETTINGSWIND_GLOB_TIMEFORMAT" : "Datum formaat:",
	"SETTINGSWIND_GLOB_TIMEFORMAT_US" : "Amerikaans",
	"SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Europees",
	"SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Asian", //NEW
	"SETTINGSWIND_GLOB_SYNC" : "Synchroniseren",
	"SETTINGSWIND_GLOB_SYNC_DESC" : "Zal bestand hernoemen of verwijderen op de server nadat het is veranderd in Brackets.",
	"SETTINGSWIND_GLOB_AUTOCLEAR" : "Auto-clear Queue", //NEW
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Notifications", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Time Offset:", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Use this option to set correct time for Modified column", //NEW

	"QUEUE_TITLE" : "eqFTP Wachtrij",
	"QUEUE_TITLE_HOVER" : "Klik om de eqFTP Wachtrij te openen",
	"QUEUE_HEADER_NAME" : "Naam",
	"QUEUE_HEADER_PATH" : "Path",
	"QUEUE_HEADER_FROM" : "Oorspronkelijke Path",
	"QUEUE_HEADER_TO" : "Bestemmings Path",
	"QUEUE_HEADER_STATUS" : "Status",
	"QUEUE_REMOVE" : "Verwijder van Wachtrij",
	"QUEUE_CONTEXTM_STARTQ" : "Start Taak",
	"QUEUE_CONTEXTM_PAUSEQ" : "Pauzeer Taak",
	"QUEUE_CONTEXTM_CLEARQ" : "Wis Wachtrij",
	"QUEUE_CONTEXTM_CLEARCOMPQ" : "Wis Complete Taken",
	"QUEUE_CONTEXTM_CLEARFAILQ" : "Wis Mislukte Taken",
	"QUEUE_CONTEXTM_CLEARPAUSQ" : "Clear Paused Tasks", //NEW
	"QUEUE_CONTEXTM_RESTARTFAILQ" : "Herstart Mislukte Taken",
	"QUEUE_DONT_ADD_COMPLETED" : "Auto-clear Completed tasks", //NEW
	"ERR_FILE_ACCESSDENIED" : "Toegang geweigerd. Controleer bestandsrechten.",
	"ERR_FILE_AUTHORIZATION" : "Autorisatiefout. Controleer je logingegevens.",
	"ERR_FILE_SERVNOEXIST" : "Server bestaat niet. Misschien een spellingsfout?",
	"ERR_FILE_SERVCANTREACH" : "Kon server niet bereiken. Controleer je  Firewall.",
	"ERR_FILE_FILESIZE0" : "Can't download file. Filesize is 0.", //NEW
    "ERR_FILE_DOWNLOAD" : "Can't download file.", //NEW
    "ERR_FILE_DOESNTEXIST" : "File doesn't exist", //NEW
    "ERR_FOLDER_OPEN" : "There's an error opening folder as project", //NEW

	"CONTEXTM_DOWNLOAD" : "Download",
	"CONTEXTM_UPLOAD" : "Upload",
	"CONTEXTM_ADDQUEUE" : "Voeg aan Wachtrij toe",
	"CONTEXTM_OPEN" : "Open",
	"CONTEXTM_DELETE" : "Verwijder",
	"CONTEXTM_RENAME" : "Hernoem",
	"CONTEXTM_REDOWNLOAD" : "Download from server", //NEW

	"OTHER_SELECT_SERVER_DROPDOWN" : "Selecteer server om te verbinden...",
	"OTHER_ERROR" : "Error",
	"OTHER_PAUSED" : "Gepauzeerd",
	"OTHER_COMPLETED" : "Klaar",
	"OTHER_CANCELLED" : "Gestopt",
	"OTHER_WAITING" : "Wachten...",
	"OTHER_OK" : "Ok",
	"OTHER_CANCEL" : "Stoppen",
	"OTHER_APPLY" : "Aanpassen",
	"OTHER_CLOSE" : "Sluiten",
	"OTHER_DELETE" : "Verwijderen",
	"OTHER_CONFIRM_DELETE" : "Are you sure you want to delete this item?", //NEW
	"OTHER_ERROR_EVENDISCONN" : "Can't upload file. 'Even If Disconnected' option is off.", //NEW
});