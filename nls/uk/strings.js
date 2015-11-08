define({
    "ERR_LOADING" : "Помилка завантаження :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Відкрити менеджер підключень",
    "SIDEPANEL_FILETREE_NAME" : "Назва",
    "SIDEPANEL_FILETREE_SIZE" : "Розмір",
    "SIDEPANEL_FILETREE_TYPE" : "Тип",
    "SIDEPANEL_FILETREE_MODIFIED" : "Модифіковано",
    "SIDEPANEL_CONDISCONNECT" : "Від/підключитись",
    "SIDEPANEL_REFRESH" : "Оновити",
    "SIDEPANEL_RELOADSETTINGS" : "Оновити налаштування та вказати пароль знову",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "Сервер не існує",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Схоже, цей сервер не існує. <br>Перевірте параметри у налаштуваннях підключення.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "Неможливо отримати доступ до сервера",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "Я тільки ось не зміг отримати доступ до сервера.<br>Можливо у цьому винен фаєрвол.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Помилкові дані авторизації",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "Я не можу авторизуватись з наданими логіном та паролем.<br>Перевірте їх, будь ласка.",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "Підключення не знайдено",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "З поточним проектом не пов’язане жодне FTP-підключення та сервер.<br>Підключіться до сервера або вкажіть в Налаштуваннях поточну теку проекту в якості локального шляху для підключення.",
    "ERR_DIAG_ECONNRESET_TITLE" : "Сервер відхиляє підключення",
    "ERR_DIAG_ECONNRESET_CONTENT" : "Я не можу підключитись до серера, це мені недозволено.<br>. Спробуйте перезавантажити Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "Вас відключено від сервера",
    "ERR_DIAG_ECONNABORTED_CONTENT" : "Підключення перервано. Повторна спроба...",
    "ERR_DIAG_UNIVERSAL_TITLE" : "Виникла помилка",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Гляньте на цю помилку? Як таке могло трапитись?",
    "ERR_DIAG_NORSAKEYFOUND" : "RSA ключ не знайдено: ", //NEW A path to RSA file will be appended after colon.

    "NOT_DIAG_CONNECTED" : "Підключено до сервера.",
    "NOT_DIAG_DISCONNECTED" : "Відключено від сервера.",
    "NOT_DIAG_FILESDIFFERENT" : "Мiж локальними та віддаленими файлами знайдено різницю. Натисніть тут, для інших дій.", //NEW

    "PASSWDWIND_TITLE" : "Вкажіть пароль, будьте ласкаві",
    "PASSWDWIND_CONTENT" : "Ваш пароль до eqFTP:",

    "CHECKDIFF_TITLE" : "Між файлами є рiзниця", //NEW
    "CHECKDIFF_CONTENT" : "Віддалена та локальна копії файлів мають відмінності. Будь ласка, виберіть, що б ви хотіли зробити.", //NEW
    "CHECKDIFF_BUTTON_COMPARE" : "Порiвняти файли", //NEW
    "CHECKDIFF_BUTTON_SHOWCHANGES" : "Показати відмінності", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCAL" : "Залишити локальну копiю", //NEW
    "CHECKDIFF_BUTTON_KEEPLOCALALL" : "Залишити локальну копію для всіх файлів у черзі", //NEW
    "CHECKDIFF_BUTTON_GETREMOTE" : "Отримати віддалену копію", //NEW
    "CHECKDIFF_BUTTON_GETREMOTEALL" : "Отримати віддалену копію для всіх файлів у черзі", //NEW

    "SETTINGSWIND_TITLE" : "Менеджер підключень eqFTP",
    "SETTINGSWIND_ERR_BLANKS" : "Ой! Схоже щось не так. Перевірте введені дані і спробуйте знову.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Щось пішло зовсім не так! Я не можу записати налаштування до файлу!",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "Шлях, що ви зараз намагаєтесь вставити, уже використовується іншим підключенням.",
    "SETTINGSWIND_NOTIF_DONE" : "Ніщо не збережено! :)",
    "SETTINGSWIND_SAVEDCONN" : "Збережені FTP підключення",
    "SETTINGSWIND_DELETECONN_HOVER" : "Вилучити це підключення",
    "SETTINGSWIND_COPYCONN_HOVER" : "Копіювати з'єднання", //NEW
    "SETTINGSWIND_ERROR_DELETE_CURCONNSERV" : "Ви не можете видалити з'єднання, яким зараз користуєтеся", //NEW
    "SETTINGSWIND_ADDCONN_HOVER" : "Додати нове підключення",
    "SETTINGSWIND_ADDCONN_STRING" : "Створити нове підключення...",
    "SETTINGSWIND_DELETECONNCONF_1" : "Будь ласка, підтвердіть вилучення", // Those 2 strings are going like this: SETTINGSWIND_DELETECONNCONF_1 + VAL + SETTINGSWIND_DELETECONNCONF_2
    "SETTINGSWIND_DELETECONNCONF_2" : "підключення.", // So if in your language there's no need in 2 strings, just leave one of them blank
    "SETTINGSWIND_OPENGLOBSET" : "Відкрити глобальні налаштування FTP...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Оберіть підключення для редагування або створіть нове.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Тека для проектів:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Тека для проектів з завантаженими файлами:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Тека для налаштувань:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Тека для файлу налаштувань",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Не вдалось відкрити проект після завантаження",
    "SETTINGSWIND_GLOB_MASTERPASSWORD" : "Майстер-пароль", //NEW
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Назва підключення:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Уведіть назву підключення",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Сервер:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Протокол:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Користувач:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "Користувач FTP",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Пароль:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "Пароль FTP",
    "SETTINGSWIND_GLOB_RSA_TITLE" : "RSA ключ", //NEW
    "SETTINGSWIND_GLOB_RSA_FIELD" : "Натисніть, щоб обрати RSA ключ", //NEW
    "SETTINGSWIND_GLOB_FOLDERFORRSA_DIAGTITLE" : "Виберіть шлях до RSA ключу", //NEW
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Шлях на сервері:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Уведіть шлях на сервері до кореневої теки проекту",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Локальний шлях:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Створює нове теку, якщо типове розміщення порожнє",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Відвантажувати файл під час збереження",
    "SETTINGSWIND_GLOB_UPLOADONSAVEPAUSED" : "Додати в призупинену чергу.", //NEW
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Навіть якщо відключено",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Ця опція автоматично під’єднується до сервера коли збережений файл відкритий сервером або збережений файл в середині поточного проекту і цей файл створений цим FTP-розширенням. Хух. Здається добре пояснив...",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Вставити поточний шлях проекту",
    "SETTINGSWIND_GLOB_FRM_TITLE" : "Спосіб отримання папок:", //NEW
    "SETTINGSWIND_GLOB_FRM_LIST" : "Використати команду LIST", //NEW
    "SETTINGSWIND_GLOB_FRM_MLSD" : "Використати команду MLSD", //NEW
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Інтервал підтримки з’єднання:", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Значення у секундах. Рекомендовано – 10. Вкажіть нуль, аби заборонити команди підтримки з’єднання і від’єднуватись кожного разу як команда завершилась",
    "SETTINGSWIND_GLOB_DEBUG" : "Відлагодження:",
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Формат дати:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "США",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Європейський",
    "SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Азійський",
    "SETTINGSWIND_GLOB_AUTOCLEAR" : "Автоочищення черги",
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Сповіщення",
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Зміщення часу:",
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Скористайтесь цим параметром аби підлаштувати час у колонці Модифіковано",
    "SETTINGSWIND_GLOB_CONNECTIONTAB" : "З'єднання", //NEW
    "SETTINGSWIND_GLOB_AUTOMATIZATIONTAB" : "Автоматизація", //NEW
    "SETTINGSWIND_GLOB_ADVANCEDTAB" : "Додатково", //NEW
    "SETTINGSWIND_GLOB_AUTO_SET_TITLE" : "Встановити автоматизацію:", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC" : "Синхронізація", //NEW
    "SETTINGSWIND_GLOB_AUTO_CLASSIC" : "Класична", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_SELECT_TITLE" : "Оберіть, що синхронізувати", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILECREATION" : "Створення файлів", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FOLDERCREATION" : "Створення тек", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_FILEUPLOAD" : "Оновлення файлів", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_RENAMING" : "Перейменування", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_MOVING" : "Переміщення", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_DELETING" : "Видалення", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_EXTRASETTINGS_TITLE" : "Додаткові налаштування", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF" : "Перевіряти різницю між файлами", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_CHECKDIFF_EXPLAIN" : "При відкритті локального та віддаленого файлу", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_TITLE" : "Список ігнорування", //NEW
    "SETTINGSWIND_GLOB_AUTO_SYNC_IGNORELIST_EXPLAIN" : "Такий же синтаксис, як в .gitignore", //NEW
    "SETTINGSWIND_GLOB_SYNCLOCPROJWCONN" : "Відкривати відповідний локальний проект при перемиканні між з'єднаннями і навпаки", //NEW
    "SETTINGS_NOTIF_RELOADED" : "Налаштування були успішно перезавантажені.", //NEW
    "SETTINGS_ERROR_RELOADED" : "Не можу перезавантажити налаштування.", //NEW
    "SETTINGSWIND_GLOB_SCE_TITLE" : "Використовувати SSH команди з SFTP", //NEW

    "QUEUE_TITLE" : "Черга eqFTP",
    "QUEUE_HEADER_NAME" : "Назва",
    "QUEUE_HEADER_PATH" : "Шлях",
    "QUEUE_HEADER_FROM" : "Початковий шлях",
    "QUEUE_HEADER_TO" : "Цільовий шлях",
    "QUEUE_HEADER_STATUS" : "Статус",
    "QUEUE_CLEARQ" : "Очистити чергу",
    "QUEUE_STARTQ" : "Запустити чергу", //NEW
    "QUEUE_PAUSEQ" : "Призупинити чергу", //NEW
    "QUEUE_RESTARTQ" : "Перезапустити чергу", //NEW
    "QUEUE_CONTEXTM_STARTT" : "Запустити", //NEW
    "QUEUE_CONTEXTM_PAUSET" : "Призупинити", //NEW
    "QUEUE_CONTEXTM_REMOVET" : "Видалити", //NEW
    "QUEUE_CONTEXTM_RESTARTT" : "Перезапустити", //NEW
    "QUEUE_TASK_STATUS_WAITING" : "Очiкування", //NEW
    "QUEUE_TASK_STATUS_SUCCESS" : "Виконано", //NEW
    "QUEUE_TASK_STATUS_FAIL" : "Не виконано", //NEW
    "QUEUE_TASK_STATUS_PAUSE" : "Призупинено", //NEW
    "QUEUE_TASK_STATUS_STARTED" : "Запущено", //NEW
    "QUEUE_TASK_STATUS_DELETED" : "Видалено", //NEW
    "QUEUE_DONT_ADD_COMPLETED" : "Автоочищення завершених завдань",
    
    "ERR_FILE_ACCESSDENIED" : "У доступі відмовлено. Перевірте дозволи файлу.",
    "ERR_FILE_AUTHORIZATION" : "Помилка авторизації. Перевірте свій логін та пароль.",
    "ERR_FILE_SERVNOEXIST" : "Сервер не існує. Можливо ви допустили помилку під час набору?",
    "ERR_FILE_SERVCANTREACH" : "Неможливо отримати доступ до сервера. Перевірте фаєрвол.",
    "ERR_FILE_FILESIZE0" : "Неможливо завантажити файл. Його розмір рівний 0,",
    "ERR_FILE_DOWNLOAD" : "Неможливо завантажити файл.",
    "ERR_FILE_UPLOAD" : "Не можу завантажити файл.", //NEW
    "ERR_FILE_DOESNTEXIST" : "Файл не існує",
    "ERR_FILE_CANTRENAME" : "Не можу перейменувати файл: ", //NEW
    "ERR_FILE_CANTDELETE" : "Не можу видалити файл: ", //NEW
    "ERR_FILE_CANTCREATEDIR" : "Не можу створити теку: ", //NEW
    "ERR_FILE_CANTDELETEDIR" : "Не можу видалити теку: ", //NEW
    "ERR_FILE_CANTCREATEFILE" : "Не можу створити файл: ", //NEW
    "ERR_FOLDER_OPEN" : "Виникла помилка під час відкриття теки в якості проекту",

    "CONTEXTM_DOWNLOAD" : "Завантажити",
    "CONTEXTM_UPLOAD" : "Відвантажити",
    "CONTEXTM_ADDQUEUE" : "Додати до черги",
    "CONTEXTM_OPEN" : "Відкрити",
    "CONTEXTM_DELETE" : "Видалити",
    "CONTEXTM_RENAME" : "Перейменувати",
    "CONTEXTM_REDOWNLOAD" : "Завантажити з сервера",
    "CONTEXTM_CREATEFILE" : "Створити файл", //NEW
    "CONTEXTM_CREATEFOLDER" : "Створити теку", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Оберіть сервер для підключення...",
    "OTHER_ERROR" : "Помилка",
    "OTHER_PAUSED" : "Призупинено",
    "OTHER_COMPLETED" : "Завершено",
    "OTHER_CANCELLED" : "Скасовано",
    "OTHER_WAITING" : "Очікування",
    "OTHER_YES" : "Так", //NEW
    "OTHER_NO" : "Нi", //NEW
    "OTHER_OK" : "Ок",
    "OTHER_OFF" : "Вимкн", //NEW
    "OTHER_CANCEL" : "Скасувати",
    "OTHER_APPLY" : "Застосувати",
    "OTHER_SAVE" : "Зберегти", //NEW
    "OTHER_CLOSE" : "Закрити",
    "OTHER_DELETE" : "Видалити",
    "OTHER_CONFIRM_DELETE" : "Ви дійсно хочете вилучити цей елемент?",
    "OTHER_CONFIRM_SETTINGSCLOSE" : "Є незбережені зміни, які втратяться, якщо ви натиснете кнопку ОК. <br> Бажаєте продовжити?", //NEW
    "OTHER_ERROR_EVENDISCONN" : "Неможливо відвантажити файл. Параметр 'Навіть якщо відключено' не увімкнено",
    "OTHER_ERROR_CANTREADSETTINGS" : "Не можу прочитати настройки. Можливо, ви невірно ввели майстер-пароль." //NEW
});
