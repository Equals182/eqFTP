define({
    "ERR_LOADING" : "Falha ao carregar :(",

    "SIDEPANEL_TITLE" : "eqFTP",
    "SIDEPANEL_OPENCONNMANGR" : "Abrir Gerenciador de Conexões",
    "SIDEPANEL_FILETREE_NAME" : "Nome",
    "SIDEPANEL_FILETREE_SIZE" : "Tamanho",
    "SIDEPANEL_FILETREE_TYPE" : "Tipo",
    "SIDEPANEL_FILETREE_MODIFIED" : "Modificado",
    "SIDEPANEL_CONDISCONNECT" : "(Des)conectar",
    "SIDEPANEL_REFRESH" : "Atualizar",
    "SIDEPANEL_RELOADSETTINGS" : "Recarregar configurações & Reentrar senha",

    "ERR_DIAG_SERVNOEXIST_TITLE" : "Servidor não existe",
    "ERR_DIAG_SERVNOEXIST_CONTENT" : "Parece que esse servidor não existe.<br>Verifique o servidor nas configurações da conexão.",
    "ERR_DIAG_SERVCANTREACH_TITLE" : "Não foi possível conectar o servidor",
    "ERR_DIAG_SERVCANTREACH_CONTENT" : "Não foi possível conectar o servidor.<br>Seu firewall não está bloqueando a conexão?.",
    "ERR_DIAG_AUTHORIZEERR_TITLE" : "Dados de autorização incorretos",
    "ERR_DIAG_AUTHORIZEERR_CONTENT" : "Erro ao logar com o usuário e senha informados.<br>Por favor, verifique-os.",
    "ERR_DIAG_NOSERVERFOUND_TITLE" : "Conexão não encontrada",
    "ERR_DIAG_NOSERVERFOUND_CONTENT" : "Não existem conexões ativas e nem servidores conectados ao projeto atual.<br>Conecte-se a um servidor ou especifique a pasta do projeto atual como caminho local para a conexão em Configurações.",
    "ERR_DIAG_ECONNRESET_TITLE" : "O servidor está negando as conexões",
    "ERR_DIAG_ECONNRESET_CONTENT" : "Não foi possível conectar o servidor, acesso negado.<br>Experimente reiniciar o Brackets.",
    "ERR_DIAG_ECONNABORTED_TITLE" : "Você foi desconectado do servidor", //NEW
	"ERR_DIAG_ECONNABORTED_CONTENT" : "Conexão abortada. Tentando reconectar...", //NEW
    "ERR_DIAG_UNIVERSAL_TITLE" : "Ocorreu um erro",
    "ERR_DIAG_UNIVERSAL_CONTENT" : "Veja esse erro! Como isso pôde acontecer?",

    "NOT_DIAG_CONNECTED" : "Conectado ao servidor.", //NEW
    "NOT_DIAG_DISCONNECTED" : "Desconectado do servidor.", //NEW
    
    "PASSWDWIND_TITLE" : "Por favor, informe sua senha",
    "PASSWDWIND_CONTENT" : "Sua senha para o eqFTP:",

    "SETTINGSWIND_TITLE" : "Gerenciador de Conexões do eqFTP",
    "SETTINGSWIND_ERR_BLANKS" : "Nossa! Parece que aconteceu alguma coisa errada. Verifique os campos de entrada e tente novamente.",
    "SETTINGSWIND_ERR_CANTWRITE" : "Alguma coisa muito errada aconteceu! Não pude gravar as configurações no arquivo!",
    "SETTINGSWIND_ERR_LOCALPATHREPEAT" : "O caminho que você está tentando inserir está sendo usado por outra conexão.",
    "SETTINGSWIND_NOTIF_DONE" : "Tudo foi gravado! :)",
    "SETTINGSWIND_SAVEDCONN" : "Conexões FTP gravadas",
    "SETTINGSWIND_DELETECONN_HOVER" : "Remover esta conexão",
    "SETTINGSWIND_ADDCONN_HOVER" : "Adicionar nova conexão",
    "SETTINGSWIND_ADDCONN_STRING" : "Criar nova conexão...",
    "SETTINGSWIND_DELETECONNCONF_1" : "Por favor, confirme a remoção da conexão ",
    "SETTINGSWIND_DELETECONNCONF_2" : ".",
    "SETTINGSWIND_OPENGLOBSET" : "Abrir configuração globais de FTP...",
    "SETTINGSWIND_NOTHINGYETMSG" : "Escolha a conexão para editar na barra lateral ou crie uma nova.",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ" : "Pasta para projetos:",
    "SETTINGSWIND_GLOB_FOLDERFORPROJ_DIAGTITLE" : "Diretório para projetos com arquivos baixados:",
    "SETTINGSWIND_GLOB_FOLDERFORSET" : "Pasta para configurações:",
    "SETTINGSWIND_GLOB_FOLDERFORSET_DIAGTITLE" : "Diretório para arquivo de configurações",
    "SETTINGSWIND_GLOB_DONTOPENPROJECTS" : "Não abrir projetos após download",
    "SETTINGSWIND_GLOB_STORESAFELY" : "Salve senhas com segurança",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_TITLE" : "Nome da conexão:",
    "SETTINGSWIND_GLOB_CONNECTIONNAME_FIELD" : "Digite o nome da conexão",
    "SETTINGSWIND_GLOB_SERVER_TITLE" : "Servidor:",
    "SETTINGSWIND_GLOB_PROTOCOL_TITLE" : "Tipo do protocolo:",
    "SETTINGSWIND_GLOB_USERNAME_TITLE" : "Usuário:",
    "SETTINGSWIND_GLOB_USERNAME_FIELD" : "Usuário do FTP",
    "SETTINGSWIND_GLOB_PASSWORD_TITLE" : "Senha:",
    "SETTINGSWIND_GLOB_PASSWORD_FIELD" : "Senha do FTP",
    "SETTINGSWIND_GLOB_REMOTEPATH_TITLE" : "Caminho remoto:",
    "SETTINGSWIND_GLOB_REMOTEPATH_FIELD" : "Digite o caminho remoto para a pasta raiz do projeto",
    "SETTINGSWIND_GLOB_LOCALPATH_TITLE" : "Caminho local:",
    "SETTINGSWIND_GLOB_LOCALPATH_FIELD" : "Deixe em branco para criar uma nova pasta no local padrão",
    "SETTINGSWIND_GLOB_UPLOADONSAVE" : "Fazer upload do arquivo ao gravar",
    "SETTINGSWIND_GLOB_EVENDISCONN" : "Mesmo se desconectado",
    "SETTINGSWIND_GLOB_EVENDISCONN_EXPLAIN" : "Essa opção permite conectar automaticamente ao servidor quando o arquivo sendo gravado tiver sido aberto daquele servidor, ou quando o arquivo sendo gravado estiver dentro do projeto atual e este projeto tiver sido criado por esta extensão ftp. Nossa, espero ter conseguido explicar isso direito...",
    "SETTINGSWIND_GLOB_LOCALPATH_FILLWPROJECT_TITLE" : "Insira o caminho do projeto atual",
    "SETTINGSWIND_GLOB_USELIST" : "Usar método alternativo para listagem das pastas",
    "SETTINGSWIND_GLOB_KEEPALIVE" : "Intervalo de Keep Alive",
    "SETTINGSWIND_GLOB_KEEPALIVE_DESC" : "Valor em segundos. O valor recomendado é 10. Use zero para desativar o keep alive e desconectar do servidor a cada comando executado.",
    "SETTINGSWIND_GLOB_DEBUG" : "Debug:",
    "SETTINGSWIND_GLOB_TIMEFORMAT" : "Formato da data:",
    "SETTINGSWIND_GLOB_TIMEFORMAT_US" : "US",
    "SETTINGSWIND_GLOB_TIMEFORMAT_EU" : "Europeu",
	"SETTINGSWIND_GLOB_TIMEFORMAT_ASIAN" : "Ásia", //NEW
    "SETTINGSWIND_GLOB_SYNC" : "Sincronizar",
    "SETTINGSWIND_GLOB_SYNC_DESC" : "Irá excluir ou renomear o arquivo no servidor remoto após ele ter sido alterado no Brackets.",
	"SETTINGSWIND_GLOB_AUTOCLEAR" : "Limpar queue automaticamente", //NEW
    "SETTINGSWIND_GLOB_NOTIFICATIONS" : "Notificações", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET" : "Fuso horário:", //NEW
    "SETTINGSWIND_GLOB_TIMEOFFSET_DESC" : "Use essa opção para definir a hora correta para a coluna modificada", //NEW

    "QUEUE_TITLE" : "Fila eqFTP",
    "QUEUE_TITLE_HOVER" : "Clique para abrir a fila eqFTP",
    "QUEUE_HEADER_NAME" : "Nome",
    "QUEUE_HEADER_PATH" : "Caminho",
    "QUEUE_HEADER_FROM" : "De/Origem",
    "QUEUE_HEADER_TO" : "Para/Destino",
    "QUEUE_HEADER_STATUS" : "Status",
	"QUEUE_REMOVE" : "Excluir da fila", 
    "QUEUE_CONTEXTM_STARTQ" : "Iniciar tarefa",
    "QUEUE_CONTEXTM_PAUSEQ" : "Pausar tarefa",
    "QUEUE_CONTEXTM_CLEARQ" : "Limpar fila",
    "QUEUE_CONTEXTM_CLEARCOMPQ" : "Limpar tarefas concluídas",
    "QUEUE_CONTEXTM_CLEARFAILQ" : "Limpar tarefas que falharam",
	"QUEUE_CONTEXTM_CLEARPAUSQ" : "Limpar tarefas pausadas", //NEW
    "QUEUE_CONTEXTM_RESTARTFAILQ" : "Reiniciar tarefas que falharam",
	"QUEUE_DONT_ADD_COMPLETED" : "Auto limpar tarefas concluídas", //NEW
    "ERR_FILE_ACCESSDENIED" : "Acesso negado. Verifique as permissões do arquivo.",
    "ERR_FILE_AUTHORIZATION" : "Erro de autorização. Verifique seu usuário e senha.",
    "ERR_FILE_SERVNOEXIST" : "Servidor não existe. Talvez você tenha digitado errado o endereço.",
    "ERR_FILE_SERVCANTREACH" : "Não pude alcançar o servidor. Verifique o firewall.",
	"ERR_FILE_FILESIZE0" : "Erro ao baixar o arquivo. Ele está vazio.", //NEW
    "ERR_FILE_DOWNLOAD" : "Erro ao baixar o arquivo.", //NEW
    "ERR_FILE_DOESNTEXIST" : "Arquivo não existe", //NEW
    "ERR_FOLDER_OPEN" : "Erro ao abrir a pasta do projeto", //NEW

    "CONTEXTM_DOWNLOAD" : "Download",
    "CONTEXTM_UPLOAD" : "Upload",
    "CONTEXTM_ADDQUEUE" : "Adicionar à Fila",
    "CONTEXTM_OPEN" : "Abrir",
    "CONTEXTM_DELETE" : "Excluir",
    "CONTEXTM_RENAME" : "Renomear",
	"CONTEXTM_REDOWNLOAD" : "Baixar do servidor", //NEW

    "OTHER_SELECT_SERVER_DROPDOWN" : "Selecionar servidor remoto para conexão...",
    "OTHER_ERROR" : "Erro",
    "OTHER_PAUSED" : "Pausado",
    "OTHER_COMPLETED" : "Completo",
	"OTHER_CANCELLED" : "Cancelado",
    "OTHER_WAITING" : "Aguardando",
    "OTHER_OK" : "Ok",
    "OTHER_CANCEL" : "Cancelar",
    "OTHER_APPLY" : "Aplicar",
    "OTHER_CLOSE" : "Fechar",
	"OTHER_DELETE" : "Excluir",
	"OTHER_CONFIRM_DELETE" : "Tem certeza que deseja deletar esse item?", //NEW
	"OTHER_ERROR_EVENDISCONN" : "Erro ao enviar o arquivo. A opção 'Mesmo desconectado' está desativada.", //NEW
});