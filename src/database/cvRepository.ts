/**
 * Mapping layer between the canonical CVData object and normalised SQLite tables.
 * Saves are atomic: the parent row plus every child row are written inside one
 * transaction, and an immutable snapshot is appended to project_versions.
 */
import type {
  BackupRecord,
  CVData,
  PageLengthState,
  TitleState,
  CustomerRecord,
  DesignOverrides,
  ExportRecord,
  PersonalInfo,
  ProjectRecord,
  SectionConfig,
  SectionId,
} from '@/types/cv';
import type { SqlEngine } from './sqlite';
import { defaultPageLength, defaultSections, defaultTitle, nowIso } from '@/lib/defaults';
import { TITLE_PRESET_TEXT } from '@/types/cv';

/**
 * Merge a stored title block with the current defaults.
 *
 * Projects created by v1.0 predate the title block; they load with the default
 * title rather than an undefined field. Unknown/renamed fields are dropped so a
 * corrupt JSON blob can never crash the editor.
 */
function hydrateTitle(stored: Partial<TitleState> | null): TitleState {
  const base = defaultTitle();
  if (!stored || typeof stored !== 'object') return base;
  const merged: TitleState = { ...base };
  const allowed: (keyof TitleState)[] = Object.keys(base) as (keyof TitleState)[];
  for (const key of allowed) {
    const value = stored[key];
    if (value !== undefined && typeof value === typeof base[key]) {
      (merged as unknown as Record<string, unknown>)[key as string] = value;
    }
  }
  if (merged.preset === 'custom') {
    merged.text = merged.text ?? '';
  } else if (!merged.text) {
    merged.text = TITLE_PRESET_TEXT[merged.preset] ?? '';
  }
  return merged;
}

const json = (v: unknown) => JSON.stringify(v ?? null);
const parse = <T>(raw: unknown, fallback: T): T => {
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    const value = JSON.parse(String(raw));
    return (value ?? fallback) as T;
  } catch {
    return fallback;
  }
};
const bool = (v: boolean) => (v ? 1 : 0);
const str = (v: string | null | undefined) => v ?? '';

export interface ProjectSummary {
  id: string;
  customerId: string | null;
  customerName: string | null;
  title: string;
  templateId: string;
  status: string;
  cvLanguage: string;
  hasExperience: number;
  version: number;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
  fullName: string | null;
  photoDataUrl: string | null;
}

export class CvRepository {
  constructor(private engine: SqlEngine) {}

  get db(): SqlEngine {
    return this.engine;
  }

  // ---------------------------------------------------------------- customers
  listCustomers(includeDeleted = false): CustomerRecord[] {
    const rows = this.engine.all<Record<string, any>>(
      `SELECT * FROM customers ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY updated_at DESC`,
    );
    return rows.map(mapCustomer);
  }

  getCustomer(id: string): CustomerRecord | null {
    const row = this.engine.first<Record<string, any>>(`SELECT * FROM customers WHERE id = $a`, { a: id });
    return row ? mapCustomer(row) : null;
  }

