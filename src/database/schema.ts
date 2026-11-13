/**
 * SQLite schema + migrations for SHOHAN CV STUDIO.
 *
 * The same schema is used by:
 *  - the Electron desktop build (file stored in %APPDATA%/Shohan CV Studio/data)
 *  - the browser build / automated tests (bytes persisted through a platform adapter)
 *
 * Design notes
 *  - Content lives in normalised child tables keyed by cv_projects(id) with
 *    ON DELETE CASCADE, so a project is always saved atomically.
 *  - cv_projects keeps only scalars, flags, design tokens and the template id.
 *  - project_versions keeps an immutable snapshot per save (version history).
 *  - No fabricated content is ever seeded; catalog tables are static reference data.
 */

export interface Migration {
  version: number;
  name: string;
  up: string[];
}

export const SCHEMA_VERSION = 2;

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial-schema',
    up: [
      `CREATE TABLE IF NOT EXISTS meta (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       );`,

      `CREATE TABLE IF NOT EXISTS customers (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         phone TEXT NOT NULL DEFAULT '',
         email TEXT NOT NULL DEFAULT '',
         address TEXT NOT NULL DEFAULT '',
         notes TEXT NOT NULL DEFAULT '',
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL,
         deleted_at TEXT
       );`,
      `CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);`,
      `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);`,

      `CREATE TABLE IF NOT EXISTS cv_projects (
         id TEXT PRIMARY KEY,
         customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
         title TEXT NOT NULL,
         template_id TEXT NOT NULL DEFAULT 'classic-professional',
         status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','completed','archived')),
         cv_language TEXT NOT NULL DEFAULT 'en',
         has_experience INTEGER NOT NULL DEFAULT 0,
         version INTEGER NOT NULL DEFAULT 1,
         design_json TEXT NOT NULL DEFAULT '{}',
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL,
         deleted_at TEXT
       );`,
      `CREATE INDEX IF NOT EXISTS idx_projects_customer ON cv_projects(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_projects_updated ON cv_projects(updated_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_projects_status ON cv_projects(status);`,

      `CREATE TABLE IF NOT EXISTS personal_information (
         project_id TEXT PRIMARY KEY REFERENCES cv_projects(id) ON DELETE CASCADE,
         full_name TEXT NOT NULL DEFAULT '',
         first_name TEXT NOT NULL DEFAULT '',
         middle_name TEXT NOT NULL DEFAULT '',
         last_name TEXT NOT NULL DEFAULT '',
         father_name TEXT NOT NULL DEFAULT '',
         mother_name TEXT NOT NULL DEFAULT '',
         date_of_birth TEXT NOT NULL DEFAULT '',
         gender TEXT NOT NULL DEFAULT '',
         nationality TEXT NOT NULL DEFAULT '',
         religion TEXT NOT NULL DEFAULT '',
         marital_status TEXT NOT NULL DEFAULT '',
         blood_group TEXT NOT NULL DEFAULT '',
         height TEXT NOT NULL DEFAULT '',
         weight TEXT NOT NULL DEFAULT '',
         national_id TEXT NOT NULL DEFAULT '',
         passport_no TEXT NOT NULL DEFAULT '',
         present_address TEXT NOT NULL DEFAULT '',
         permanent_address TEXT NOT NULL DEFAULT '',
         city TEXT NOT NULL DEFAULT '',
         district TEXT NOT NULL DEFAULT '',
         postal_code TEXT NOT NULL DEFAULT '',
         country TEXT NOT NULL DEFAULT '',
         mobile TEXT NOT NULL DEFAULT '',
         alt_phone TEXT NOT NULL DEFAULT '',
         email TEXT NOT NULL DEFAULT '',
         linkedin TEXT NOT NULL DEFAULT '',
         portfolio TEXT NOT NULL DEFAULT '',
         website TEXT NOT NULL DEFAULT '',
         headline TEXT NOT NULL DEFAULT '',
         other_links_json TEXT NOT NULL DEFAULT '[]',
         photo_json TEXT NOT NULL DEFAULT '{}',
         visibility_json TEXT NOT NULL DEFAULT '{}'
       );`,

      `CREATE TABLE IF NOT EXISTS education (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         degree TEXT NOT NULL DEFAULT '',
         subject_group TEXT NOT NULL DEFAULT '',
         institution TEXT NOT NULL DEFAULT '',
         board TEXT NOT NULL DEFAULT '',
         passing_year TEXT NOT NULL DEFAULT '',
         result TEXT NOT NULL DEFAULT '',
         gpa TEXT NOT NULL DEFAULT '',
         scale TEXT NOT NULL DEFAULT '',
         division TEXT NOT NULL DEFAULT '',
         location TEXT NOT NULL DEFAULT '',
         additional_info TEXT NOT NULL DEFAULT '',
         currently_studying INTEGER NOT NULL DEFAULT 0
       );`,
      `CREATE INDEX IF NOT EXISTS idx_education_project ON education(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS work_experience (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         industry TEXT NOT NULL DEFAULT '',
         company TEXT NOT NULL DEFAULT '',
         job_title TEXT NOT NULL DEFAULT '',
         employment_type TEXT NOT NULL DEFAULT '',
         location TEXT NOT NULL DEFAULT '',
         start_date TEXT NOT NULL DEFAULT '',
         end_date TEXT NOT NULL DEFAULT '',
         currently_working INTEGER NOT NULL DEFAULT 0,
         responsibilities_json TEXT NOT NULL DEFAULT '[]',
         achievements_json TEXT NOT NULL DEFAULT '[]',
         projects TEXT NOT NULL DEFAULT '',
         tools TEXT NOT NULL DEFAULT '',
         additional_details TEXT NOT NULL DEFAULT ''
       );`,
      `CREATE INDEX IF NOT EXISTS idx_experience_project ON work_experience(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS skills (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         name TEXT NOT NULL DEFAULT '',
         category TEXT NOT NULL DEFAULT 'Other',
         level TEXT NOT NULL DEFAULT 'intermediate'
       );`,
      `CREATE INDEX IF NOT EXISTS idx_skills_project ON skills(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS languages (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         name TEXT NOT NULL DEFAULT '',
         reading TEXT NOT NULL DEFAULT 'intermediate',
         writing TEXT NOT NULL DEFAULT 'intermediate',
         speaking TEXT NOT NULL DEFAULT 'intermediate',
         listening TEXT NOT NULL DEFAULT 'intermediate',
         overall TEXT NOT NULL DEFAULT 'intermediate'
       );`,
      `CREATE INDEX IF NOT EXISTS idx_languages_project ON languages(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS training (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         title TEXT NOT NULL DEFAULT '',
         institution TEXT NOT NULL DEFAULT '',
         issuing_organization TEXT NOT NULL DEFAULT '',
         completion_date TEXT NOT NULL DEFAULT '',
         duration TEXT NOT NULL DEFAULT '',
         certificate_id TEXT NOT NULL DEFAULT '',
         description TEXT NOT NULL DEFAULT '',
         skills_learned TEXT NOT NULL DEFAULT ''
       );`,
      `CREATE INDEX IF NOT EXISTS idx_training_project ON training(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS projects (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         name TEXT NOT NULL DEFAULT '',
         description TEXT NOT NULL DEFAULT '',
         role TEXT NOT NULL DEFAULT '',
         technologies TEXT NOT NULL DEFAULT '',
         start_date TEXT NOT NULL DEFAULT '',
         end_date TEXT NOT NULL DEFAULT '',
         url TEXT NOT NULL DEFAULT '',
         contributions_json TEXT NOT NULL DEFAULT '[]',
         outcome TEXT NOT NULL DEFAULT ''
       );`,
      `CREATE INDEX IF NOT EXISTS idx_projects_child ON projects(project_id, sort_order);`,

      `CREATE TABLE IF NOT EXISTS achievements (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         title TEXT NOT NULL DEFAULT '',
         award_name TEXT NOT NULL DEFAULT '',
         organization TEXT NOT NULL DEFAULT '',
         date TEXT NOT NULL DEFAULT '',
         description TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS strengths (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         text TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS hobbies (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         text TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS volunteer_experience (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         organization TEXT NOT NULL DEFAULT '',
         role TEXT NOT NULL DEFAULT '',
         duration TEXT NOT NULL DEFAULT '',
         responsibilities_json TEXT NOT NULL DEFAULT '[]',
         achievements TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS cv_references (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         name TEXT NOT NULL DEFAULT '',
         designation TEXT NOT NULL DEFAULT '',
         organization TEXT NOT NULL DEFAULT '',
         relationship TEXT NOT NULL DEFAULT '',
         phone TEXT NOT NULL DEFAULT '',
         email TEXT NOT NULL DEFAULT '',
         address TEXT NOT NULL DEFAULT '',
         reference_type TEXT NOT NULL DEFAULT '',
         additional_details TEXT NOT NULL DEFAULT '',
         signature_json TEXT,
         consent_given INTEGER NOT NULL DEFAULT 0
       );`,

      `CREATE TABLE IF NOT EXISTS declarations (
         project_id TEXT PRIMARY KEY REFERENCES cv_projects(id) ON DELETE CASCADE,
         enabled INTEGER NOT NULL DEFAULT 0,
         text TEXT NOT NULL DEFAULT '',
         language TEXT NOT NULL DEFAULT 'en',
         place TEXT NOT NULL DEFAULT '',
         date TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS signatures (
         project_id TEXT PRIMARY KEY REFERENCES cv_projects(id) ON DELETE CASCADE,
         enabled INTEGER NOT NULL DEFAULT 0,
         data_url TEXT,
         scale REAL NOT NULL DEFAULT 1,
         align TEXT NOT NULL DEFAULT 'right'
       );`,

      `CREATE TABLE IF NOT EXISTS career_objective (
         project_id TEXT PRIMARY KEY REFERENCES cv_projects(id) ON DELETE CASCADE,
         enabled INTEGER NOT NULL DEFAULT 1,
         category_id TEXT NOT NULL DEFAULT 'general',
         text TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS career_interests (
         project_id TEXT PRIMARY KEY REFERENCES cv_projects(id) ON DELETE CASCADE,
         enabled INTEGER NOT NULL DEFAULT 0,
         selected_json TEXT NOT NULL DEFAULT '[]',
         custom TEXT NOT NULL DEFAULT ''
       );`,

      `CREATE TABLE IF NOT EXISTS custom_sections (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         sort_order INTEGER NOT NULL DEFAULT 0,
         title TEXT NOT NULL DEFAULT '',
         items_json TEXT NOT NULL DEFAULT '[]',
         enabled INTEGER NOT NULL DEFAULT 1
       );`,

      `CREATE TABLE IF NOT EXISTS section_config (
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         section_id TEXT NOT NULL,
         enabled INTEGER NOT NULL DEFAULT 1,
         sort_order INTEGER NOT NULL DEFAULT 0,
         heading_scale REAL NOT NULL DEFAULT 1,
         PRIMARY KEY (project_id, section_id)
       );`,

      `CREATE TABLE IF NOT EXISTS templates (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         category TEXT NOT NULL,
         description TEXT NOT NULL DEFAULT '',
         ats_friendly INTEGER NOT NULL DEFAULT 0,
         photo_supported INTEGER NOT NULL DEFAULT 1,
         builtin INTEGER NOT NULL DEFAULT 1,
         design_json TEXT NOT NULL DEFAULT '{}',
         created_at TEXT NOT NULL
       );`,

      `CREATE TABLE IF NOT EXISTS template_settings (
         id TEXT PRIMARY KEY,
         base_template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
         name TEXT NOT NULL,
         design_json TEXT NOT NULL DEFAULT '{}',
         created_at TEXT NOT NULL
       );`,

      `CREATE TABLE IF NOT EXISTS export_history (
         id TEXT PRIMARY KEY,
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         project_title TEXT NOT NULL DEFAULT '',
         format TEXT NOT NULL CHECK(format IN ('docx','pdf','print')),
         file_name TEXT NOT NULL DEFAULT '',
         created_at TEXT NOT NULL,
         status TEXT NOT NULL DEFAULT 'success',
         message TEXT NOT NULL DEFAULT ''
       );`,
      `CREATE INDEX IF NOT EXISTS idx_export_created ON export_history(created_at DESC);`,

      `CREATE TABLE IF NOT EXISTS project_versions (
         project_id TEXT NOT NULL REFERENCES cv_projects(id) ON DELETE CASCADE,
         version INTEGER NOT NULL,
         snapshot_json TEXT NOT NULL,
         created_at TEXT NOT NULL,
         PRIMARY KEY (project_id, version)
       );`,

      `CREATE TABLE IF NOT EXISTS application_settings (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       );`,

      `CREATE TABLE IF NOT EXISTS backup_history (
         id TEXT PRIMARY KEY,
         file_name TEXT NOT NULL,
         path TEXT NOT NULL DEFAULT '',
         created_at TEXT NOT NULL,
         size_bytes INTEGER NOT NULL DEFAULT 0,
         verified INTEGER NOT NULL DEFAULT 0,
         kind TEXT NOT NULL DEFAULT 'manual'
       );`,

      `CREATE TABLE IF NOT EXISTS error_log (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         created_at TEXT NOT NULL,
         scope TEXT NOT NULL DEFAULT '',
         message TEXT NOT NULL DEFAULT '',
         detail TEXT NOT NULL DEFAULT ''
       );`,
    ],
  },
  {
    /**
     * v1.1 — title block, page-length policy and per-section styling.
     *
     * Additive only: existing rows keep their data, new columns carry defaults,
     * and `ALTER TABLE ... ADD COLUMN` is safe to re-run because the engine
     * checks `PRAGMA table_info` first (see SqlEngine.applyMigrations).
     */
    version: 2,
    name: 'document-composition',
    up: [
      `ALTER TABLE cv_projects ADD COLUMN title_json TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE cv_projects ADD COLUMN page_length_json TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE cv_projects ADD COLUMN section_styles_json TEXT NOT NULL DEFAULT '';`,
      `CREATE INDEX IF NOT EXISTS idx_versions_project ON project_versions(project_id, version);`,
      `CREATE INDEX IF NOT EXISTS idx_export_history_project ON export_history(project_id, created_at DESC);`,
    ],
  },
];

/** Static reference data inserted once (no user content). */
export const BUILTIN_TEMPLATES_SQL = `
INSERT OR IGNORE INTO templates (id, name, category, description, ats_friendly, photo_supported, builtin, design_json, created_at)
VALUES {{VALUES}};
`;
