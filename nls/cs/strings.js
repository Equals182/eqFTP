define({
    "ERR_LOADING" : "Načítání selhalo :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Otevřít správce připojení",
    "SIDEPANEL_FILETREE_NAME" : "Jméno",
    "SIDEPANEL_FILETREE_SIZE" : "Velikost",
    "SIDEPANEL_FILETREE_TYPE" : "Typ",
    "SIDEPANEL_FILETREE_MODIFIED" : "Upraveno",
    "SIDEPANEL_CONDISCONNECT" : "Připojit/odpojit",
    "SIDEPANEL_REFRESH" : "Obnovit",
    "SIDEPANEL_RELOADSETTINGS" : "Načíst nastavení a zvonu zadat heslo",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "Server neexistuje",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Vypadá to, že server neexistuje.<br>Zkontrolujte server zadaný v Nastavení připojení.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "Nemohu se připojit na server",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "Nemohu se připojit na server.<br>Možná mě brání Váš Firewall.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Špatná Autorizační data",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "Nemohu se přihlásit s těmito autorizačními údaji (přihlašovací jméno, heslo).<br>Prosím zkontrolujte je.",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "Nemohu nalézt připojení",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "S aktuálním projektem nejsou svázány žádné eqFTP připojení ani připojeny žádné servery.<br>Připojte se k serveru nebo nastavte cestu současného projektu jako místní cestu pro připojení.",
    "ERR_DIAG_ECONNRESET_TITLE" : "Server zamítnul připojení",
    "ERR_DIAG_ECONNRESET_CONTENT" : "Nemohu se připojit k serveru, nedovolí mi to.<br>Zkuste restartovat Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "Byl/a jste odpojeni od serveru", 
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Připojení zrušeno. Zkouším se připojit znovu...", 
    "ERR_DIAG_UNIVERSAL_TITLE" : "Nastala chyba",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Podívejte se na tuto chybu! Jak se to mohlo stát?",

    "NOT_DIAG_CONNECTED" : "Připojen k serveru.",
    "NOT_DIAG_DISCONNECTED" : "Odpojen od serveru.",
    "NOT_DIAG_FILESDIFFERENT" : "There's a difference between local and remote files. Click here for more actions.", //NEW

    "PASSWDWIND_TITLE" : "Prosím vložte své heslo",
    "PASSWDWIND_CONTENT" : "Vaše heslo pro eqFTP:",

    "CHECKDIFF_TITLE" : "Nalezen rozdíl mezi složkami",
    "CHECKDIFF_CONTENT" : "Vzdálená verze souboru se liší od lokální. Prosím vyberte, jakou akci si přejete provést.",
    "CHECKDIFF_BUTTON_COMPARE" : "Porovnat soubory",
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Ukázat změny",
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Ponechat lokální",
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Ponechat lokální kopie pro aktuální frontu",
    "CHECKDIFF_BUTTON_GETREMOTE" : "Získat vzdálenou",
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Získat vzdálenou kopii pro aktuální frontu",

    "SETTINGSWIND_TITLE" : "eqFTP Správce připojení",
    "SETTINGSWIND_ERR_BLANKS" : "Jejda! Vypadá to, že něco je špatně. Zkontrolujte zadávací pole a zkuste to znovu.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Něco je totálně špatně! Nemohu zapsat tyto anstavení do souboru!",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Cesta kterou se pokoušíte zadat je aktuálně používána jiným připojením.",
    "SETTINGSWIND_NOTIF_DONE" : "Vše je uloženo! :)",
    "SETTINGSWIND_SAVEDCONN" : "FTP Připojení uloženo",
    "SETTINGSWIND_DELETECONN_HOVER" : "Smazat toto připojení",
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "Nemůžete smazat připojení které právě používáte",
    "SETTINGSWIND_ADDCONN_HOVER" : "Přidat nové připojení",
    "SETTINGSWIND_ADDCONN_STRING" : "Vytvořit nové připojení...",
    "SETTINGSWIND_DELETECONNCONF_1" : "Prosím potvrďte, že chcete připojení ", // Those 2 strings are going like this: SETTINGSWIND_DELETECONNCONF_1 + VAL + SETTINGSWIND_DELETECONNCONF_2
    "SETTINGSWIND_DELETECONNCONF_2" : " smazat.", // So if in your language there's no need in 2 strings, just leave one of them blank
    "SETTINGSWIND_OPENGLOBSET" : "Otevřít globální nastavení FTP...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Vyberte připojení, které chcete upravit v postraním panelu, nebo vytvořte nové.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Složka pro projekty:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Adresář pro projekty se staženými soubory:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Složka pro nastavení:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Adresář pro soubor nastavení",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Neotevírej projekty po stažení",
    "SETTINGSWIND_GLOB_MASTERPASSWORD" : "Hlavní heslo",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Název připojení:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Vložte jméno připojení",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Server:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Typ protokolu:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Uživatelské jméno:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "FTP Uživatelské jméno",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Heslo:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "FTP heslo",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA key", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Click to select RSA key", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Choose path to RSA key", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Vzdálená cesta:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Vložte vzdálenou cestu do kořenové složky projektu",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Místní cesta:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Pokud je ponecháno prázdné, vytvoří novou složku ve výchozím umístění",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Nahrát soubor při uložení",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Add to paused queue.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "I když je odpojeno",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Automatické připojení k serveru pokud je uložený soubor otevřen ze serveru nebo je uvnitř současného projektu který byl vytvořený tímto FTP rozšířením. Uf, vážně doufám že jsem to vysvětlil dobře...",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Vložit cestu současného projektu",
    "SETTINGSWIND_GLOB_USELIST" : "Získání alternativních složek",
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Udržování připojení", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Hodnota v sekundách. Doporučená hodnota je 10. Při použití nuly nebude připojení udržováno a bude uzavřeno po každém provedení příkazu.",
    "SETTINGSWIND_GLOB_DEBUG" : "Ladění:",
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Formát data:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "Americký",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Evropský",
    "SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Asijský",
    "SETTINGSWIND_GLOB_AUTOCLEAR" : "Automaticky čistit frontu",
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Upozornění",
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Korekce času:",
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Použijte na nastavení správného času v kolonce Upraveno",
    "SETTINGSWIND_GLOB_CONNECTIONTAB" : "Připojení",
    "SETTINGSWIND_GLOB_AUTOMATIZATIONTAB" : "Automatizace",
    "SETTINGSWIND_GLOB_ADVANCEDTAB" : "Pokročilé",
    "SETTINGSWIND_GLOB_AUTO_SET_TITLE" : "Nastavit automatizaci:",
    "SETTINGSWIND_GLOB_AUTO_SYNC" : "Synchronizovat",
    "SETTINGSWIND_GLOB_AUTO_CLASSIC" : "Klasické",
    "SETTINGSWIND_GLOB_AUTO_SYNC_SELECT_TITLE" : "Vyberte, co chcete synchronizovat",
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILECREATION" : "Vytvoření souboru",
    "SETTINGSWIND_GLOB_AUTO_SYNC_FOLDERCREATION" : "Vytvoření složky",
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILEUPLOAD" : "Aktualizace souboru",
    "SETTINGSWIND_GLOB_AUTO_SYNC_RENAMING" : "Přejmenování",
    "SETTINGSWIND_GLOB_AUTO_SYNC_MOVING" : "Přesunutí",
    "SETTINGSWIND_GLOB_AUTO_SYNC_DELETING" : "Smazání",
    "SETTINGSWIND_GLOB_AUTO_SYNC_EXTRASETTINGS_TITLE" : "Extra nastavení",
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF" : "Zkontrolovat rozdíly",
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF_EXPLAIN" : "Když otevřete lokální nebo vzdálený soubor",
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_TITLE" : "Ignorovat seznam",
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_EXPLAIN" : "Stejná syntaxe jako v .gitignore",
    "SETTINGSWIND_GLOB_SYNCLOCPROJWCONN" : "Open related Local project after switching connection and vice versa", //NEW
    "SETTINGS_NOTIF_RELOADED" : "Settings were successfully reloaded.", //NEW
    "SETTINGS_ERROR_RELOADED" : "Can't reload settings.", //NEW

    "QUEUE_TITLE" : "eqFTP fronta",
    "QUEUE_HEADER_NAME" : "Jméno",
    "QUEUE_HEADER_PATH" : "Cesta",
    "QUEUE_HEADER_FROM" : "Zdrojová cesta",
    "QUEUE_HEADER_TO" : "Cílová cesta",
    "QUEUE_HEADER_STATUS" : "Status",
    "QUEUE_CLEARQ" : "Vyčistit frontu",
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
    "QUEUE_DONT_ADD_COMPLETED" : "Automaticky vyčistit dokončené úlohy", 
    
    "ERR_FILE_ACCESSDENIED" : "Přístup odepřen. Zkontrolujte oprávnění souboru.",
    "ERR_FILE_AUTHORIZATION" : "Chyba autorizace. Zkontrolujte přihlašovací údaje.",
    "ERR_FILE_SERVNOEXIST" : "Server neexistuje. Zkontrolujte zadané údaje.",
    "ERR_FILE_SERVCANTREACH" : "Nemohu se připojit na server. Zkontrolujte Firewall.",
    "ERR_FILE_FILESIZE0" : "Nemohu stáhnout soubor. Velikost je 0.", 
    "ERR_FILE_DOWNLOAD" : "Nemohu stáhnout soubor.", 
    "ERR_FILE_UPLOAD" : "Can't upload file.", //NEW
    "ERR_FILE_DOESNTEXIST" : "Soubor neexistuje.",
    "ERR_FILE_CANTRENAME" : "Nemohu přejmenovat soubor: ",
    "ERR_FILE_CANTDELETE" : "Can't delete file: ", //NEW
    "ERR_FILE_CANTCREATEDIR" : "Can't create folder: ", //NEW
    "ERR_FILE_CANTDELETEDIR" : "Can't delete folder: ", //NEW
    "ERR_FILE_CANTCREATEFILE" : "Can't create file: ", //NEW
    "ERR_FOLDER_OPEN" : "Vznikla chyba při otevírání složky jako projekt.", 

    "CONTEXTM_DOWNLOAD" : "Stáhnout",
    "CONTEXTM_UPLOAD" : "Nahrát",
    "CONTEXTM_ADDQUEUE" : "Přidat do fronty",
    "CONTEXTM_OPEN" : "Otevřít",
    "CONTEXTM_DELETE" : "Smazat",
    "CONTEXTM_RENAME" : "Přejmenovat",
    "CONTEXTM_REDOWNLOAD" : "Stáhnout ze serveru",
    "CONTEXTM_CREATEFILE" : "Create file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Create folder", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Vyberte připojení na vzdálený server...",
    "OTHER_ERROR" : "Chyba",
    "OTHER_PAUSED" : "Pozastaveno",
    "OTHER_COMPLETED" : "Dokončeno",
    "OTHER_CANCELLED" : "Zrušeno",
    "OTHER_WAITING" : "Čekání",
    "OTHER_OK" : "Ok",
    "OTHER_OFF" : "Vyp.",
    "OTHER_CANCEL" : "Zrušit",
    "OTHER_APPLY" : "Použít",
    "OTHER_SAVE" : "Uložit",
    "OTHER_CLOSE" : "Zavřít",
    "OTHER_DELETE" : "Smazat",
    "OTHER_CONFIRM_DELETE" : "Jste si jisti, že chcete smazat tuto položku", 
    "OTHER_ERROR_EVENDISCONN" : "Nemohu nahrát soubor. Nastavení 'I když je odpojeno' je zakázáno.", 
    "OTHER_ERROR_CANTREADSETTINGS" : "Nemohu načíst nastavení. Je možné, že jste zadali špatné hlavní heslo."
});