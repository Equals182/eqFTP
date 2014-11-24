define({
	"ERR_LOADING": "Помилка завантаження :(",

	"SIDEPANEL_TITLE": "eqFTP",
	"SIDEPANEL_OPENCONNMANGR": "Відкрити менеджер підключень",
	"SIDEPANEL_FILETREE_NAME": "Назва",
	"SIDEPANEL_FILETREE_SIZE": "Розмір",
	"SIDEPANEL_FILETREE_TYPE": "Тип",
	"SIDEPANEL_FILETREE_MODIFIED": "Модифіковано",
	"SIDEPANEL_CONDISCONNECT": "Від/підключитись",
	"SIDEPANEL_REFRESH": "Оновити",
	"SIDEPANEL_RELOADSETTINGS": "Оновити налаштування та вказати пароль знову",

	"ERR_DIAG_SERVNOEXIST_TITLE": "Сервер не існує",
	"ERR_DIAG_SERVNOEXIST_CONTENT": "Схоже, цей сервер не існує. <br>Перевірте параметри у налаштуваннях підключення.",
	"ERR_DIAG_SERVCANTREACH_TITLE": "Неможливо отримати доступ до сервера",
	"ERR_DIAG_SERVCANTREACH_CONTENT": "Я тільки ось не зміг отримати доступ до сервера.<br>Можливо у цьому винен фаєрвол.",
	"ERR_DIAG_AUTHORIZEERR_TITLE": "Помилкові дані авторизації",
	"ERR_DIAG_AUTHORIZEERR_CONTENT": "Я не можу авторизуватись з наданими логіном та паролем.<br>Перевірте їх, будь ласка.",
	"ERR_DIAG_NOSERVERFOUND_TITLE": "Підключення не знайдено",
	"ERR_DIAG_NOSERVERFOUND_CONTENT": "З поточним проектом не пов’язане жодне FTP-підключення та сервер.<br>Підключіться до сервера або вкажіть в Налаштуваннях поточну теку проекту в якості локального шляху для підключення.",
	"ERR_DIAG_ECONNRESET_TITLE": "Сервер відхиляє підключення",
	"ERR_DIAG_ECONNRESET_CONTENT": "Я не можу підключитись до серера, це мені недозволено.<br>. Спробуйте перезавантажити Brackets.",
  "ERR_DIAG_ECONNABORTED_TITLE": "Вас відключено від сервера", //NEW
	"ERR_DIAG_ECONNABORTED_CONTENT": "Підключення перервано. Повторна спроба...", //NEW
	"ERR_DIAG_UNIVERSAL_TITLE": "Виникла помилка",
	"ERR_DIAG_UNIVERSAL_CONTENT": "Гляньте на цю помилку? Як таке могло трапитись?",
    
  "NOT_DIAG_CONNECTED": "Підключено до сервера.", //NEW
  "NOT_DIAG_DISCONNECTED": "Відключено від сервера.", //NEW

	"PASSWDWIND_TITLE": "Вкажіть пароль, будьте ласкаві",
	"PASSWDWIND_CONTENT": "Ваш пароль до eqFTP:",

	"SETTINGSWIND_TITLE": "Менеджер підключень eqFTP",
	"SETTINGSWIND_ERR_BLANKS": "Ой! Схоже щось не так. Перевірте введені дані і спробуйте знову.",
	"SETTINGSWIND_ERR_CANTWRITE": "Щось пішло зовсім не так! Я не можу записати налаштування до файлу!",
	"SETTINGSWIND_ERR_LOCALPATHREPEAT": "Шлях, що ви зараз намагаєтесь вставити, уже використовується іншим підключенням.",
	"SETTINGSWIND_NOTIF_DONE": "Ніщо не збережено! :)",
	"SETTINGSWIND_SAVEDCONN": "Збережені FTP підключення",
	"SETTINGSWIND_DELETECONN_HOVER": "Вилучити це підключення",
	"SETTINGSWIND_ADDCONN_HOVER": "Додати нове підключення",
	"SETTINGSWIND_ADDCONN_STRING": "Створити нове підключення...",
	"SETTINGSWIND_DELETECONNCONF_1": "Будь ласка, підтвердіть вилучення", // Those 2 strings are going like this: SETTINGSWIND_DELETECONNCONF_1 + VAL + SETTINGSWIND_DELETECONNCONF_2
	"SETTINGSWIND_DELETECONNCONF_2": "підключення.", // So if in your language there's no need in 2 strings, just leave one of them blank
	"SETTINGSWIND_OPENGLOBSET": "Відкрити глобальні налаштування FTP...",
	"SETTINGSWIND_NOTHINGYETMSG": "Оберіть підключення для редагування або створіть нове.",
	"SETTINGSWIND_GLOB_FOLDERFORPROJ": "Тека для проектів:",
	"SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE": "Тека для проектів з завантаженими файлами:",
	"SETTINGSWIND_GLOB_FOLDERFORSET": "Тека для налаштувань:",
	"SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE": "Тека для файлу налаштувань",
	"SETTINGSWIND_GLOB_DONTOPENPROJECTS": "Не вдалось відкрити проект після завантаження",
	"SETTINGSWIND_GLOB_STORESAFELY": "Надійне збереження паролів",
	"SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE": "Назва підключення:",
	"SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD": "Уведіть назву підключення",
	"SETTINGSWIND_GLOB_SERVER_TITLE": "Сервер:",
	"SETTINGSWIND_GLOB_PROTOCOL_TITLE": "Протокол:",
	"SETTINGSWIND_GLOB_USERNAME_TITLE": "Користувач:",
	"SETTINGSWIND_GLOB_USERNAME_FIELD": "Користувач FTP",
	"SETTINGSWIND_GLOB_PASSWORD_TITLE": "Пароль:",
	"SETTINGSWIND_GLOB_PASSWORD_FIELD": "Пароль FTP",
	"SETTINGSWIND_GLOB_REMOTEPATH_TITLE": "Шлях на сервері:",
	"SETTINGSWIND_GLOB_REMOTEPATH_FIELD": "Уведіть шлях на сервері до кореневої теки проекту",
	"SETTINGSWIND_GLOB_LOCALPATH_TITLE": "Локальний шлях:",
	"SETTINGSWIND_GLOB_LOCALPATH_FIELD": "Створює нове теку, якщо типове розміщення порожнє",
	"SETTINGSWIND_GLOB_UPLOADONSAVE": "Відвантажувати файл під час збереження",
	"SETTINGSWIND_GLOB_EVENDISCONN": "Навіть якщо відключено",
	"SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN": "Ця опція автоматично під’єднується до сервера коли збережений файл відкритий сервером або збережений файл в середині поточного проекту і цей файл створений цим FTP-розширенням. Хух. Здається добре пояснив...",
	"SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE": "Вставити поточний шлях проекту",
	"SETTINGSWIND_GLOB_USELIST": "Альтернативне отримання тек",
	"SETTINGSWIND_GLOB_KEEPALIVE": "Інтервал підтримки з’єднання", // Keep Alive is feature when client sends empty packages to server to prevet disconnection.
	"SETTINGSWIND_GLOB_KEEPALIVE_DESC": "Значення у секундах. Рекомендовано – 10. Вкажіть нуль, аби заборонити команди підтримки з’єднання і від’єднуватись кожного разу як команда завершилась",
	"SETTINGSWIND_GLOB_DEBUG": "Відлагодження:",
	"SETTINGSWIND_GLOB_TIMEFORMAT": "Формат дати:",
	"SETTINGSWIND_GLOB_TIMEFORMAT_US": "США",
	"SETTINGSWIND_GLOB_TIMEFORMAT_EU": "Європейський",
	"SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN": "Азійський", //NEW
	"SETTINGSWIND_GLOB_SYNC": "Синхронізувати",
	"SETTINGSWIND_GLOB_SYNC_DESC": "Вилучить або перейменує файл на сервері після того як його було змінено у Brackets:",
	"SETTINGSWIND_GLOB_AUTOCLEAR": "Автоочищення черги", //NEW
  "SETTINGSWIND_GLOB_NOTIFICATIONS": "Сповіщення", //NEW
  "SETTINGSWIND_GLOB_TIMEOFFSET": "Зміщення часу:", //NEW
  "SETTINGSWIND_GLOB_TIMEOFFSET_DESC": "Скористайтесь цим параметром аби підлаштувати час у колонці Модифіковано", //NEW

	"QUEUE_TITLE": "Черга eqFTP",
	"QUEUE_TITLE_HOVER": "Натисніть, аби відкрити чергу eqFTP",
	"QUEUE_HEADER_NAME": "Назва",
	"QUEUE_HEADER_PATH": "Шлях",
	"QUEUE_HEADER_FROM": "Початковий шлях",
	"QUEUE_HEADER_TO": "Цільовий шлях",
	"QUEUE_HEADER_STATUS": "Статус",
	"QUEUE_REMOVE": "Вилучити з черги",
	"QUEUE_CONTEXTM_STARTQ": "Запустити завдання",
	"QUEUE_CONTEXTM_PAUSEQ": "Призупинити завдання",
	"QUEUE_CONTEXTM_CLEARQ": "Очистити чергу",
	"QUEUE_CONTEXTM_CLEARCOMPQ": "Очистити завершенні завдання",
	"QUEUE_CONTEXTM_CLEARFAILQ": "Очистити помилкові завдання",
	"QUEUE_CONTEXTM_CLEARPAUSQ": "Очистити призупинені завдання", //NEW
	"QUEUE_CONTEXTM_RESTARTFAILQ": "Перезапустити помилкові завдання",
	"QUEUE_DONT_ADD_COMPLETED": "Автоочищення завершених завдань", //NEW
	"ERR_FILE_ACCESSDENIED": "У доступі відмовлено. Перевірте дозволи файлу.",
	"ERR_FILE_AUTHORIZATION": "Помилка авторизації. Перевірте свій логін та пароль.",
	"ERR_FILE_SERVNOEXIST": "Сервер не існує. Можливо ви допустили помилку під час набору?",
	"ERR_FILE_SERVCANTREACH": "Неможливо отримати доступ до сервера. Перевірте фаєрвол.",
	"ERR_FILE_FILESIZE0": "Неможливо завантажити файл. Його розмір рівний 0,", //NEW
  "ERR_FILE_DOWNLOAD": "Неможливо завантажити файл.", //NEW
  "ERR_FILE_DOESNTEXIST": "Файл не існує", //NEW
  "ERR_FOLDER_OPEN": "Виникла помилка під час відкриття теки в якості проекту", //NEW

	"CONTEXTM_DOWNLOAD": "Завантажити",
	"CONTEXTM_UPLOAD": "Відвантажити",
	"CONTEXTM_ADDQUEUE": "Додати до черги",
	"CONTEXTM_OPEN": "Відкрити",
	"CONTEXTM_DELETE": "Видалити",
	"CONTEXTM_RENAME": "Перейменувати",
	"CONTEXTM_REDOWNLOAD": "Завантажити з сервера", //NEW

	"OTHER_SELECT_SERVER_DROPDOWN": "Оберіть сервер для підключення...",
	"OTHER_ERROR": "Помилка",
	"OTHER_PAUSED": "Призупинено",
	"OTHER_COMPLETED": "Завершено",
	"OTHER_CANCELLED": "Скасовано",
	"OTHER_WAITING": "Очікування",
	"OTHER_OK": "Ок",
	"OTHER_CANCEL": "Скасувати",
	"OTHER_APPLY": "Застосувати",
	"OTHER_CLOSE": "Закрити",
	"OTHER_DELETE": "Видалити",
	"OTHER_CONFIRM_DELETE": "Ви дійсно хочете вилучити цей елемент?", //NEW
	"OTHER_ERROR_EVENDISCONN": "Неможливо відвантажити файл. Параметр \'Навіть якщо відключено\' не увімкнено", //NEW
});
