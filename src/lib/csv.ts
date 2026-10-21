/**
 * CSV encoding with spreadsheet formula-injection protection: cells that
 * begin with = + - @ (or tab/CR) are prefixed with an apostrophe.
 */
export function csvCell(value: string): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[",\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function toCsv(header: string[], rows: string[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
