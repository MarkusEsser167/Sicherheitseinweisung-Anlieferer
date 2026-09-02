"""
Erzeugt js/locations.js aus data/niederlassungen.xlsx.

Bei neuen oder geaenderten Niederlassungen: die Excel-Datei in data/ ersetzen und
    pip install openpyxl && python scripts/make_locations.py
ausfuehren. Erwartete Spalten: NDL | Niederlassung | E-Mail.
"""
import json
import os
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "data", "niederlassungen.xlsx")
OUT = os.path.join(ROOT, "js", "locations.js")

wb = openpyxl.load_workbook(XLSX, data_only=True)
rows = []
for row in wb.worksheets[0].iter_rows(min_row=2, values_only=True):
    ndl, name, mail = (row + (None, None, None))[:3]
    if not ndl or not name or not mail:
        continue
    rows.append({"id": str(ndl).strip(), "name": str(name).strip(), "email": str(mail).strip()})

rows.sort(key=lambda r: r["name"].lower())
body = ",\n".join(
    '  { id: %s, name: %s, email: %s }' % (json.dumps(r["id"]), json.dumps(r["name"], ensure_ascii=False), json.dumps(r["email"]))
    for r in rows
)
header = '''/**
 * Niederlassungen und ihre Empfaenger-Mailadressen.
 *
 * AUTOMATISCH ERZEUGT aus data/niederlassungen.xlsx durch scripts/make_locations.py -
 * nicht von Hand bearbeiten, sondern die Excel-Datei pflegen und das Skript erneut laufen lassen.
 */

export const LOCATIONS = [
'''
open(OUT, "w", encoding="utf-8").write(header + body + "\n];\n\nexport function findLocation(id) {\n  return LOCATIONS.find((l) => l.id === id) || null;\n}\n")
print(f"{len(rows)} Niederlassungen -> js/locations.js")
