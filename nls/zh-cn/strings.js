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
 "eqftp__toolbar__title" : "開啟 eqFTP",

 "eqftp__context__upload": "上傳",
 
 /**
 * WELCOME SCREEN
 */
 "eqftp__wlcm__welcome_headline": "歡迎",
 "eqftp__wlcm__welcome_text": "我們並沒有找到您的設定檔案。瀏覽檔案以載入或建立新設定檔",
 "eqftp__wlcm__welcome_button_locate": "瀏覽檔案",
 "eqftp__wlcm__welcome_button_create": "建立新設定黨",
 "eqftp__wlcm__welcome_saveFile_title": "儲存設定檔案",
 
 /**
 * PASSWORD WINDOW
 */
 "eqftp__paswd__window_title": "解密選項",
 "eqftp__paswd__input_label": "Master 密碼",
 "eqftp__paswd__input_placeholder": "密碼",
 "eqftp__paswd__button": "解密",
 
 /**
 * CONNECTION'S SETTINGS WINDOW
 */
 "eqftp__cs__window_title_edit": "編輯連線",
 "eqftp__cs__window_title_new": "新增連線",
 "eqftp__cs__basic_settings": "基本",
 "eqftp__cs__additional_settings": "其他",
 "eqftp__cs__c_name": "連線名稱",
 "eqftp__cs__c_protocol": "協定",
 "eqftp__cs__c_server": "IP 位址或網址",
 "eqftp__cs__c_port": "連接埠(Port)",
 "eqftp__cs__c_login": "使用者",
 "eqftp__cs__c_password": "密碼",
 "eqftp__cs__c_localpath": "本機目錄位置",
 "eqftp__cs__c_localpath__explorer_title": "選取資料夾",
 "eqftp__cs__c_rsa": "RSA 私鑰位址",
 "eqftp__cs__c_rsa__explorer_title": "選取私鑰",
 "eqftp__cs__c_remotepath": "遠端目錄位置",
 "eqftp__cs__c_check_difference": "檢查檔案差異",
 "eqftp__cs__c_autoupload": "自動上傳更新",
 "eqftp__cs__c_ignore_list": "忽略列表",
 "eqftp__cs__c_ignore_list_placeholder": "使用.gitignore語法",
 
 /**
 * GENERAL SETTINGS
 */
 "eqftp__gs__setting_file_label": "設定檔",
 "eqftp__gs__setting_file_placeholder": "設定檔案的路徑",
 "eqftp__gs__encrypt_label": "加密選項",
 "eqftp__gs__master_password_label": "Master 密碼",
 "eqftp__gs__master_password_placeholder": "不填入此欄位以保留先前設置",
 "eqftp__gs__folder_for_projects_label": "專案資料夾",
 "eqftp__gs__folder_for_projects_placeholder": "資料夾的路徑",
 "eqftp__gs__folder_for_projects_explorer_title": "選擇下載目的地目錄",
 "eqftp__gs__timestamp_format_label": "時間(Timestamp)格式",
 "eqftp__gs__timestamp_format_placeholder": "時間格式",
 "eqftp__gs__open_project_connection_label": "開啟專案並連線",
 "eqftp__gs__debug_label": "啟用除錯",
 
 /**
 * TABS
 */
 "eqftp__tab__fileTree__title": "目錄",
 "eqftp__tab__queue__title": "佇列",
 "eqftp__tab__connections__title": "連線",
 "eqftp__tab__settings__title": "設定",
 
 /**
 * DIALOGS
 */
 "eqftp__dialog__connection_removing_title": "移除 {{name}}?",
 "eqftp__dialog__connection_removing_text": "這樣的動作將無法回復",
 
 "eqftp__dialog__connection_editing_unsaved_title": "檔案已經更動，確定離開嗎?",
 "eqftp__dialog__connection_editing_unsaved_text": "所有更動將會消失",
 
 /**
 * LOGS
 */
 "eqftp__log__download_success": "檔案 {{filename}} 已下載",
 "eqftp__log__download_error": "下載 {{filename}} 時發生狀況 : {{err}}",
 "eqftp__log__upload_success": "檔案 {{filename}} 已上傳",
 "eqftp__log__upload_error": "上傳 {{filename}} 時發生狀況 : {{err}}",
 
 "eqftp__log__connection_ready": "已連線 {{name}}",
 "eqftp__log__connection_error": "在連線 {{name}} 時發生問題: {{error}}",
 "eqftp__log__connection_close": "已關閉 {{name}} 的連線",
 "eqftp__log__connection_tmp_error": "無法建立暫時連線: {{error}}",
 
 "eqftp__log__settings_load_success": "設定檔 {{filename}} 已經載入",
 "eqftp__log__settings_load_error": "設定檔 {{filename}} 載入時發生錯誤",
 "eqftp__log__settings_load__dialog_error": "開啟檔案時發生錯誤: {{err}}",
 "eqftp__log__settings_save_success": "{{filename}} 已儲存",
 "eqftp__log__settings_save_error": " {{filename}} 儲存時發生錯誤",
 
 "eqftp__log__settings_connection_save_success": "連線 {{name}} 已儲存",
 "eqftp__log__settings_connection_save_error": "儲存連線時發生錯誤: {{{err}}}",
 
 /**
  * TOASTS
  * _m means multiple. You can use {{num}} to display stacked amount
  */
 "eqftp__toast__download_success": "檔案 {{filename}} 已下載",
 "eqftp__toast__download_success_m": "{{num}} 個檔案下載成功",
 "eqftp__toast__download_error": "無法下載檔案 {{filename}}",
 "eqftp__toast__download_error_m": "{{num}} 個檔案無法下載",
 
 "eqftp__toast__upload_success": "檔案 {{filename}} 已上傳",
 "eqftp__toast__upload_success_m": "{{num}} 個檔案已上傳",
 "eqftp__toast__upload_error": "無法上傳檔案 {{filename}}",
 "eqftp__toast__upload_error_m": "{{num}} 個檔案無法上傳",
 
 "eqftp__toast__connection_error": " {{name}} 連線時發生錯誤",
 "eqftp__toast__files_difference": "檔案 {{filename}} 與遠端存在差異",
 
 "eqftp__toast__file_created_locally": "同步建立檔案到伺服器？",
 "eqftp__toast__file_created_remotely": "同步建立本機檔案？",
 "eqftp__toast__file_renamed_locally": "同步命名檔案到伺服器？",
 "eqftp__toast__file_renamed_remotely": "同步命名本機檔案？",
 "eqftp__toast__file_removed_locally": "同步移除檔案到伺服器？",
 "eqftp__toast__file_removed_remotely": "同時移除本機檔案？",
 
 /**
  * CONTEXT MENUS
  */
 "eqftp__context__connectionElement__connect": "連線",
 "eqftp__context__connectionElement__remove": "刪除",
 "eqftp__context__connectionElement__edit": "編輯",
 
 "eqftp__context__fileTreeElement__download_open": "下載並開啟",
 "eqftp__context__fileTreeElement__download": "下載",
 "eqftp__context__fileTreeElement__refresh": "重新整理",
 "eqftp__context__fileTreeElement__open": "開啟",
 
 "eqftp__context__queueElement__restart": "重新啟動",
 "eqftp__context__queueElement__remove": "刪除",
 
 /**
 * CONTROLS
 * Check this page if you have any questions about this part: https://material.io/guidelines/style/writing.html#writing-language
 * There's a table called "Text for buttons and related elements"
 */
 "eqftp__controls__cancel": "取消",
 "eqftp__controls__nothanks": "不了，謝謝！",
 "eqftp__controls__dismiss": "好的",
 "eqftp__controls__back": "返回",
 
 "eqftp__controls__gotit": "知道了！",
 "eqftp__controls__ok": "好",
 "eqftp__controls__done": "完成",
 
 "eqftp__controls__learnmore": "深入了解",
 
 // Next strings are custom but translate them just like previous
 "eqftp__controls__save": "儲存",
 "eqftp__controls__delete": "刪除",
 "eqftp__controls__showlog": "顯示紀錄",
 "eqftp__controls__resolve": "解決",
 "eqftp__controls__create": "建立",
 "eqftp__controls__rename": "重新命名",
 
 /**
  * TOOLTIPS
  */
 "eqftp__tooltip__settings_editor__localpath_autocomplete": "目前目錄位置",
 
 /**
 * FILESIZES
 */
 "eqftp__filesize_bytes": "位元組",
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
 "eqftp__ERR__NOSERVERSET": "「伺服器」參數不正確",
 
 /**
  * MISC
  */
 // {{{names}}} must have 3x{} and will contain "Equals182 & GoliafRS" string
 "eqftp__misc__credits_text": "eqFTP 係由 {{{names}}} 管理與維護",
 // {{{button}}} must have 3x{} and will contain text from "eqftp__misc__donate_button"
 "eqftp__misc__donate_text": "{{{button}}} to support this project!",
 "eqftp__misc__donate_button": "贊助",
 "eqftp__misc__new_fileTree_element": "未命名",

 "eqftp_dummy" : "dummy" // Not used anywhere, just leave it.
});
