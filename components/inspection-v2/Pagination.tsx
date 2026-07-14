import Link from "next/link";
import styles from "./Inspection.module.css";

export default function Pagination({ currentPage, totalPages, makeHref }:{
  currentPage:number; totalPages:number; makeHref:(page:number)=>string;
}) {
  if (totalPages <= 1) return null;
  return <div className={styles.pagination}>
    {Array.from({length:totalPages}).map((_,i)=>{
      const page=i+1; const active=page===currentPage;
      return <Link key={page} href={makeHref(page)} className={`${styles.pageLink} ${active ? styles.pageLinkActive : ""}`}>{page}</Link>
    })}
  </div>;
}
