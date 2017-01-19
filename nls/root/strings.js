/**
 * =====================
 * BEFORE YOU START
 * =====================
 * There are some placeholders available to use, you can see examples below
 * Try to avoid unescaped ' and " symbols
 * Sometimes you may need to use HTML in text.
 * If some special characters are displayed incorrectly - contact developer, send string's name and your text.
 * Sometimes you may need to escape the escape character itself (see "eqftp__cs__c_localpath__explorer_title") to avoid bugs
 * Please, test features that you translate to see if everything keeps working fine
 * 
 * Here's Google's guide on writing style, please check it before you go futher: https://material.io/guidelines/style/writing.html
 */
define({
 "eqftp__toolbar__title" : "Open eqFTP",

 "eqftp__context__upload": "Upload",
 
 /**
 * WELCOME SCREEN
 */
 "eqftp__wlcm__welcome_headline": "Welcome",
 "eqftp__wlcm__welcome_text": "We couldn\'t find your settings file<br/>Locate it or create new one",
 "eqftp__wlcm__welcome_button_locate": "Locate",
 "eqftp__wlcm__welcome_button_create": "Create",
 "eqftp__wlcm__welcome_saveFile_title": "Save settings file",
 
 /**
 * PASSWORD WINDOW
 */
 "eqftp__paswd__window_title": "Decrypt settings",
 "eqftp__paswd__input_label": "Master password",
 "eqftp__paswd__input_placeholder": "Your password",
 "eqftp__paswd__button": "Decrypt",
 
 /**
 * CONNECTION'S SETTINGS WINDOW
 */
 "eqftp__cs__window_title_edit": "Edit connection",
 "eqftp__cs__window_title_new": "Create connection",
 "eqftp__cs__basic_settings": "Basic settings",
 "eqftp__cs__additional_settings": "Additional settings",
 "eqftp__cs__c_name": "Connection name",
 "eqftp__cs__c_protocol": "Protocol",
 "eqftp__cs__c_server": "IP address or domain name",
 "eqftp__cs__c_port": "Port",
 "eqftp__cs__c_login": "Login",
 "eqftp__cs__c_password": "Password",
 "eqftp__cs__c_localpath": "Local path",
 "eqftp__cs__c_localpath__explorer_title": "Choose folder for project\\'s files",
 "eqftp__cs__c_rsa": "RSA key path",
 "eqftp__cs__c_rsa__explorer_title": "Select your RSA key",
 "eqftp__cs__c_remotepath": "Remote path",
 "eqftp__cs__c_check_difference": "Check difference between files",
 "eqftp__cs__c_autoupload": "Automatically upload changes",
 "eqftp__cs__c_ignore_list": "Ignore list",
 "eqftp__cs__c_ignore_list_placeholder": "Use .gitignore syntax",
 
 /**
 * GENERAL SETTINGS
 */
 "eqftp__gs__setting_file_label": "Settings file",
 "eqftp__gs__setting_file_placeholder": "Path to settings file",
 "eqftp__gs__encrypt_label": "Encrypt settings",
 "eqftp__gs__master_password_label": "Master password",
 "eqftp__gs__master_password_placeholder": "Leave blank to keep current",
 "eqftp__gs__folder_for_projects_label": "Folder for projects",
 "eqftp__gs__folder_for_projects_placeholder": "Path to folder",
 "eqftp__gs__folder_for_projects_explorer_title": "Choose folder to store your downloaded files",
 "eqftp__gs__timestamp_format_label": "Timestamp format",
 "eqftp__gs__timestamp_format_placeholder": "Preferable timestamp format",
 "eqftp__gs__open_project_connection_label": "Open local project on connect",
 "eqftp__gs__debug_label": "Debug",
 
 /**
 * FILE DIFFERENCE
 */
 "eqftp__diff__title": "Difference view",
 "eqftp__diff__text": "GitHub-like file comparison. Your local file is considered to be a latest version.",
 "eqftp__diff__view_diff": "Difference",
 "eqftp__diff__view_patch": "Patch",
 
 /**
 * TABS
 */
 "eqftp__tab__fileTree__title": "File tree",
 "eqftp__tab__queue__title": "Queue",
 "eqftp__tab__connections__title": "Connections",
 "eqftp__tab__settings__title": "Settings",
 
 /**
 * DIALOGS
 */
 "eqftp__dialog__connection_removing_title": "Remove {{name}}?",
 "eqftp__dialog__connection_removing_text": "This action cannot be undone",
 
 "eqftp__dialog__connection_editing_unsaved_title": "Dismiss unsaved changes?",
 "eqftp__dialog__connection_editing_unsaved_text": "All changes will be lost",
 
 "eqftp__dialog__file_difference_title": "File {{filename}} differs",
 "eqftp__dialog__file_difference_text": "Local and remote copies of file are different",
 
 /**
 * LOGS
 */
 "eqftp__log__download_success": "File {{filename}} downloaded",
 "eqftp__log__download_error": "There was an error downloading {{filename}}: {{err}}",
 "eqftp__log__upload_success": "File {{filename}} uploaded",
 "eqftp__log__upload_error": "There was an error uploading {{filename}}: {{err}}",
 
 "eqftp__log__connection_ready": "Connection {{name}} opened",
 "eqftp__log__connection_error": "There was an error on {{name}} connection: {{error}}",
 "eqftp__log__connection_close": "Connection {{name}} closed",
 "eqftp__log__connection_tmp_error": "Can't create temporary connection: {{error}}",
 
 "eqftp__log__settings_load_success": "Settings file {{filename}} loaded",
 "eqftp__log__settings_load_error": "There was an error loading settings file {{filename}}",
 "eqftp__log__settings_load__dialog_error": "There was an error opening file: {{err}}",
 "eqftp__log__settings_save_success": "Settings saved to {{filename}}",
 "eqftp__log__settings_save_error": "There was an error saving settings to {{filename}}",
 
 "eqftp__log__settings_connection_save_success": "Connection {{name}} saved",
 "eqftp__log__settings_connection_save_error": "There was an error saving connection: {{{err}}}",
 
 "eqftp__log__open_file_error": "Can't open file {{{filename}}}. Error: {{{err}}}",
 
 /**
  * TOASTS
  * _m means multiple. You can use {{num}} to display stacked amount
  */
 "eqftp__toast__download_success": "File {{filename}} downloaded",
 "eqftp__toast__download_success_m": "Files downloaded ({{num}})",
 "eqftp__toast__download_error": "Can't download {{filename}}",
 "eqftp__toast__download_error_m": "Can't download files ({{num}})",
 
 "eqftp__toast__upload_success": "File {{filename}} uploaded",
 "eqftp__toast__upload_success_m": "Files uploaded ({{num}})",
 "eqftp__toast__upload_error": "Can't upload {{filename}}",
 "eqftp__toast__upload_error_m": "Can't upload files ({{num}})",
 
 "eqftp__toast__connection_error": "There was an error on {{name}} connection",
 "eqftp__toast__files_difference": "File {{filename}} differs from remote copy",
 
 "eqftp__toast__file_created_locally": "Create same file on server?",
 "eqftp__toast__file_created_remotely": "Create same file on PC?",
 "eqftp__toast__file_renamed_locally": "Rename same file on server?",
 "eqftp__toast__file_renamed_remotely": "Rename same file on PC?",
 "eqftp__toast__file_removed_locally": "Remove same file on server?",
 "eqftp__toast__file_removed_remotely": "Remove same file on PC?",
 
 /**
  * CONTEXT MENUS
  */
 "eqftp__context__connectionElement__connect": "Connect",
 "eqftp__context__connectionElement__remove": "Remove",
 "eqftp__context__connectionElement__edit": "Edit",
 
 "eqftp__context__fileTreeElement__download_open": "Download and open",
 "eqftp__context__fileTreeElement__download": "Download",
 "eqftp__context__fileTreeElement__refresh": "Refresh",
 "eqftp__context__fileTreeElement__open": "Open",
 
 "eqftp__context__queueElement__restart": "Restart",
 "eqftp__context__queueElement__remove": "Remove",
 
 /**
 * CONTROLS
 * Check this page if you have any questions about this part: https://material.io/guidelines/style/writing.html#writing-language
 * There's a table called "Text for buttons and related elements"
 */
 "eqftp__controls__cancel": "Cancel",
 "eqftp__controls__nothanks": "No thanks",
 "eqftp__controls__dismiss": "Dismiss",
 "eqftp__controls__back": "Back",
 
 "eqftp__controls__gotit": "Got it",
 "eqftp__controls__ok": "OK",
 "eqftp__controls__done": "Done",
 
 "eqftp__controls__learnmore": "Learn more",
 
 // Next strings are custom but translate them just like previous
 "eqftp__controls__save": "Save",
 "eqftp__controls__remove": "Remove",
 "eqftp__controls__showlog": "Show log",
 "eqftp__controls__resolve": "Resolve",
 "eqftp__controls__create": "Create",
 "eqftp__controls__rename": "Rename",
 "eqftp__controls__skip": "Skip",
 
 "eqftp__controls__difference_upload": "Upload local file",
 "eqftp__controls__difference_download": "Download remote file",
 "eqftp__controls__difference_show_diff": "Show difference",
 "eqftp__controls__difference_open_both": "Open both files",
 
 /**
  * TOOLTIPS
  */
 "eqftp__tooltip__settings_editor__localpath_autocomplete": "Current project's path",
 
 /**
 * FILESIZES
 */
 "eqftp__filesize_bytes": "bytes",
 "eqftp__filesize_kilobytes": "kb",
 "eqftp__filesize_megabytes": "mb",
 "eqftp__filesize_gigabytes": "gb",
 "eqftp__filesize_terabytes": "tb",
 "eqftp__filesize_petabytes": "pt",
 "eqftp__filesize_exabytes": "eb",
 "eqftp__filesize_zettabytes": "zb",
 "eqftp__filesize_yottabytes": "yb",
 
 /**
 * ERRORS
 */
 "eqftp__ERR__NOSERVERSET": "Parameter \"Server\" is empty",
 
 /**
  * MISC
  */
 // {{{names}}} must have 3x{} and will contain "Equals182 & GoliafRS" string
 "eqftp__misc__credits_text": "eqFTP is maintained by {{{names}}}",
 // {{{button}}} must have 3x{} and will contain text from "eqftp__misc__donate_button"
 "eqftp__misc__donate_text": "{{{button}}} to support this project!",
 "eqftp__misc__donate_button": "Donate",
 "eqftp__misc__new_fileTree_element": "Untitled",

 "eqftp_dummy" : "dummy" // Not used anywhere, just leave it.
});