  saveCustomer(customer: CustomerRecord): CustomerRecord {
    this.engine.run(
      `INSERT INTO customers (id, name, phone, email, address, notes, created_at, updated_at, deleted_at)
       VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone, email=excluded.email,
         address=excluded.address, notes=excluded.notes, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
      {
        a: customer.id,
        b: customer.name,
        c: customer.phone,
        d: customer.email,
        e: customer.address,
        f: customer.notes,
        g: customer.createdAt,
        h: customer.updatedAt,
        i: customer.deletedAt,
      },
    );
    return customer;
  }

  softDeleteCustomer(id: string): void {
    this.engine.run(`UPDATE customers SET deleted_at = $a, updated_at = $b WHERE id = $c`, {
      a: nowIso(),
      b: nowIso(),
      c: id,
    });
  }

  restoreCustomer(id: string): void {
    this.engine.run(`UPDATE customers SET deleted_at = NULL, updated_at = $a WHERE id = $b`, {
      a: nowIso(),
      b: id,
    });
  }

  hardDeleteCustomer(id: string): void {
    this.engine.transaction(() => {
      const projects = this.engine.all<{ id: string }>(`SELECT id FROM cv_projects WHERE customer_id = $a`, { a: id });
      for (const p of projects) this.hardDeleteProject(p.id);
      this.engine.run(`DELETE FROM customers WHERE id = $a`, { a: id });
    });
  }

  // ----------------------------------------------------------------- projects
  listProjects(options: { includeDeleted?: boolean; search?: string; status?: string; customerId?: string } = {}): ProjectSummary[] {
    const clauses: string[] = [];
    if (!options.includeDeleted) clauses.push('p.deleted_at IS NULL');
    if (options.status) clauses.push(`p.status = '${options.status.replace(/'/g, "''")}'`);
    if (options.customerId) clauses.push(`p.customer_id = '${options.customerId.replace(/'/g, "''")}'`);
    if (options.search) {
      const q = options.search.replace(/'/g, "''");
      clauses.push(
        `(LOWER(p.title) LIKE LOWER('%${q}%') OR LOWER(COALESCE(pi.full_name,'')) LIKE LOWER('%${q}%') OR LOWER(COALESCE(c.name,'')) LIKE LOWER('%${q}%') OR LOWER(COALESCE(c.phone,'')) LIKE LOWER('%${q}%'))`,
      );
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.engine.all<Record<string, any>>(
      `SELECT p.id, p.customer_id, c.name AS customer_name, p.title, p.template_id, p.status, p.cv_language,
              p.has_experience, p.version, p.created_at, p.updated_at, p.deleted_at,
              pi.full_name, pi.photo_json
       FROM cv_projects p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN personal_information pi ON pi.project_id = p.id
       ${where}
       ORDER BY p.updated_at DESC`,
    );
    return rows.map((r) => ({
      id: String(r.id),
      customerId: r.customer_id ? String(r.customer_id) : null,
      customerName: r.customer_name ? String(r.customer_name) : null,
      title: String(r.title),
      templateId: String(r.template_id),
      status: String(r.status),
      cvLanguage: String(r.cv_language),
      hasExperience: Number(r.has_experience ?? 0),
      version: Number(r.version ?? 1),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
      deletedAt: r.deleted_at ? String(r.deleted_at) : null,
      fullName: r.full_name ? String(r.full_name) : null,
      photoDataUrl: (parse<{ dataUrl?: string | null }>(r.photo_json, {}).dataUrl ?? null) as string | null,
    }));
  }

  saveProject(project: ProjectRecord): ProjectRecord {
    this.engine.transaction(() => {
      this.engine.run(
        `INSERT INTO cv_projects (id, customer_id, title, template_id, status, cv_language, has_experience, version, design_json, title_json, page_length_json, section_styles_json, created_at, updated_at, deleted_at)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$m,$n,$o,$j,$k,$l)
         ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id, title=excluded.title,
           template_id=excluded.template_id, status=excluded.status, cv_language=excluded.cv_language,
           has_experience=excluded.has_experience, version=excluded.version, design_json=excluded.design_json,
           title_json=excluded.title_json, page_length_json=excluded.page_length_json,
           section_styles_json=excluded.section_styles_json,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        {
          a: project.id,
          b: project.customerId,
          c: project.title,
          d: project.templateId,
          e: project.status,
          f: project.data.language,
          g: bool(project.data.hasExperience),
          h: project.version ?? 1,
          i: json(project.design),
          j: project.createdAt,
          k: project.updatedAt,
          l: project.deletedAt,
          m: json(project.data.title),
          n: json(project.data.pageLength),
          o: json(project.data.sectionStyles ?? {}),
        },
      );
      this.writeChildren(project);
      this.engine.run(
        `INSERT OR REPLACE INTO project_versions (project_id, version, snapshot_json, created_at)
         VALUES ($a,$b,$c,$d)`,
        {
          a: project.id,
          b: (project.version ?? 1),
          c: json({ data: project.data, design: project.design, templateId: project.templateId, title: project.title }),
          d: nowIso(),
        },
      );
      // Keep at most 25 snapshots per project so the local DB stays lean.
      this.engine.run(
        `DELETE FROM project_versions WHERE project_id = $a AND version <= (
           SELECT MAX(version) - 25 FROM project_versions WHERE project_id = $b
         )`,
        { a: project.id, b: project.id },
      );
    });
    return project;
  }

  private writeChildren(project: ProjectRecord): void {
    const pid = project.id;
    const data = project.data;
    const p: PersonalInfo = data.personal;

    const deleteAll = [
      'personal_information',
      'education',
      'work_experience',
      'skills',
      'languages',
      'training',
      'projects',
      'achievements',
      'strengths',
      'hobbies',
      'volunteer_experience',
      'cv_references',
      'declarations',
      'signatures',
      'career_objective',
      'career_interests',
      'custom_sections',
      'section_config',
    ];
    for (const table of deleteAll) {
      this.engine.run(`DELETE FROM ${table} WHERE ${table === 'personal_information' || table === 'declarations' || table === 'signatures' || table === 'career_objective' || table === 'career_interests' ? 'project_id' : 'project_id'} = $a`, { a: pid });
    }

    this.engine.run(
      `INSERT INTO personal_information (
         project_id, full_name, first_name, middle_name, last_name, father_name, mother_name, date_of_birth,
         gender, nationality, religion, marital_status, blood_group, height, weight, national_id, passport_no,
         present_address, permanent_address, city, district, postal_code, country, mobile, alt_phone, email,
         linkedin, portfolio, website, headline, other_links_json, photo_json, visibility_json)
       VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k,$l,$m,$n,$o,$p,$q,$r,$s,$t,$u,$v,$w,$x,$y,$z,$aa,$ab,$ac,$ad,$ae,$af,$ag)`,
      {
        a: pid,
        b: p.fullName,
        c: p.firstName,
        d: p.middleName,
        e: p.lastName,
        f: p.fatherName,
        g: p.motherName,
        h: p.dateOfBirth,
        i: p.gender,
        j: p.nationality,
        k: p.religion,
        l: p.maritalStatus,
        m: p.bloodGroup,
        n: p.height,
        o: p.weight,
        p: p.nationalId,
        q: p.passportNo,
        r: p.presentAddress,
        s: p.permanentAddress,
        t: p.city,
        u: p.district,
        v: p.postalCode,
        w: p.country,
        x: p.mobile,
        y: p.altPhone,
        z: p.email,
        aa: p.linkedin,
        ab: p.portfolio,
        ac: p.website,
        ad: p.headline,
        ae: json(p.otherLinks),
        af: json(data.photo),
        ag: json(data.personalDetails),
      },
    );

    data.education.forEach((e, i) => {
      this.engine.run(
        `INSERT INTO education (id, project_id, sort_order, degree, subject_group, institution, board, passing_year,
          result, gpa, scale, division, location, additional_info, currently_studying)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k,$l,$m,$n,$o)`,
        {
          a: e.id, b: pid, c: i, d: e.degree, e: e.group, f: e.institution, g: e.board, h: e.passingYear,
          i: e.result, j: e.gpa, k: e.scale, l: e.division, m: e.location, n: e.additionalInfo, o: bool(e.currentlyStudying),
        },
      );
    });

    data.experience.forEach((x, i) => {
      this.engine.run(
        `INSERT INTO work_experience (id, project_id, sort_order, industry, company, job_title, employment_type,
          location, start_date, end_date, currently_working, responsibilities_json, achievements_json, projects,
          tools, additional_details)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k,$l,$m,$n,$o,$p)`,
        {
          a: x.id, b: pid, c: i, d: x.industry, e: x.company, f: x.jobTitle, g: x.employmentType, h: x.location,
          i: x.startDate, j: x.endDate, k: bool(x.currentlyWorking), l: json(x.responsibilities),
          m: json(x.achievements), n: x.projects, o: x.tools, p: x.additionalDetails,
        },
      );
    });

    data.skills.forEach((s, i) => {
      this.engine.run(
        `INSERT INTO skills (id, project_id, sort_order, name, category, level) VALUES ($a,$b,$c,$d,$e,$f)`,
        { a: s.id, b: pid, c: i, d: s.name, e: s.category, f: s.level },
      );
    });

    data.languages.forEach((l, i) => {
      this.engine.run(
        `INSERT INTO languages (id, project_id, sort_order, name, reading, writing, speaking, listening, overall)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i)`,
        { a: l.id, b: pid, c: i, d: l.name, e: l.reading, f: l.writing, g: l.speaking, h: l.listening, i: l.overall },
      );
    });

    data.training.forEach((t, i) => {
      this.engine.run(
        `INSERT INTO training (id, project_id, sort_order, title, institution, issuing_organization, completion_date,
          duration, certificate_id, description, skills_learned)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k)`,
        {
          a: t.id, b: pid, c: i, d: t.title, e: t.institution, f: t.issuingOrganization, g: t.completionDate,
          h: t.duration, i: t.certificateId, j: t.description, k: t.skillsLearned,
        },
      );
    });

    data.projects.forEach((pr, i) => {
      this.engine.run(
        `INSERT INTO projects (id, project_id, sort_order, name, description, role, technologies, start_date,
          end_date, url, contributions_json, outcome)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k,$l)`,
        {
          a: pr.id, b: pid, c: i, d: pr.name, e: pr.description, f: pr.role, g: pr.technologies, h: pr.startDate,
          i: pr.endDate, j: pr.url, k: json(pr.contributions), l: pr.outcome,
        },
      );
    });

    data.achievements.forEach((a, i) => {
      this.engine.run(
        `INSERT INTO achievements (id, project_id, sort_order, title, award_name, organization, date, description)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h)`,
        { a: a.id, b: pid, c: i, d: a.title, e: a.awardName, f: a.organization, g: a.date, h: a.description },
      );
    });

    data.strengths.forEach((s, i) => {
      this.engine.run(`INSERT INTO strengths (id, project_id, sort_order, text) VALUES ($a,$b,$c,$d)`, {
        a: s.id, b: pid, c: i, d: s.text,
      });
    });

    data.hobbies.forEach((h, i) => {
      this.engine.run(`INSERT INTO hobbies (id, project_id, sort_order, text) VALUES ($a,$b,$c,$d)`, {
        a: h.id, b: pid, c: i, d: h.text,
      });
    });

    data.volunteer.forEach((v, i) => {
      this.engine.run(
        `INSERT INTO volunteer_experience (id, project_id, sort_order, organization, role, duration, responsibilities_json, achievements)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h)`,
        { a: v.id, b: pid, c: i, d: v.organization, e: v.role, f: v.duration, g: json(v.responsibilities), h: v.achievements },
      );
    });

    data.references.forEach((r, i) => {
      this.engine.run(
        `INSERT INTO cv_references (id, project_id, sort_order, name, designation, organization, relationship, phone,
          email, address, reference_type, additional_details, signature_json, consent_given)
         VALUES ($a,$b,$c,$d,$e,$f,$g,$h,$i,$j,$k,$l,$m,$n)`,
        {
          a: r.id, b: pid, c: i, d: r.name, e: r.designation, f: r.organization, g: r.relationship, h: r.phone,
          i: r.email, j: r.address, k: r.referenceType, l: r.additionalDetails,
          m: r.signatureDataUrl ? json({ dataUrl: r.signatureDataUrl }) : null, n: bool(r.consentGiven),
        },
      );
    });

    this.engine.run(
      `INSERT INTO declarations (project_id, enabled, text, language, place, date) VALUES ($a,$b,$c,$d,$e,$f)`,
      {
        a: pid, b: bool(data.declaration.enabled), c: data.declaration.text, d: data.declaration.language,
        e: data.declaration.place, f: data.declaration.date,
      },
    );

    this.engine.run(
      `INSERT INTO signatures (project_id, enabled, data_url, scale, align) VALUES ($a,$b,$c,$d,$e)`,
      { a: pid, b: bool(data.signature.enabled), c: data.signature.dataUrl, d: data.signature.scale, e: data.signature.align },
    );

    this.engine.run(
      `INSERT INTO career_objective (project_id, enabled, category_id, text) VALUES ($a,$b,$c,$d)`,
      { a: pid, b: bool(data.careerObjective.enabled), c: data.careerObjective.categoryId, d: data.careerObjective.text },
    );

    this.engine.run(
      `INSERT INTO career_interests (project_id, enabled, selected_json, custom) VALUES ($a,$b,$c,$d)`,
      { a: pid, b: bool(data.careerInterests.enabled), c: json(data.careerInterests.selected), d: data.careerInterests.custom },
    );

    data.customSections.forEach((c, i) => {
      this.engine.run(
        `INSERT INTO custom_sections (id, project_id, sort_order, title, items_json, enabled) VALUES ($a,$b,$c,$d,$e,$f)`,
        { a: c.id, b: pid, c: i, d: c.title, e: json(c.items), f: bool(c.enabled) },
      );
    });

    data.sections.forEach((s) => {
      this.engine.run(
        `INSERT INTO section_config (project_id, section_id, enabled, sort_order, heading_scale) VALUES ($a,$b,$c,$d,$e)`,
        { a: pid, b: s.id, c: bool(s.enabled), d: s.order, e: s.headingScale },
      );
    });
  }

  getProject(id: string): ProjectRecord | null {
    const head = this.engine.first<Record<string, any>>(`SELECT * FROM cv_projects WHERE id = $a`, { a: id });
    if (!head) return null;
    const pid = String(head.id);

    const personalRow =
      this.engine.first<Record<string, any>>(`SELECT * FROM personal_information WHERE project_id = $a`, { a: pid }) ?? {};
    const objective =
      this.engine.first<Record<string, any>>(`SELECT * FROM career_objective WHERE project_id = $a`, { a: pid }) ?? {};
    const interests =
      this.engine.first<Record<string, any>>(`SELECT * FROM career_interests WHERE project_id = $a`, { a: pid }) ?? {};
    const declaration =
      this.engine.first<Record<string, any>>(`SELECT * FROM declarations WHERE project_id = $a`, { a: pid }) ?? {};
    const signature =
      this.engine.first<Record<string, any>>(`SELECT * FROM signatures WHERE project_id = $a`, { a: pid }) ?? {};

    const data = {
      personal: {
        fullName: str(personalRow.full_name),
        firstName: str(personalRow.first_name),
        middleName: str(personalRow.middle_name),
        lastName: str(personalRow.last_name),
        fatherName: str(personalRow.father_name),
        motherName: str(personalRow.mother_name),
        dateOfBirth: str(personalRow.date_of_birth),
        gender: str(personalRow.gender),
        nationality: str(personalRow.nationality),
        religion: str(personalRow.religion),
        maritalStatus: str(personalRow.marital_status),
        bloodGroup: str(personalRow.blood_group),
        height: str(personalRow.height),
        weight: str(personalRow.weight),
        nationalId: str(personalRow.national_id),
        passportNo: str(personalRow.passport_no),
        presentAddress: str(personalRow.present_address),
        permanentAddress: str(personalRow.permanent_address),
        city: str(personalRow.city),
        district: str(personalRow.district),
        postalCode: str(personalRow.postal_code),
        country: str(personalRow.country),
        mobile: str(personalRow.mobile),
        altPhone: str(personalRow.alt_phone),
        email: str(personalRow.email),
        linkedin: str(personalRow.linkedin),
        portfolio: str(personalRow.portfolio),
        website: str(personalRow.website),
        headline: str(personalRow.headline),
        otherLinks: parse(personalRow.other_links_json, []),
      },
      photo: parse(personalRow.photo_json, { dataUrl: null, shape: 'circle', zoom: 1, offsetX: 0, offsetY: 0, rotation: 0, frameSize: 30 }),
      careerObjective: {
        enabled: Number(objective.enabled ?? 1) === 1,
        categoryId: str(objective.category_id) || 'general',
        text: str(objective.text),
      },
      careerInterests: {
        enabled: Number(interests.enabled ?? 0) === 1,
        selected: parse(interests.selected_json, []),
        custom: str(interests.custom),
      },
      education: this.engine
        .all<Record<string, any>>(`SELECT * FROM education WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          degree: str(r.degree),
          group: str(r.subject_group),
          institution: str(r.institution),
          board: str(r.board),
          passingYear: str(r.passing_year),
          result: str(r.result),
          gpa: str(r.gpa),
          scale: str(r.scale),
          division: str(r.division),
          location: str(r.location),
          additionalInfo: str(r.additional_info),
          currentlyStudying: Number(r.currently_studying) === 1,
        })),
      experience: this.engine
        .all<Record<string, any>>(`SELECT * FROM work_experience WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          industry: str(r.industry),
          company: str(r.company),
          jobTitle: str(r.job_title),
          employmentType: str(r.employment_type),
          location: str(r.location),
          startDate: str(r.start_date),
          endDate: str(r.end_date),
          currentlyWorking: Number(r.currently_working) === 1,
          responsibilities: parse(r.responsibilities_json, []),
          achievements: parse(r.achievements_json, []),
          projects: str(r.projects),
          tools: str(r.tools),
          additionalDetails: str(r.additional_details),
        })),
      hasExperience: Number(head.has_experience) === 1,
      skills: this.engine
        .all<Record<string, any>>(`SELECT * FROM skills WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({ id: String(r.id), name: str(r.name), category: str(r.category), level: str(r.level) as any })),
      languages: this.engine
        .all<Record<string, any>>(`SELECT * FROM languages WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          name: str(r.name),
          reading: str(r.reading) as any,
          writing: str(r.writing) as any,
          speaking: str(r.speaking) as any,
          listening: str(r.listening) as any,
          overall: str(r.overall) as any,
        })),
      training: this.engine
        .all<Record<string, any>>(`SELECT * FROM training WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          title: str(r.title),
          institution: str(r.institution),
          issuingOrganization: str(r.issuing_organization),
          completionDate: str(r.completion_date),
          duration: str(r.duration),
          certificateId: str(r.certificate_id),
          description: str(r.description),
          skillsLearned: str(r.skills_learned),
        })),
      trainingEnabled: false,
      projects: this.engine
        .all<Record<string, any>>(`SELECT * FROM projects WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          name: str(r.name),
          description: str(r.description),
          role: str(r.role),
          technologies: str(r.technologies),
          startDate: str(r.start_date),
          endDate: str(r.end_date),
          url: str(r.url),
          contributions: parse(r.contributions_json, []),
          outcome: str(r.outcome),
        })),
      projectsEnabled: false,
      achievements: this.engine
        .all<Record<string, any>>(`SELECT * FROM achievements WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          title: str(r.title),
          awardName: str(r.award_name),
          organization: str(r.organization),
          date: str(r.date),
          description: str(r.description),
        })),
      achievementsEnabled: false,
      strengths: this.engine
        .all<Record<string, any>>(`SELECT * FROM strengths WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({ id: String(r.id), text: str(r.text) })),
      strengthsEnabled: false,
      hobbies: this.engine
        .all<Record<string, any>>(`SELECT * FROM hobbies WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({ id: String(r.id), text: str(r.text) })),
      hobbiesEnabled: false,
      volunteer: this.engine
        .all<Record<string, any>>(`SELECT * FROM volunteer_experience WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          organization: str(r.organization),
          role: str(r.role),
          duration: str(r.duration),
          responsibilities: parse(r.responsibilities_json, []),
          achievements: str(r.achievements),
        })),
      volunteerEnabled: false,
      personalDetails:
        Object.keys(parse(personalRow.visibility_json, {})).length > 0
          ? parse(personalRow.visibility_json, {})
          : undefined,
      personalDetailsEnabled: false,
      references: this.engine
        .all<Record<string, any>>(`SELECT * FROM cv_references WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          name: str(r.name),
          designation: str(r.designation),
          organization: str(r.organization),
          relationship: str(r.relationship),
          phone: str(r.phone),
          email: str(r.email),
          address: str(r.address),
          referenceType: str(r.reference_type),
          additionalDetails: str(r.additional_details),
          signatureDataUrl: (parse<{ dataUrl?: string }>(r.signature_json, {}).dataUrl ?? null) as string | null,
          consentGiven: Number(r.consent_given) === 1,
        })),
      referencesEnabled: false,
      declaration: {
        enabled: Number(declaration.enabled ?? 0) === 1,
        text: str(declaration.text),
        language: (str(declaration.language) || 'en') as 'bn' | 'en',
        place: str(declaration.place),
        date: str(declaration.date),
      },
      signature: {
        enabled: Number(signature.enabled ?? 0) === 1,
        dataUrl: signature.data_url ? String(signature.data_url) : null,
        scale: Number(signature.scale ?? 1),
        align: (str(signature.align) || 'right') as 'left' | 'center' | 'right',
      },
      customSections: this.engine
        .all<Record<string, any>>(`SELECT * FROM custom_sections WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.id),
          title: str(r.title),
          items: parse(r.items_json, []),
          enabled: Number(r.enabled) === 1,
        })),
      sections: this.engine
        .all<Record<string, any>>(`SELECT * FROM section_config WHERE project_id = $a ORDER BY sort_order`, { a: pid })
        .map((r) => ({
          id: String(r.section_id) as SectionId,
          labelEn: str(r.section_id),
          labelBn: str(r.section_id),
          enabled: Number(r.enabled) === 1,
          order: Number(r.sort_order),
          headingScale: Number(r.heading_scale ?? 1),
        })),
      language: (str(head.cv_language) || 'en') as CVData['language'],
    } as unknown as CVData;

    const sections = data.sections as SectionConfig[];
    if (sections.length === 0) {
      // Imported/legacy project without section rows: fall back to defaults.
      data.sections = defaultSections();
    }
    // Flags that live in the sections table for normalised storage.
    const flagFor = (id: SectionId): boolean => data.sections.find((s) => s.id === id)?.enabled ?? false;
    data.trainingEnabled = flagFor('training');
    data.projectsEnabled = flagFor('projects');
    data.achievementsEnabled = flagFor('achievements');
    data.strengthsEnabled = flagFor('strengths');
    data.hobbiesEnabled = flagFor('hobbies');
    data.volunteerEnabled = flagFor('volunteer');
    data.referencesEnabled = flagFor('references');
    data.personalDetailsEnabled = flagFor('personalDetails');
    if (!data.personalDetails || Object.keys(data.personalDetails as object).length === 0) {
      data.personalDetails = emptyVisibilityFallback();
    }

    // v1.1 document-composition columns. Projects saved by v1.0 have no values
    // here, so they fall back to the current defaults instead of failing to open.
    data.title = hydrateTitle(parse<Partial<TitleState> | null>(head.title_json, null));
    data.pageLength = {
      ...defaultPageLength(),
      ...parse<Partial<PageLengthState>>(head.page_length_json, {}),
    };
    data.sectionStyles = parse<CVData['sectionStyles']>(head.section_styles_json, {});

    return {
      id: pid,
      customerId: head.customer_id ? String(head.customer_id) : null,
      title: String(head.title),
      templateId: String(head.template_id),
      status: head.status as ProjectRecord['status'],
      createdAt: String(head.created_at),
      updatedAt: String(head.updated_at),
      deletedAt: head.deleted_at ? String(head.deleted_at) : null,
      data,
      design: parse<DesignOverrides>(head.design_json, {} as DesignOverrides),
      version: Number(head.version ?? 1),
    } as ProjectRecord;
  }

  softDeleteProject(id: string): void {
    this.engine.run(`UPDATE cv_projects SET deleted_at = $a WHERE id = $b`, { a: nowIso(), b: id });
  }

  restoreProject(id: string): void {
    this.engine.run(`UPDATE cv_projects SET deleted_at = NULL WHERE id = $a`, { a: id });
  }

  hardDeleteProject(id: string): void {
    this.engine.transaction(() => {
      // Section-level cascade handles child rows via foreign keys,
      // but sql.js needs them removed explicitly for older files.
      for (const table of [
        'personal_information', 'education', 'work_experience', 'skills', 'languages', 'training', 'projects',
        'achievements', 'strengths', 'hobbies', 'volunteer_experience', 'cv_references', 'declarations',
        'signatures', 'career_objective', 'career_interests', 'custom_sections', 'section_config',
        'export_history', 'project_versions',
      ]) {
        this.engine.run(`DELETE FROM ${table} WHERE project_id = $a`, { a: id });
      }
      this.engine.run(`DELETE FROM cv_projects WHERE id = $a`, { a: id });
    });
  }

  duplicateProject(id: string, title?: string): ProjectRecord | null {
    const original = this.getProject(id);
    if (!original) return null;
    const copy: ProjectRecord = {
      ...original,
      id: cryptoId(),
      title: title ?? `${original.title} (Copy)`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      version: 1,
      deletedAt: null,
    };
    return this.saveProject(copy);
  }

  projectVersions(id: string): { version: number; createdAt: string }[] {
    return this.engine.all<{ version: number; created_at: string }>(
      `SELECT version, created_at FROM project_versions WHERE project_id = $a ORDER BY version DESC`,
      { a: id },
    ).map((r) => ({ version: Number(r.version), createdAt: String(r.created_at) }));
  }

  restoreVersion(projectId: string, version: number): ProjectRecord | null {
    const row = this.engine.first<{ snapshot_json: string }>(
      `SELECT snapshot_json FROM project_versions WHERE project_id = $a AND version = $b`,
      { a: projectId, b: version },
    );
    if (!row) return null;
    const snap = JSON.parse(row.snapshot_json) as { data: CVData; design: DesignOverrides; templateId: string; title: string };
    const current = this.getProject(projectId);
    if (!current) return null;
    const next: ProjectRecord = {
      ...current,
      data: snap.data,
      design: snap.design,
      templateId: snap.templateId,
      title: snap.title,
      updatedAt: nowIso(),
      version: (current.version ?? 1) + 1,
    };
    return this.saveProject(next);
  }

  // ------------------------------------------------------------------ exports
  logExport(record: ExportRecord): void {
    this.engine.run(
      `INSERT INTO export_history (id, project_id, project_title, format, file_name, created_at, status, message)
       VALUES ($a,$b,$c,$d,$e,$f,$g,$h)`,
      {
        a: record.id, b: record.projectId, c: record.projectTitle, d: record.format, e: record.fileName,
        f: record.createdAt, g: record.status, h: record.message,
      },
    );
  }

  listExports(): ExportRecord[] {
    return this.engine.all<Record<string, any>>(`SELECT * FROM export_history ORDER BY created_at DESC LIMIT 300`).map((r) => ({
      id: String(r.id),
      projectId: String(r.project_id),
      projectTitle: str(r.project_title),
      format: r.format as ExportRecord['format'],
      fileName: str(r.file_name),
      createdAt: str(r.created_at),
      status: r.status as ExportRecord['status'],
      message: str(r.message),
    }));
  }

  clearExports(): void {
    this.engine.run(`DELETE FROM export_history`);
  }

  // ----------------------------------------------------------------- settings
  getSetting<T>(key: string, fallback: T): T {
    const row = this.engine.first<{ value: string }>(`SELECT value FROM application_settings WHERE key = $a`, { a: key });
    if (!row) return fallback;
    return parse<T>(row.value, fallback);
  }

  setSetting<T>(key: string, value: T): void {
    this.engine.run(
      `INSERT INTO application_settings (key, value) VALUES ($a,$b)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      { a: key, b: json(value) },
    );
  }

  allSettings(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const row of this.engine.all<{ key: string; value: string }>(`SELECT key, value FROM application_settings`)) {
      out[row.key] = parse(row.value, null);
    }
    return out;
  }

  // ---------------------------------------------------------------- templates
  saveTemplateVariant(id: string, baseTemplateId: string, name: string, design: DesignOverrides): void {
    this.engine.run(
      `INSERT INTO template_settings (id, base_template_id, name, design_json, created_at) VALUES ($a,$b,$c,$d,$e)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, design_json = excluded.design_json`,
      { a: id, b: baseTemplateId, c: name, d: json(design), e: nowIso() },
    );
  }

  listTemplateVariants(): { id: string; baseTemplateId: string; name: string; design: DesignOverrides; createdAt: string }[] {
    return this.engine.all<Record<string, any>>(`SELECT * FROM template_settings ORDER BY created_at DESC`).map((r) => ({
      id: String(r.id),
      baseTemplateId: String(r.base_template_id),
      name: String(r.name),
      design: parse<DesignOverrides>(r.design_json, {} as DesignOverrides),
      createdAt: String(r.created_at),
    }));
  }

  deleteTemplateVariant(id: string): void {
    this.engine.run(`DELETE FROM template_settings WHERE id = $a`, { a: id });
  }

  // ------------------------------------------------------------------ backups
  logBackup(record: BackupRecord): void {
    this.engine.run(
      `INSERT INTO backup_history (id, file_name, path, created_at, size_bytes, verified, kind)
       VALUES ($a,$b,$c,$d,$e,$f,$g)`,
      {
        a: record.id, b: record.fileName, c: record.path, d: record.createdAt,
        e: record.sizeBytes, f: bool(record.verified), g: record.kind,
      },
    );
  }

  listBackups(): BackupRecord[] {
    return this.engine.all<Record<string, any>>(`SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 100`).map((r) => ({
      id: String(r.id),
      fileName: String(r.file_name),
      path: str(r.path),
      createdAt: String(r.created_at),
      sizeBytes: Number(r.size_bytes),
      verified: Number(r.verified) === 1,
      kind: r.kind as BackupRecord['kind'],
    }));
  }

  logError(scope: string, message: string, detail = ''): void {
    this.engine.run(
      `INSERT INTO error_log (created_at, scope, message, detail) VALUES ($a,$b,$c,$d)`,
      { a: nowIso(), b: scope, c: message.slice(0, 500), d: detail.slice(0, 4000) },
    );
    // Keep the log bounded.
    this.engine.run(`DELETE FROM error_log WHERE id <= (SELECT MAX(id) - 500 FROM error_log)`);
  }

  recentErrors(limit = 50): { createdAt: string; scope: string; message: string }[] {
    return this.engine.all<Record<string, any>>(`SELECT * FROM error_log ORDER BY id DESC LIMIT ${Number(limit)}`).map((r) => ({
      createdAt: String(r.created_at),
      scope: String(r.scope),
      message: String(r.message),
    }));
  }

  counts(): { customers: number; projects: number; todayProjects: number; duplicates: number } {
    const today = new Date().toISOString().slice(0, 10);
    return {
      customers: Number(this.engine.scalar<number>(`SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL`) ?? 0),
      projects: Number(this.engine.scalar<number>(`SELECT COUNT(*) FROM cv_projects WHERE deleted_at IS NULL`) ?? 0),
      todayProjects: Number(
        this.engine.scalar<number>(`SELECT COUNT(*) FROM cv_projects WHERE deleted_at IS NULL AND created_at LIKE $a`, {
          a: `${today}%`,
        }) ?? 0,
      ),
      duplicates: Number(this.engine.scalar<number>(`SELECT COUNT(*) FROM cv_projects WHERE deleted_at IS NOT NULL`) ?? 0),
    };
  }
}

function mapCustomer(r: Record<string, any>): CustomerRecord {
  return {
    id: String(r.id),
    name: str(r.name),
    phone: str(r.phone),
    email: str(r.email),
    address: str(r.address),
    notes: str(r.notes),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    deletedAt: r.deleted_at ? String(r.deleted_at) : null,
  };
}

function cryptoId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyVisibilityFallback() {
  return {
    fatherName: false, motherName: false, dateOfBirth: false, nationality: false, religion: false,
    maritalStatus: false, bloodGroup: false, height: false, weight: false, gender: false, nationalId: false,
    passportNo: false, presentAddress: true, permanentAddress: false, email: true, mobile: true, altPhone: false,
    linkedin: false, website: false, address: false,
  };
}
