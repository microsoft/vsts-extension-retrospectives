const DEFAULT_LOCALE = "en-US";

const translations = {
  en: {
    common_loading: "Loading...",
    common_close: "Close",
    common_save: "Save",
    common_cancel: "Cancel",
    common_copy_to_clipboard: "Copy to clipboard",
    common_download_pdf: "Download PDF",
    app_error_boundary_heading: "We detected an error in the application",
    app_init_failed_heading: "Unable to load Retrospectives",
    app_init_failed_description: "The extension failed to initialize. This can happen if browser extensions, tracking prevention, or security tools are blocking required resources.",
    app_init_failed_steps_heading: "Try these steps:",
    app_init_failed_step_incognito: "Open this page in an InPrivate or Incognito window",
    app_init_failed_step_disable_extensions: "Disable browser extensions temporarily",
    app_init_failed_step_tracking_prevention: "Check that tracking prevention is not set to Strict",
    app_init_failed_step_refresh: "Refresh the page",
    feedback_board_team_list_error: "We are unable to retrieve the list of teams for this project. Try reloading the page.",
    feedback_board_link_copied: "The link to retrospective {{title}} ({{phase}} phase) has been copied to your clipboard.",
    feedback_board_email_copied: "The email summary for \"{{title}}\" has been copied to your clipboard.",
    feedback_board_answer_all_questions: "Please answer all questions before saving.",
    feedback_board_archive_title: "Archive Retrospective",
    feedback_board_archive_message: "The retrospective board {{title}} with its feedback will be archived.",
    feedback_board_archive_note: "Archived retrospectives remain available on the History tab, where they can be restored or deleted.",
    feedback_board_archive_button: "Archive",
    feedback_board_create_new: "Create new retrospective",
    feedback_board_create_copy: "Create copy of retrospective",
    feedback_board_edit: "Edit retrospective",
    feedback_board_create_example: "Example: Retrospective {{date}}",
    feedback_board_email_summary: "Email summary",
    feedback_board_email_summary_aria: "Email summary for retrospective",
    feedback_board_retro_summary: "Retrospective board summary",
    feedback_board_basic_settings: "Basic Settings",
    feedback_board_created_date: "Created date: {{date}}",
    feedback_board_created_by: "Created by",
    feedback_board_participant_summary: "Participant Summary",
    feedback_board_contributors_count: "Contributors: {{count}} participant(s)",
    feedback_board_votes_summary: "{{participants}} participant(s) casted {{votes}} vote(s)",
    feedback_board_feedback_items_created: "{{count}} feedback item(s) created",
    feedback_board_action_items_created: "{{count}} action item(s) created",
    feedback_board_team_assessment_history: "Team Assessment History",
    feedback_board_team_assessment_no_history: "No team assessment history available.",
    feedback_board_team_assessment_trends: "Create retrospectives with team assessments to see historical trends.",
    feedback_board_team_assessment_showing_average_scores: "Showing average scores over time across {{count}} retrospective{{suffix}}.",
    feedback_board_team_assessment_history_chart_aria: "Team assessment history line chart showing scores over time",
    feedback_board_average_score: "Average Score",
    feedback_board_permissions: "Permissions",
    feedback_board_permission_settings: "Board Permission Settings",
    board_summary_work_item_type_icon: "Work item type icon",
    board_summary_work_item_icon: "Work Item Icon",
    board_summary_work_item_title: "Work item title",
    board_summary_icon_alt: "{{type}} icon",
    board_summary_title: "Title",
    board_summary_work_item_state: "Work item state",
    board_summary_state: "State",
    board_summary_work_item_type: "Work item type",
    board_summary_type: "Type",
    board_summary_work_item_changed_date: "Work item changed date",
    board_summary_last_updated: "Last Updated",
    board_summary_work_item_assigned_to: "Work item assigned to",
    board_summary_assigned_to: "Assigned To",
    board_summary_work_item_priority: "Work item priority",
    board_summary_priority: "Priority",
    board_summary_table_toggle_archive_enable_delete: "Toggle archive off and on to enable delete.",
    board_summary_table_delete_board: "Delete board",
    board_summary_table_wait_to_delete: "To delete this board, you must wait for 2 minutes after archiving.",
    board_summary_table_expand_row: "Expand Row",
    board_summary_table_retrospective_name: "Retrospective Name",
    board_summary_table_created_date: "Created Date",
    board_summary_table_archived: "Archived",
    board_summary_table_archived_date: "Archived Date",
    board_summary_table_feedback_items: "Feedback Items",
    board_summary_table_total_work_items: "Total Work Items",
    board_summary_table_delete_help: "Archived boards can be deleted by board owner or team admin.",
    sprint_retro_board_title: "{{iteration}} Retrospective",
    sprint_retro_create_current: "Create new for current sprint",
    sprint_retro_current_not_found: "No current sprint is configured for this team.",
  },
  es: {
    common_loading: "Cargando...",
    common_close: "Cerrar",
    common_save: "Guardar",
    common_cancel: "Cancelar",
    common_copy_to_clipboard: "Copiar al portapapeles",
    common_download_pdf: "Descargar PDF",
    app_error_boundary_heading: "Detectamos un error en la aplicacion",
    app_init_failed_heading: "No se pudo cargar Retrospectives",
    app_init_failed_description: "La extension no pudo iniciarse. Esto puede ocurrir si extensiones del navegador, prevencion de rastreo o herramientas de seguridad estan bloqueando recursos necesarios.",
    app_init_failed_steps_heading: "Prueba estos pasos:",
    app_init_failed_step_incognito: "Abre esta pagina en una ventana InPrivate/Incognito",
    app_init_failed_step_disable_extensions: "Deshabilita temporalmente las extensiones del navegador",
    app_init_failed_step_tracking_prevention: "Comprueba que la prevencion de rastreo no este en modo estricto",
    app_init_failed_step_refresh: "Recarga la pagina",
    feedback_board_team_list_error: "No podemos recuperar la lista de equipos de este proyecto. Intenta recargar la pagina.",
    feedback_board_link_copied: "El enlace a la retrospectiva {{title}} (fase {{phase}}) se copio a tu portapapeles.",
    feedback_board_email_copied: "El resumen por correo de \"{{title}}\" se copio a tu portapapeles.",
    feedback_board_answer_all_questions: "Responde todas las preguntas antes de guardar",
    feedback_board_archive_title: "Archivar retrospectiva",
    feedback_board_archive_message: "Se archivara el tablero de retrospectiva {{title}} con sus comentarios.",
    feedback_board_archive_note: "Las retrospectivas archivadas siguen disponibles en la pestana History, donde pueden restaurarse o eliminarse.",
    feedback_board_archive_button: "Archivar",
    feedback_board_create_new: "Crear nueva retrospectiva",
    feedback_board_create_copy: "Crear copia de la retrospectiva",
    feedback_board_edit: "Editar retrospectiva",
    feedback_board_create_example: "Ejemplo: Retrospectiva {{date}}",
    feedback_board_email_summary: "Resumen por correo",
    feedback_board_email_summary_aria: "Resumen por correo de la retrospectiva",
    feedback_board_retro_summary: "Resumen del tablero de retrospectiva",
    feedback_board_basic_settings: "Configuracion basica",
    feedback_board_created_date: "Fecha de creacion: {{date}}",
    feedback_board_created_by: "Creado por",
    feedback_board_participant_summary: "Resumen de participantes",
    feedback_board_contributors_count: "Colaboradores: {{count}} participante(s)",
    feedback_board_votes_summary: "{{participants}} participante(s) emitieron {{votes}} voto(s)",
    feedback_board_feedback_items_created: "{{count}} elemento(s) de feedback creado(s)",
    feedback_board_action_items_created: "{{count}} accion(es) creada(s)",
    feedback_board_team_assessment_history: "Historial de evaluacion del equipo",
    feedback_board_team_assessment_no_history: "No hay historial de evaluacion del equipo.",
    feedback_board_team_assessment_trends: "Crea retrospectivas con evaluaciones del equipo para ver tendencias historicas.",
    feedback_board_team_assessment_showing_average_scores: "Mostrando puntuaciones promedio en {{count}} retrospectiva{{suffix}}.",
    feedback_board_team_assessment_history_chart_aria: "Grafico de lineas del historial de evaluacion del equipo con puntuaciones a lo largo del tiempo",
    feedback_board_average_score: "Puntuacion promedio",
    feedback_board_permissions: "Permisos",
    feedback_board_permission_settings: "Configuracion de permisos del tablero",
    board_summary_work_item_type_icon: "Icono del tipo de elemento de trabajo",
    board_summary_work_item_icon: "Icono del elemento de trabajo",
    board_summary_work_item_title: "Titulo del elemento de trabajo",
    board_summary_icon_alt: "Icono de {{type}}",
    board_summary_title: "Titulo",
    board_summary_work_item_state: "Estado del elemento de trabajo",
    board_summary_state: "Estado",
    board_summary_work_item_type: "Tipo de elemento de trabajo",
    board_summary_type: "Tipo",
    board_summary_work_item_changed_date: "Fecha de actualizacion del elemento de trabajo",
    board_summary_last_updated: "Ultima actualizacion",
    board_summary_work_item_assigned_to: "Elemento de trabajo asignado a",
    board_summary_assigned_to: "Asignado a",
    board_summary_work_item_priority: "Prioridad del elemento de trabajo",
    board_summary_priority: "Prioridad",
    board_summary_table_toggle_archive_enable_delete: "Desactiva y vuelve a activar el archivo para habilitar la eliminacion.",
    board_summary_table_delete_board: "Eliminar tablero",
    board_summary_table_wait_to_delete: "Para eliminar este tablero, debes esperar 2 minutos despues de archivarlo.",
    board_summary_table_expand_row: "Expandir fila",
    board_summary_table_retrospective_name: "Nombre de la retrospectiva",
    board_summary_table_created_date: "Fecha de creacion",
    board_summary_table_archived: "Archivado",
    board_summary_table_archived_date: "Fecha de archivo",
    board_summary_table_feedback_items: "Elementos de feedback",
    board_summary_table_total_work_items: "Elementos de trabajo totales",
    board_summary_table_delete_help: "Los tableros archivados pueden ser eliminados por el propietario o por un administrador del equipo.",
    sprint_retro_board_title: "{{iteration}} Retrospective",
    sprint_retro_create_current: "Create new for current sprint",
    sprint_retro_current_not_found: "No current sprint is configured for this team.",
  },
  de: {
    common_loading: "Wird geladen...",
    common_close: "Schliessen",
    common_save: "Speichern",
    common_cancel: "Abbrechen",
    common_copy_to_clipboard: "In die Zwischenablage kopieren",
    common_download_pdf: "PDF herunterladen",
    app_error_boundary_heading: "Wir haben einen Fehler in der Anwendung erkannt",
    app_init_failed_heading: "Retrospectives konnte nicht geladen werden",
    app_init_failed_description: "Die Erweiterung konnte nicht initialisiert werden. Dies kann passieren, wenn Browsererweiterungen, Tracking-Schutz oder Sicherheitstools erforderliche Ressourcen blockieren.",
    app_init_failed_steps_heading: "Versuchen Sie diese Schritte:",
    app_init_failed_step_incognito: "Oeffnen Sie diese Seite in einem InPrivate-/Inkognito-Fenster",
    app_init_failed_step_disable_extensions: "Deaktivieren Sie Browsererweiterungen voruebergehend",
    app_init_failed_step_tracking_prevention: "Pruefen Sie, dass der Tracking-Schutz nicht auf Streng gesetzt ist",
    app_init_failed_step_refresh: "Aktualisieren Sie die Seite",
    feedback_board_team_list_error: "Die Teamliste fuer dieses Projekt konnte nicht abgerufen werden. Versuchen Sie, die Seite neu zu laden.",
    feedback_board_link_copied: "Der Link zur Retrospektive {{title}} (Phase {{phase}}) wurde in Ihre Zwischenablage kopiert.",
    feedback_board_email_copied: "Die E-Mail-Zusammenfassung fuer \"{{title}}\" wurde in Ihre Zwischenablage kopiert.",
    feedback_board_answer_all_questions: "Bitte beantworten Sie alle Fragen, bevor Sie speichern",
    feedback_board_archive_title: "Retrospektive archivieren",
    feedback_board_archive_message: "Das Retrospektiven-Board {{title}} wird zusammen mit seinem Feedback archiviert.",
    feedback_board_archive_note: "Archivierte Retrospektiven bleiben auf der Registerkarte History verfuegbar, wo sie wiederhergestellt oder geloescht werden koennen.",
    feedback_board_archive_button: "Archivieren",
    feedback_board_create_new: "Neue Retrospektive erstellen",
    feedback_board_create_copy: "Kopie der Retrospektive erstellen",
    feedback_board_edit: "Retrospektive bearbeiten",
    feedback_board_create_example: "Beispiel: Retrospektive {{date}}",
    feedback_board_email_summary: "E-Mail-Zusammenfassung",
    feedback_board_email_summary_aria: "E-Mail-Zusammenfassung fuer die Retrospektive",
    feedback_board_retro_summary: "Zusammenfassung des Retrospektiven-Boards",
    feedback_board_basic_settings: "Grundeinstellungen",
    feedback_board_created_date: "Erstellt am: {{date}}",
    feedback_board_created_by: "Erstellt von",
    feedback_board_participant_summary: "Teilnehmerzusammenfassung",
    feedback_board_contributors_count: "Mitwirkende: {{count}} Teilnehmer",
    feedback_board_votes_summary: "{{participants}} Teilnehmer haben {{votes}} Stimmen abgegeben",
    feedback_board_feedback_items_created: "{{count}} Feedback-Eintraege erstellt",
    feedback_board_action_items_created: "{{count}} Aktionspunkte erstellt",
    feedback_board_team_assessment_history: "Verlauf der Team-Bewertung",
    feedback_board_team_assessment_no_history: "Kein Verlauf der Team-Bewertung verfuegbar.",
    feedback_board_team_assessment_trends: "Erstellen Sie Retrospektiven mit Team-Bewertungen, um historische Trends zu sehen.",
    feedback_board_team_assessment_showing_average_scores: "Durchschnittswerte im Zeitverlauf ueber {{count}} Retrospektive{{suffix}} werden angezeigt.",
    feedback_board_team_assessment_history_chart_aria: "Liniendiagramm des Verlaufs der Team-Bewertung mit Werten im Zeitverlauf",
    feedback_board_average_score: "Durchschnittswert",
    feedback_board_permissions: "Berechtigungen",
    feedback_board_permission_settings: "Einstellungen fuer Board-Berechtigungen",
    board_summary_work_item_type_icon: "Symbol fuer Arbeitselementtyp",
    board_summary_work_item_icon: "Arbeitselementsymbol",
    board_summary_work_item_title: "Titel des Arbeitselements",
    board_summary_icon_alt: "{{type}}-Symbol",
    board_summary_title: "Titel",
    board_summary_work_item_state: "Status des Arbeitselements",
    board_summary_state: "Status",
    board_summary_work_item_type: "Typ des Arbeitselements",
    board_summary_type: "Typ",
    board_summary_work_item_changed_date: "Aenderungsdatum des Arbeitselements",
    board_summary_last_updated: "Zuletzt aktualisiert",
    board_summary_work_item_assigned_to: "Arbeitselement zugewiesen an",
    board_summary_assigned_to: "Zugewiesen an",
    board_summary_work_item_priority: "Prioritaet des Arbeitselements",
    board_summary_priority: "Prioritaet",
    board_summary_table_toggle_archive_enable_delete: "Deaktivieren und aktivieren Sie das Archiv erneut, um das Loeschen zu aktivieren.",
    board_summary_table_delete_board: "Board loeschen",
    board_summary_table_wait_to_delete: "Um dieses Board zu loeschen, muessen Sie nach dem Archivieren 2 Minuten warten.",
    board_summary_table_expand_row: "Zeile erweitern",
    board_summary_table_retrospective_name: "Name der Retrospektive",
    board_summary_table_created_date: "Erstellungsdatum",
    board_summary_table_archived: "Archiviert",
    board_summary_table_archived_date: "Archivierungsdatum",
    board_summary_table_feedback_items: "Feedback-Eintraege",
    board_summary_table_total_work_items: "Arbeitselemente gesamt",
    board_summary_table_delete_help: "Archivierte Boards koennen vom Board-Besitzer oder einem Team-Administrator geloescht werden.",
    sprint_retro_board_title: "{{iteration}} Retrospective",
    sprint_retro_create_current: "Create new for current sprint",
    sprint_retro_current_not_found: "No current sprint is configured for this team.",
  },
  fr: {
    common_loading: "Chargement...",
    common_close: "Fermer",
    common_save: "Enregistrer",
    common_cancel: "Annuler",
    common_copy_to_clipboard: "Copier dans le presse-papiers",
    common_download_pdf: "Telecharger le PDF",
    app_error_boundary_heading: "Nous avons detecte une erreur dans l'application",
    app_init_failed_heading: "Impossible de charger Retrospectives",
    app_init_failed_description: "L'extension n'a pas pu etre initialisee. Cela peut se produire si des extensions du navigateur, la prevention du pistage ou des outils de securite bloquent des ressources necessaires.",
    app_init_failed_steps_heading: "Essayez les etapes suivantes :",
    app_init_failed_step_incognito: "Ouvrez cette page dans une fenetre InPrivate/Incognito",
    app_init_failed_step_disable_extensions: "Desactivez temporairement les extensions du navigateur",
    app_init_failed_step_tracking_prevention: "Verifiez que la prevention du pistage n'est pas definie sur Strict",
    app_init_failed_step_refresh: "Actualisez la page",
    feedback_board_team_list_error: "Impossible de recuperer la liste des equipes pour ce projet. Essayez d'actualiser la page.",
    feedback_board_link_copied: "Le lien vers la retrospective {{title}} (phase {{phase}}) a ete copie dans votre presse-papiers.",
    feedback_board_email_copied: "Le resume par e-mail de \"{{title}}\" a ete copie dans votre presse-papiers.",
    feedback_board_answer_all_questions: "Veuillez repondre a toutes les questions avant d'enregistrer",
    feedback_board_archive_title: "Archiver la retrospective",
    feedback_board_archive_message: "Le tableau de retrospective {{title}} sera archive avec ses commentaires.",
    feedback_board_archive_note: "Les retrospectives archivees restent disponibles dans l'onglet History, ou elles peuvent etre restaurees ou supprimees.",
    feedback_board_archive_button: "Archiver",
    feedback_board_create_new: "Creer une nouvelle retrospective",
    feedback_board_create_copy: "Creer une copie de la retrospective",
    feedback_board_edit: "Modifier la retrospective",
    feedback_board_create_example: "Exemple : Retrospective {{date}}",
    feedback_board_email_summary: "Resume par e-mail",
    feedback_board_email_summary_aria: "Resume par e-mail de la retrospective",
    feedback_board_retro_summary: "Resume du tableau de retrospective",
    feedback_board_basic_settings: "Parametres de base",
    feedback_board_created_date: "Date de creation : {{date}}",
    feedback_board_created_by: "Cree par",
    feedback_board_participant_summary: "Resume des participants",
    feedback_board_contributors_count: "Contributeurs : {{count}} participant(s)",
    feedback_board_votes_summary: "{{participants}} participant(s) ont exprime {{votes}} vote(s)",
    feedback_board_feedback_items_created: "{{count}} element(s) de feedback cree(s)",
    feedback_board_action_items_created: "{{count}} action(s) creee(s)",
    feedback_board_team_assessment_history: "Historique de l'evaluation d'equipe",
    feedback_board_team_assessment_no_history: "Aucun historique d'evaluation d'equipe disponible.",
    feedback_board_team_assessment_trends: "Creez des retrospectives avec des evaluations d'equipe pour voir les tendances historiques.",
    feedback_board_team_assessment_showing_average_scores: "Affichage des scores moyens au fil du temps sur {{count}} retrospective{{suffix}}.",
    feedback_board_team_assessment_history_chart_aria: "Graphique en courbes de l'historique de l'evaluation d'equipe montrant les scores au fil du temps",
    feedback_board_average_score: "Score moyen",
    feedback_board_permissions: "Autorisations",
    feedback_board_permission_settings: "Parametres des autorisations du tableau",
    board_summary_work_item_type_icon: "Icône du type d'element de travail",
    board_summary_work_item_icon: "Icône de l'element de travail",
    board_summary_work_item_title: "Titre de l'element de travail",
    board_summary_icon_alt: "Icône {{type}}",
    board_summary_title: "Titre",
    board_summary_work_item_state: "Etat de l'element de travail",
    board_summary_state: "Etat",
    board_summary_work_item_type: "Type d'element de travail",
    board_summary_type: "Type",
    board_summary_work_item_changed_date: "Date de modification de l'element de travail",
    board_summary_last_updated: "Derniere mise a jour",
    board_summary_work_item_assigned_to: "Element de travail assigne a",
    board_summary_assigned_to: "Assigne a",
    board_summary_work_item_priority: "Priorite de l'element de travail",
    board_summary_priority: "Priorite",
    board_summary_table_toggle_archive_enable_delete: "Desactivez puis reactivez l'archivage pour activer la suppression.",
    board_summary_table_delete_board: "Supprimer le tableau",
    board_summary_table_wait_to_delete: "Pour supprimer ce tableau, vous devez attendre 2 minutes apres l'archivage.",
    board_summary_table_expand_row: "Developper la ligne",
    board_summary_table_retrospective_name: "Nom de la retrospective",
    board_summary_table_created_date: "Date de creation",
    board_summary_table_archived: "Archive",
    board_summary_table_archived_date: "Date d'archivage",
    board_summary_table_feedback_items: "Elements de feedback",
    board_summary_table_total_work_items: "Total des elements de travail",
    board_summary_table_delete_help: "Les tableaux archives peuvent etre supprimes par le proprietaire du tableau ou un administrateur d'equipe.",
    sprint_retro_board_title: "{{iteration}} Retrospective",
    sprint_retro_create_current: "Create new for current sprint",
    sprint_retro_current_not_found: "No current sprint is configured for this team.",
  },
} as const;

