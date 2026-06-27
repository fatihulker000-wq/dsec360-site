// PrintStyles.ts

import { CSSProperties } from "react";

export const printPageStyle: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  background: "#fff",
  color: "#000",
  padding: "12mm",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
};

export const printHeaderStyle: CSSProperties = {
  border: "2px solid #000",
  padding: "8px",
  textAlign: "center",
  fontWeight: 900,
  fontSize: 18,
  marginBottom: 12,
};

export const printSectionTitleStyle: CSSProperties = {
  background: "#efefef",
  border: "1px solid #000",
  padding: "6px 8px",
  fontWeight: 900,
  fontSize: 14,
  marginTop: 12,
};

export const printTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 4,
};

export const printThStyle: CSSProperties = {
  border: "1px solid #000",
  background: "#f5f5f5",
  padding: "6px",
  fontWeight: 900,
  textAlign: "left",
};

export const printTdStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "6px",
  verticalAlign: "top",
};

export const printLabelStyle: CSSProperties = {
  fontWeight: 900,
  width: 220,
};

export const printValueStyle: CSSProperties = {
  minHeight: 24,
};

export const printTextAreaStyle: CSSProperties = {
  minHeight: 60,
  whiteSpace: "pre-wrap",
};

export const signatureContainerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 30,
  marginTop: 40,
};

export const signatureBoxStyle: CSSProperties = {
  border: "1px solid #000",
  height: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

export const footerStyle: CSSProperties = {
  marginTop: 20,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 11,
};

export const pageBreakStyle: CSSProperties = {
  pageBreakAfter: "always",
};

export const noBreakStyle: CSSProperties = {
  pageBreakInside: "avoid",
};

export const printButtonHiddenStyle: CSSProperties = {
  display: "none",
};

export function printDocument() {
  window.print();
}

export const printMediaCss = `
@page{
    size:A4 portrait;
    margin:10mm;
}

@media print{

html,body{
    margin:0;
    padding:0;
    background:white;
    color:black;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
}

.no-print{
    display:none !important;
}

.page-break{
    page-break-after:always;
}

.no-break{
    page-break-inside:avoid;
}

table{
    page-break-inside:auto;
}

tr{
    page-break-inside:avoid;
}

thead{
    display:table-header-group;
}

tfoot{
    display:table-footer-group;
}

}
`;