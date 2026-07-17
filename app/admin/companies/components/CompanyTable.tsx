"use client";

import { Company } from "../types";
import CompanyCard from "./CompanyCard";

interface Props {
  companies: Company[];

  onDetail: (company: Company) => void;

  onEdit: (company: Company) => void;

  onDelete: (company: Company) => void;
}

export default function CompanyTable({
  companies,
  onDetail,
  onEdit,
  onDelete,
}: Props) {

  if (companies.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          background: "#fff",
          borderRadius: 16,
        }}
      >
        Firma bulunamadı.
      </div>
    );
  }

  return (
    <>
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onDetail={() => onDetail(company)}
          onEdit={() => onEdit(company)}
          onDelete={() => onDelete(company)}
        />
      ))}
    </>
  );
}