type SupportedLanguage = keyof typeof translations;
type TranslationKey = keyof (typeof translations)["en"];
type InterpolationValues = Record<string, string | number>;

let activeLocale = DEFAULT_LOCALE;
let activeLanguage: SupportedLanguage = "en";

function detectPreferredLocale(): string {
  const documentLocale = typeof document !== "undefined" ? document.documentElement.lang : "";
  const browserLocale = typeof navigator !== "undefined" ? navigator.languages?.[0] ?? navigator.language : "";

  return documentLocale || browserLocale || DEFAULT_LOCALE;
}

function resolveLanguage(locale: string): SupportedLanguage {
  const language = locale.toLowerCase().split("-")[0] as SupportedLanguage;

  return language in translations ? language : "en";
}

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) {
      return `{{${key}}}`;
    }

    return String(values[key]);
  });
}

export function setLocale(locale?: string | null): string {
  activeLocale = locale?.trim() || DEFAULT_LOCALE;
  activeLanguage = resolveLanguage(activeLocale);

  if (typeof document !== "undefined") {
    document.documentElement.lang = activeLocale;
  }

  return activeLocale;
}

export function initializeLocale(locale?: string | null): string {
  return setLocale(locale || detectPreferredLocale());
}

export function getCurrentLocale(): string {
  return activeLocale;
}

export function t(key: TranslationKey, values?: InterpolationValues): string {
  const template = translations[activeLanguage][key] ?? translations.en[key];

  return interpolate(template, values);
}

export function formatDate(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(activeLocale, options).format(new Date(value));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(activeLocale, options).format(value);
}
