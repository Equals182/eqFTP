define({
    'eqftp__toolbar__title' : "Open eqFTP Panel",
    
    /**
     * SERVER DROPDOWN
     */
    
    'eqftp__panel__search_input__placeholder' : "Search or Connect directly",
    'eqftp__panel__server_list__item__host' : "Host:",
    'eqftp__panel__server_list__item__user' : "User:",
    
    /**
     * OPEN FILE/FOLDER DIALOGS
     */
    
    'eqftp__file_opening_dialog_title' : "Choose file",
    'eqftp__files_opening_dialog_title' : "Choose files",
    'eqftp__folder_opening_dialog_title' : "Choose folder",
    'eqftp__folders_opening_dialog_title' : "Choose folders",
    'eqftp__file_saving_dialog_title' : "Save file",
    
    /**
     * SETTINGS MENU
     */
    
    // Option to encrypt settings file
    "eqftp__settings__encrypt_settings_file" : "Encrypt settings file",
    // This will be the label of section in Settings window
    "eqftp__settings_file_label" : "Settings file",
    "eqftp__settings_file_placeholder" : "Choose settings file",
    // This will be right next to input, so "Create" should refer to "Choose settings file"
    "eqftp__settings_file_create" : "Create",
    // This will be shown as title of *Save Dialog Window*
    "eqftp__settings_file_create_dialog_title" : "Save settings file",
    "eqftp__settings__main_settings_header" : "Main settings",
    "eqftp__settings__connections_settings_header" : "Connections",
    
    /**
     * SETTINGS MENU, MAIN TAB
     */
    
    "eqftp__settings__main__local_projects_root" : "Local projects' root",
    "eqftp__settings__main__settings_folder" : "Settings' folder",
    "eqftp__settings__main__use_master_password" : "Use master password",
    "eqftp__settings__main__use_notifications" : "Notifications",
    "eqftp__settings__main__use_debug" : "Debug",
    
    "eqftp__settings__folder_for_projects_label" : "Folder for projects",
    "eqftp__settings__folder_for_projects_placeholder" : "Choose folder",
    "eqftp__settings__folder_for_projects_hint" : "Choose folder where eqFTP will save downloaded files by default. Each file will be saved in its own respective directory.",
    "eqftp__settings__time_format_label" : "Timestamp format",
    "eqftp__settings__time_format_placeholder" : "dd mm yyyy",
    "eqftp__settings__time_format_hint" : "Use dd - date, MM - month, yy - short year, yyyy - full year, hh - hours, mm - minutes, ss - seconds, SSS - milliseconds, O - timezone offset +hm",
    "eqftp__settings__debug_mode_label" : "Debug mode",
    "eqftp__settings__debug_mode_hint" : "Turn on debug mode. Everything will be printed in console.",
    
    /**
     * SETTINGS MENU, CONNECTIONS TAB
     */
    
    "eqftp__connection__create_new_button" : "Create Connection",
    
    "eqftp__connection__name_label" : "Connection's name",
    // This will be placed in Connection's name when it's empty
    "eqftp__connection__name_placeholder" : "New Connection",
    "eqftp__connection__name_hint" : "This name will be shown in list of connections",
    
    "eqftp__connection__protocol_label" : "Connection's protocol",
    "eqftp__connection__protocol_placeholder" : "FTP",
    "eqftp__connection__protocol_hint" : "FTP or SFTP",
    
    "eqftp__connection__server_label" : "Server",
    "eqftp__connection__server_placeholder" : "IP or domain name",
    "eqftp__connection__server_hint" : "Some kind of address to connect to. You can paste here a string in format ftp://username:password@servername:port.",
    
    "eqftp__connection__port_label" : "Port",
    "eqftp__connection__port_placeholder" : "21",
    "eqftp__connection__port_hint" : "By default it's 21 for FTP and 22 for SFTP.",
    
    "eqftp__connection__password_label" : "Password",
    "eqftp__connection__password_placeholder" : "****",
    "eqftp__connection__password_hint" : "Password to server or RSA key.",
    
    "eqftp__connection__login_label" : "Login",
    "eqftp__connection__login_placeholder" : "Login to server",
    "eqftp__connection__login_hint" : "Can be root or something else. Check your server settings.",
    
    "eqftp__connection__localpath_label" : "Local path",
    "eqftp__connection__localpath_placeholder" : "Path to local folder",
    "eqftp__connection__localpath_hint" : "By default eqFTP will create a new folder in Folder for projects with name of this Connection",
    "eqftp__connection__localpath_windowtitle" : "Choose local folder for Connection",
    
    "eqftp__connection__rsa_label" : "RSA Key",
    "eqftp__connection__rsa_placeholder" : "Path to RSA key",
    "eqftp__connection__rsa_hint" : "Your server might need it",
    "eqftp__connection__rsa_windowtitle" : "Choose RSA key for Connection",
    
    "eqftp__connection__remotepath_label" : "Remote path",
    "eqftp__connection__remotepath_placeholder" : "Path to folder on server",
    
    "eqftp__connection__basic_settings" : "Show basic settings",
    "eqftp__connection__addtional_settings" : "Show additional settings",
    
    "eqftp__connection__check_difference_label" : "Check difference between files",
    "eqftp__connection__check_difference_hint" : "eqFTP will check difference between local and remote copy of file when you try download or upload it.",
    
    "eqftp__connection__autoupload_label" : "Automatically upload changed files",
    "eqftp__connection__autoupload_hint" : "eqFTP will automatically upload any changed file in project's directory.",
    "eqftp__connection__remotepath_hint" : "By default your server decides where to start browsing.",
    
    "eqftp__connection__ignore_list_label" : "Ignore list",
    "eqftp__connection__ignore_list_placeholder" : "Use gitignore syntax",
    "eqftp__connection__ignore_list_hint" : "eqFTP will use these rules on auto-upload function.",
    
    "eqftp__connection__keep_alive_label" : "Keep Alive interval",
    "eqftp__connection__keep_alive_placeholder" : "By default its 10",
    "eqftp__connection__keep_alive_hint" : "eqFTP will send some commands to prevent disconnection by server.",
    
    "eqftp__connection__removal_warning_text" : "Remove this Connection? This cannot be undone.",
    
    // connection_hash is a parameter - leave it as it is
    "eqftp__domain__connection__create__error" : "Cannot create connection. No connection_hash passed.",
    
    // Connection's name will be appended after this text, so leave a space in the end of a string
    "eqftp__connection__event__closed" : "Connection closed: ",
    "eqftp__connection__event__opened" : "Connection opened: ",
    "eqftp__connection__event__error" : "Connection error: ",
    
    "eqftp__connection__errors__ENOTFOUND" : "Server not found. Upstream DNS server replied that there are no matching records.",
    "eqftp__connection__errors__ECONNREFUSED" : "No connection could be made because the target machine actively refused it. This usually results from trying to connect to a service that is inactive on the foreign host.",
    "eqftp__connection__errors__ECONNRESET" : "A connection was forcibly closed by a peer. This normally results from a loss of the connection on the remote socket due to a timeout or reboot.",
    "eqftp__connection__errors__ENOENT" : "No entity (file or directory) could be found by the given path.",
    "eqftp__connection__errors__ETIMEDOUT" : "A connect or send request failed because the connected party did not properly respond after a period of time. ",
    // host will be appended to phrase:
    "eqftp__connection__temporary_prefix" : "Temporary connection to ",
    
    "eqftp__password_label" : "Password for settings",
    "eqftp__password_placeholder" : "Enter your password",
    
    "eqftp__file_tree__type_directory" : "folder",
    "eqftp__file_tree__type_file" : "file",
    
    /**
     * CONTEXT MENU COMMANDS
     */
    
    "eqftp__context__upload" : "Upload",
    
    /**
     * WELCOME SCREEN TEXT
     */
    
    "eqftp__welcome_screen__h1" : "Hi",
    "eqftp__welcome_screen__text" : "I'm glad to present you latest version of eqFTP.\r\nHope you'll like it.",
    "eqftp__welcome_screen__tour" : "Take a tour",
    "eqftp__welcome_screen__start" : "Let me work already",
    
    /**
     * BUTTONS
     */
    
    // Universal button that says "Cancel". Should close dialogs and prevent from going forward in stuff...
    "eqftp__button_cancel" : "Cancel",
    // Universal button that says "Continue". Some sort of "OK", but more human-ish version, I think.
    "eqftp__button_continue" : "Continue",
    // Universal button that says "Yes". Literally means acceptance of offer.
    "eqftp__button_yes" : "Yes",
    // Universal button that says "No". Well, it's opposite of Yes - offer's denying.
    "eqftp__button_no" : "No",
    "eqftp__button_save" : "Save",
    
    /**
     * SYSTEM WARNINGS
     */
    
    "error__settings_process_fromJSON_not_string" : "Can't read settings data. It's not a text.",
    "error__settings_process_toJSON_not_object" : "Can't save settings data. It's not an object.",
    "error__settings_process_fromJSON_not_json" : "Can't read settings data. It's not a JSON object.",
    
    "warning__password_ask_cancel" : "User cancelled password dialog.",
    
    /**
     * LOGS
     */
    
    "eqftp__log__settings__save_success" : "Settings saved",
    "eqftp__log__settings__save_error" : "Cannot save settings",
    "eqftp__log__settings__load_success" : "Settings loaded",
    
    "eqftp__log__error__folder_not_found" : "Requested folder was not found",
    
    // Combination of strings: 1 + value + 2. Leave one of strings empty if you don't need them, but do not delete it.
    "eqftp__log__error__folder_not_found__exact__1" : "This folder was not found: ",
    "eqftp__log__error__folder_not_found__exact__2" : "",
    "eqftp__log__connection_by_localpath__not_found__1" : "Can't find connection related to this path: ",
    "eqftp__log__connection_by_localpath__not_found__2" : "",
    "eqftp__log__upload_file__error__1" : "There was an error uploading file ",
    "eqftp__log__upload_file__error__2" : "",
    "eqftp__log__upload_file__success__1" : "File ",
    "eqftp__log__upload_file__success__2" : " successfully uploaded",
    "eqftp__log__download_file__error__1" : "There was an error downloading file ",
    "eqftp__log__download_file__error__2" : "",
    "eqftp__log__download_file__success__1" : "File ",
    "eqftp__log__download_file__success__2" : " successully downloaded",
    "eqftp__log__ls__error__1" : "There was an error listing folder ",
    "eqftp__log__ls__error__2" : "",
    "eqftp__log__ls__success__1" : "Folder ",
    "eqftp__log__ls__success__2" : " successully listed",
    "eqftp__log__file_is_ignored__1" : "File ",
    "eqftp__log__file_is_ignored__2" : " was not uploaded due to ignore setting",
    
    /**
     * FILESIZES
     */
    
    "eqftp__filesize_bytes" : "bytes",
    "eqftp__filesize_kilobytes" : "kb",
    "eqftp__filesize_megabytes" : "mb",
    "eqftp__filesize_gigabytes" : "gb",
    "eqftp__filesize_terabytes" : "tb",
    "eqftp__filesize_petabytes" : "pt",
    "eqftp__filesize_exabytes" : "eb",
    "eqftp__filesize_zettabytes" : "zb",
    "eqftp__filesize_yottabytes" : "yb",
    
    "eqftp_dummy" : "dummy" // Not used anywhere, just leave it.
});