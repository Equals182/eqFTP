define({
    "ERR_LOADING" : "Carga Fallida :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Abrir Administrador de Conexiones",
    "SIDEPANEL_FILETREE_NAME" : "Nombre",
    "SIDEPANEL_FILETREE_SIZE" : "Tamaño",
    "SIDEPANEL_FILETREE_TYPE" : "Tipo",
    "SIDEPANEL_FILETREE_MODIFIED" : "Modificado",
    "SIDEPANEL_CONDISCONNECT" : "(Des)conectar",
    "SIDEPANEL_REFRESH" : "Refrescar",
    "SIDEPANEL_RELOADSETTINGS" : "Recargar configuración y reingresar la contraseña",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "El servidor no existe",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Parece que el servidor no existe.<br>Revise el apartado de Servidor en la configuración de conexión.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "No se puede conectar al servidor",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "No puedo conectar al servidor.<br>Tal vez tu Firewall no me deja hacerlo.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Datos de autenticación incorrectos",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "No puedo autenticar con los datos que me diste.<br>Por favor revísalos.",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "No se puede encontrar la conexión",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "No hay ningún servidor conectado ni conexiones eqFTP asociadas al proyecto actual.<br>Conéctese a un servidor o especifique la carpeta del proyecto actual como directorio local para conexión en la configuración.",
    "ERR_DIAG_ECONNRESET_TITLE" : "Servidor esta rechazando conexiones",
    "ERR_DIAG_ECONNRESET_CONTENT" : "No me puedo conectar al servidor, el no me lo permite.<br>Prueba reiniciando Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "You've been disconnected from server", //NEW
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Connection aborted. Trying to reconnect.", //NEW
    "ERR_DIAG_UNIVERSAL_TITLE" : "Aquí hay un error",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Mira este error! Como pudo pasar esto?",

    "NOT_DIAG_CONNECTED" : "Connected to server.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Disconnected from server.", //NEW
    "NOT_DIAG_FILESDIFFERENT" : "There's a difference between local and remote files. Click here for more actions.", //NEW

    "PASSWDWIND_TITLE" : "Por favor ingrese su contraseña",
    "PASSWDWIND_CONTENT" : "Su contraseña para eqFTP:",

    "CHECKDIFF_TITLE" : "There's difference between files", //NEW
    "CHECKDIFF_CONTENT" : "Remote and local copies of file are different. Please choose an action you would like to do.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Compare files", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Show changes", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Keep local", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Keep local copies for current queue", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Get remote", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Get remote copies for current queue", //NEW

    "SETTINGSWIND_TITLE" : "Administrador de conexiones eqFTP",
    "SETTINGSWIND_ERR_BLANKS" : "Oops! Parece que algo salio mal. Revisa los datos y prueba nuevamente.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Algo salio completamente mal! No puedo escribir la configuración en el archivo!",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "El directorio que estas intentando ingresar esta siendo utilizado por otra conexión.",
    "SETTINGSWIND_NOTIF_DONE" : "Todo se guardo! :)",
    "SETTINGSWIND_SAVEDCONN" : "Conexiones FTP guardas",
    "SETTINGSWIND_DELETECONN_HOVER" : "Borrar esta conexión",
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "You can't delete connection you're using now", //NEW
    "SETTINGSWIND_ADDCONN_HOVER" : "Agregar nueva conexión",
    "SETTINGSWIND_ADDCONN_STRING" : "Crear nueva conexión...",
    "SETTINGSWIND_DELETECONNCONF_1" : "Por favor confirme el borrado de la conexión ", // Those 2 strings are going like this: SETTINGSWIND_DELETECONNCONF_1 + VAL + SETTINGSWIND_DELETECONNCONF_2
    "SETTINGSWIND_DELETECONNCONF_2" : ".", // So if in your language there's no need in 2 strings, just leave one of them blank
    "SETTINGSWIND_OPENGLOBSET" : "Abrir configuración global de FTP...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Seleccione la conexión a editar en el panel lateral o cree una nueva.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Carpeta para proyectos:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Carpeta para proyectos con archivos descargados:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Carpeta para configuración:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Carpeta para el archivo de configuración",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "No abra los proyectos después de la descraga",
    "SETTINGSWIND_GLOB_MASTERPASSWORD" : "Master Password", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Nombre de conexión:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Digite el nombre de la conexión",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Servidor:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Tipo de protocolo:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Nombre de usuario:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "Usuario FTP",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Contraseña:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "Contraseña FTP",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA key", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Click to select RSA key", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Choose path to RSA key", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Directorio remoto:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Digite el directorio remoto de la carpeta raíz del proyecto",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Directorio local:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Si no se define crea una nueva carpeta en el directorio por defecto",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Subir archivo al guardar",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Add to paused queue.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Aun si esta desconectado",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Esta opción automáticamente se conecta al servidor cuando un archivo guardado es abierto del servidor o el archivo y el proyecto fueron creados por esta extensión.",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Inserte la ubicación del proyecto actual",
    "SETTINGSWIND_GLOB_USELIST" : "Recuperación de carpeta alternativa",
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Intervalo de comandos para mantener activo:", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Valor en segundos. Valor recomendado 10. Use cero para prohibir  los comandos para mantener activo y desconectar del servidor  cada vez que el comando es ejecutado.",
    "SETTINGSWIND_GLOB_DEBUG" : "Depurar:",
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Formato de fecha:",
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

    "QUEUE_TITLE" : "Cola de eqFTP",
    "QUEUE_HEADER_NAME" : "Nombre",
    "QUEUE_HEADER_PATH" : "Directorio",
    "QUEUE_HEADER_FROM" : "Directorio de fuente",
    "QUEUE_HEADER_TO" : "Directorio destino",
    "QUEUE_HEADER_STATUS" : "Estado",
    "QUEUE_CLEARQ" : "Limpiar cola",
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
    
    "ERR_FILE_ACCESSDENIED" : "Acceso denegado. Revise los permisos del archivo.",
    "ERR_FILE_AUTHORIZATION" : "Error de autenticación. Revise su usuario y contraseña.",
    "ERR_FILE_SERVNOEXIST" : "El servidor no existe. Tal vez tu lo escribiste mal.",
    "ERR_FILE_SERVCANTREACH" : "No se puede conectar al servidor. Revise el Firewall.",
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

    "CONTEXTM_DOWNLOAD" : "Descargar",
    "CONTEXTM_UPLOAD" : "Subir",
    "CONTEXTM_ADDQUEUE" : "Añadir a la cola",
    "CONTEXTM_OPEN" : "Abrir",
    "CONTEXTM_DELETE" : "Borrar",
    "CONTEXTM_RENAME" : "Renombrar",
    "CONTEXTM_REDOWNLOAD" : "Download from server", //NEW
    "CONTEXTM_CREATEFILE" : "Create file", //NEW
    "CONTEXTM_CREATEFOLDER" : "Create folder", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Seleccione el servidor remoto a conectar...",
    "OTHER_ERROR" : "Error",
    "OTHER_PAUSED" : "Pausado",
    "OTHER_COMPLETED" : "Completado",
    "OTHER_CANCELLED" : "Cancelado",
    "OTHER_WAITING" : "Esperando",
    "OTHER_OK" : "Aceptar",
    "OTHER_OFF" : "Off", //NEW
    "OTHER_CANCEL" : "Cancelar",
    "OTHER_APPLY" : "Aplicar",
    "OTHER_SAVE" : "Save", //NEW
    "OTHER_CLOSE" : "Cerrar",
    "OTHER_DELETE" : "Borrar",
    "OTHER_CONFIRM_DELETE" : "Are you sure you want to delete this item?", //NEW
    "OTHER_CONFIRM_SETTINGSCLOSE" : "There are some unsaved changes that will be lost if you click OK.<br>Do you want to proceed?", //NEW
    "OTHER_ERROR_EVENDISCONN" : "Can't upload file. 'Even If Disconnected' option is off.", //NEW
    "OTHER_ERROR_CANTREADSETTINGS" : "Can't read settings file. You probably mistyped your master password." //NEW
});