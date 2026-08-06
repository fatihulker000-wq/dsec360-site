export type FormTemplateRecord = {
  id: string;

  template_code: string;

  title: string;

  short_title: string | null;

  description?: string | null;

  legal_basis?: string | null;

  version_no: number;

  revision_no: number;

  status: string;
};

export type TemplateComponentProps = {
  record: FormTemplateRecord;

  mode?: string;
};