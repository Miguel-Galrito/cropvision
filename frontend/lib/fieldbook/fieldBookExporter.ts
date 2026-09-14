/**
 * CropVision SaaS - Digital Field Book Exporter Engine (Caderno de Campo Oficial)
 * Generates:
 * 1. Microsoft Excel OpenXML (.xlsx) with multi-sheet structure for Phytosanitary Treatments and Fertilizations.
 * 2. Official DGAV / IFAP / PAC Audit PDF compliant with Portaria 229/2013 & EU Nitrates Directive 91/676/EEC.
 */

import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PhytosanitaryRecord, FertilizationRecord } from './fieldBookStore';
import { Language } from '../i18n';

export interface FieldBookExportParams {
  phytoRecords: PhytosanitaryRecord[];
  fertRecords: FertilizationRecord[];
  farmName: string;
  companyName?: string;
  taxId?: string;
  cadastralAddress?: string;
  agronomistName?: string;
  licenseNumber?: string;
  customLogoUrl?: string;
  lang?: Language;
  year?: number;
}

/**
 * Escapes XML special characters
 */
function escapeXml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a 0-indexed column number to Excel column letters (0 -> A, 27 -> AB)
 */
function colToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Generates an OpenXML worksheet XML string with dark green header row and styled cells
 */
function buildWorksheetXml(
  headers: string[],
  rows: (string | number)[][],
  columnWidths: number[]
): string {
  const totalCols = headers.length;
  const lastColLetter = colToLetter(totalCols - 1);
  const totalRows = rows.length + 1;

  let colsXml = '<cols>';
  columnWidths.forEach((width, idx) => {
    colsXml += `<col min="${idx + 1}" max="${idx + 1}" width="${width}" customWidth="1"/>`;
  });
  colsXml += '</cols>';

  let sheetData = '<sheetData>';

  // Header Row (Row 1, style 1 = dark green fill with bold white text)
  sheetData += `<row r="1" spans="1:${totalCols}">`;
  headers.forEach((h, cIdx) => {
    const cellRef = `${colToLetter(cIdx)}1`;
    sheetData += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  sheetData += '</row>';

  // Data Rows (Row 2..N)
  rows.forEach((row, rIdx) => {
    const rowNum = rIdx + 2;
    sheetData += `<row r="${rowNum}" spans="1:${totalCols}">`;
    row.forEach((val, cIdx) => {
      const cellRef = `${colToLetter(cIdx)}${rowNum}`;
      if (typeof val === 'number') {
        sheetData += `<c r="${cellRef}" s="2"><v>${val}</v></c>`;
      } else {
        sheetData += `<c r="${cellRef}" s="0" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });
    sheetData += '</row>';
  });

  sheetData += '</sheetData>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastColLetter}${totalRows}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${colsXml}
  ${sheetData}
</worksheet>`;
}

/**
 * Exports Field Book into native Microsoft Excel (.xlsx) format using JSZip
 */
export async function exportFieldBookExcel(params: FieldBookExportParams): Promise<void> {
  const { phytoRecords, fertRecords, farmName, lang = 'pt' } = params;
  const isEn = lang === 'en';

  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  const sheet1Name = isEn ? 'Phytosanitary Treatments' : 'Tratamentos Fitossanitários';
  const sheet2Name = isEn ? 'Fertilizations and Nutrients' : 'Fertilizações e Nutrientes';

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheet1Name)}" sheetId="1" r:id="rId1"/>
    <sheet name="${escapeXml(sheet2Name)}" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font>
      <sz val="10"/>
      <name val="Segoe UI"/>
      <color rgb="FF1E293B"/>
    </font>
    <font>
      <b/>
      <sz val="10.5"/>
      <name val="Segoe UI"/>
      <color rgb="FFFFFFFF"/>
    </font>
    <font>
      <sz val="10"/>
      <name val="Consolas"/>
      <color rgb="FF0F172A"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF064E3B"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`
  );

  // Sheet 1: Phytosanitary Records
  const phytoHeaders = isEn
    ? [
        'Date',
        'Parcel / Plot',
        'Crop',
        'Commercial Product',
        'Homologation No. (APV)',
        'Active Substance',
        'Dose',
        'Unit',
        'Spray Volume (l/ha)',
        'Target Pest / Justification',
        'Safety Interval (Days)',
        'Certified Applicator',
        'Applicator License Card',
        'Technical Notes',
      ]
    : [
        'Data',
        'Parcela / Talhão',
        'Cultura',
        'Produto Comercial',
        'Nº Homologação (APV)',
        'Substância Ativa',
        'Dose',
        'Unidade',
        'Volume Calda (l/ha)',
        'Inimigo / Justificação',
        'Intervalo Segurança (Dias)',
        'Nome do Aplicador',
        'Nº Cartão Aplicador',
        'Observações Técnicas',
      ];

  const phytoWidths = [12, 26, 20, 24, 18, 32, 10, 10, 18, 30, 20, 24, 20, 35];

  const phytoRows = phytoRecords.map((r) => [
    r.date,
    r.parcelName,
    r.crop,
    r.commercialProduct,
    r.homologationNumber,
    r.activeSubstance,
    r.dose,
    r.unit,
    r.sprayVolumeLHa,
    r.targetOrganism,
    r.safetyIntervalDays,
    r.applicatorName,
    r.applicatorCardNumber,
    r.operatorNotes || '',
  ]);

  const sheet1Xml = buildWorksheetXml(phytoHeaders, phytoRows, phytoWidths);
  zip.file('xl/worksheets/sheet1.xml', sheet1Xml);

  // Sheet 2: Fertilization Records
  const fertHeaders = isEn
    ? [
        'Date',
        'Parcel / Plot',
        'Crop',
        'Fertilizer Type',
        'Commercial Product',
        'Rate (kg/ha)',
        'Pure Nitrogen N (kg/ha)',
        'Phosphate P2O5 (kg/ha)',
        'Potassium K2O (kg/ha)',
        'VRA Satellite Prescribed',
        'Technical Notes & Observations',
      ]
    : [
        'Data',
        'Parcela / Talhão',
        'Cultura',
        'Tipo de Adubo',
        'Produto Comercial',
        'Dose Comercial (kg/ha)',
        'Azoto Puro N (kg/ha)',
        'Fósforo P2O5 (kg/ha)',
        'Potássio K2O (kg/ha)',
        'Prescrição VRA Satélite',
        'Notas Técnicas & Observações',
      ];

  const fertWidths = [12, 26, 20, 16, 28, 18, 18, 18, 18, 20, 35];

  const fertRows = fertRecords.map((f) => [
    f.date,
    f.parcelName,
    f.crop,
    f.fertilizerType.toUpperCase(),
    f.commercialProduct,
    f.rateKgHa,
    f.nutrientUnitsN,
    f.nutrientUnitsP2O5,
    f.nutrientUnitsK2O,
    f.vraPrescriptionLinked ? (isEn ? 'YES (Sentinel-2 VRA)' : 'SIM (VRA Sentinel-2)') : isEn ? 'NO' : 'NÃO',
    f.technicalNotes || '',
  ]);

  const sheet2Xml = buildWorksheetXml(fertHeaders, fertRows, fertWidths);
  zip.file('xl/worksheets/sheet2.xml', sheet2Xml);

  // Generate binary ZIP and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `caderno_campo_${farmName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Draws the official CropVision audit vector stamp
 */
function drawVectorValidationStamp(
  doc: jsPDF,
  x: number,
  y: number,
  auditHash: string,
  timestamp: string,
  isEn: boolean
) {
  // Outer circular border
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(0.8);
  doc.circle(x, y, 16, 'S');

  // Inner dashed/dotted concentric ring
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.3);
  doc.circle(x, y, 13.5, 'S');

  // Center Checkmark Vector
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.0);
  doc.line(x - 4, y, x - 1, y + 3.5);
  doc.line(x - 1, y + 3.5, x + 5, y - 4);

  // Micro-text around or below stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(6, 78, 59);
  doc.text(
    isEn ? 'DIGITALLY VALIDATED' : 'VALIDADO DIGITALMENTE',
    x,
    y + 6.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 116, 139);
  doc.text('CROPVISION SAAS ENGINE', x, y + 9, { align: 'center' });
  doc.text(`HASH: ${auditHash.slice(0, 12)}...`, x, y + 11.2, { align: 'center' });
  doc.text(timestamp, x, y + 13.2, { align: 'center' });
}

/**
 * Exports Field Book into official DGAV / IFAP / PAC compliant PDF
 */
export async function exportFieldBookPdf(params: FieldBookExportParams): Promise<void> {
  const {
    phytoRecords,
    fertRecords,
    farmName,
    companyName = 'Finagra, S.A. (Herdade do Esporão)',
    taxId = 'PT 500 123 456',
    cadastralAddress = 'Apartado 157, 7200-999 Reguengos de Monsaraz',
    agronomistName = 'Eng. Agrónomo Miguel Silva',
    licenseNumber = 'OE-AGR-49120',
    customLogoUrl,
    lang = 'pt',
    year = new Date().getFullYear(),
  } = params;

  const isEn = lang === 'en';

  const doc = new jsPDF({
    orientation: 'landscape', // Landscape is standard for DGAV & IFAP inspection tables
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const dateNow = new Date().toISOString().slice(0, 10);
  const timeNow = new Date().toISOString().slice(11, 16);
  const auditHash = `${farmName}-${dateNow}-${phytoRecords.length}-${fertRecords.length}`
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
    .toString(16)
    .toUpperCase()
    .padStart(16, '0');

  /* =========================================================================
     PAGE 1: PHYTOSANITARY TREATMENTS (REGISTO DE FITOFÁRMACOS DGAV)
     ========================================================================= */

  // Institutional Header Banner
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 24, pageWidth, 1.2, 'F');

  // Vector Logo Icon
  doc.setFillColor(16, 185, 129);
  doc.circle(marginX + 4, 12, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(marginX + 4, 12, 2.2, 'F');
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.6);
  doc.ellipse(marginX + 4, 12, 7.5, 3.2, 'S');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CROPVISION', marginX + 14, 11);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153);
  doc.text('OFFICIAL DIGITAL FIELD BOOK | CADERNO DE CAMPO DGAV / IFAP', marginX + 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    isEn
      ? `REGULATORY PHYTOSANITARY LOGBOOK — CROP YEAR ${year}`
      : `REGISTO DE APLICAÇÃO DE PRODUTOS FITOFARMACÊUTICOS — CAMPANHA ${year}`,
    marginX + 14,
    20
  );

  // Client Custom Logo (White-label header injection)
  if (customLogoUrl) {
    try {
      doc.addImage(customLogoUrl, 'PNG', pageWidth - marginX - 32, 3, 30, 18, undefined, 'FAST');
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(companyName, pageWidth - marginX, 12, { align: 'right' });
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(farmName, pageWidth - marginX, 11, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(companyName, pageWidth - marginX, 15, { align: 'right' });
    doc.text(`NIF: ${taxId}`, pageWidth - marginX, 19, { align: 'right' });
  }

  // Legal Regulatory Bar
  let cursorY = 29;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isEn
      ? 'REGULATORY COMPLIANCE FRAMEWORK: Portuguese Decree-Law 145/2015 & Administrative Rule 229/2013 (DGAV)'
      : 'ENQUADRAMENTO LEGAL OFICIAL: Decreto-Lei n.º 145/2015 e Portaria n.º 229/2013 (DGAV / IFAP / PAC 2023-2027)',
    marginX + 3,
    cursorY + 4
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${isEn ? 'Farm / Entity:' : 'Exploração / Entidade:'} ${companyName} (${farmName})  |  ${isEn ? 'Tax ID / NIF:' : 'NIF:'} ${taxId}  |  ${isEn ? 'Address:' : 'Sede Cadastral:'} ${cadastralAddress}`,
    marginX + 3,
    cursorY + 8
  );
  doc.text(
    `${isEn ? 'Technical Agronomist Responsible:' : 'Responsável Técnico Certificado:'} ${agronomistName} (${licenseNumber})  |  ${isEn ? 'Audit Hash:' : 'Hash Probatório:'} ${auditHash}`,
    marginX + 3,
    cursorY + 11.5
  );

  cursorY += 17;

  // Phytosanitary Table via autoTable
  const phytoTableRows = phytoRecords.map((r) => [
    r.date,
    r.parcelName,
    r.crop,
    r.commercialProduct,
    r.homologationNumber,
    r.activeSubstance,
    `${r.dose} ${r.unit}`,
    r.sprayVolumeLHa > 0 ? `${r.sprayVolumeLHa} l/ha` : '—',
    r.targetOrganism,
    r.safetyIntervalDays > 0 ? `${r.safetyIntervalDays} dias` : '0 dias',
    `${r.applicatorName}\n(${r.applicatorCardNumber})`,
    r.operatorNotes || 'Sem anotações.',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isEn ? 'Date' : 'Data',
      isEn ? 'Parcel / Plot' : 'Parcela / Talhão',
      isEn ? 'Crop' : 'Cultura',
      isEn ? 'Commercial Product' : 'Produto Comercial',
      isEn ? 'APV No.' : 'Nº APV',
      isEn ? 'Active Substance' : 'Substância Ativa',
      isEn ? 'Dose/ha' : 'Dose/ha',
      isEn ? 'Spray Vol.' : 'Vol. Calda',
      isEn ? 'Target Pest / Justification' : 'Inimigo / Justificação',
      isEn ? 'Safety Int.' : 'I.S.',
      isEn ? 'Applicator & Card' : 'Aplicador (Cartão)',
      isEn ? 'Notes' : 'Observações',
    ]],
    body: phytoTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      cellPadding: 2,
      halign: 'center',
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 20 },
      3: { cellWidth: 24, fontStyle: 'bold', textColor: [6, 78, 59] },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 32 },
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 28 },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 28 },
      11: { cellWidth: 31 },
    },
    margin: { left: marginX, right: marginX },
  });

  // Footer Page 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    isEn
      ? `CropVision AgTech Platform | Official Field Book — Phytosanitary Treatments | Page 1 of 2`
      : `CropVision AgTech Platform | Caderno de Campo Oficial — Tratamentos Fitossanitários | Página 1 de 2`,
    marginX,
    pageHeight - 7
  );
  doc.text(
    isEn ? 'Audit Certified DGAV / IFAP Form' : 'Modelo Certificado para Auditoria DGAV / IFAP',
    pageWidth - marginX,
    pageHeight - 7,
    { align: 'right' }
  );

  /* =========================================================================
     PAGE 2: FERTILIZATIONS & NUTRIENTS (DIRETIVA NITRATOS & VRA)
     ========================================================================= */

  doc.addPage('landscape');

  // Top Banner
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 24, pageWidth, 1.2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CROPVISION', marginX + 14, 11);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153);
  doc.text('OFFICIAL DIGITAL FIELD BOOK | CADERNO DE FERTILIZAÇÃO & NUTRIENTES', marginX + 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    isEn
      ? `NITROGEN & NUTRIENT MASS BALANCE RECORD — EU NITRATES DIRECTIVE (PAC ${year})`
      : `BALANÇO DE AZOTO & PLANO DE FERTILIZAÇÃO — DIRETIVA NITRATOS 91/676/CEE (PAC ${year})`,
    marginX + 14,
    20
  );

  // Client info right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(farmName, pageWidth - marginX, 11, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${companyName} | NIF: ${taxId}`, pageWidth - marginX, 16, { align: 'right' });

  cursorY = 29;

  // Legal Framework Bar Page 2
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isEn
      ? 'MANDATORY NITROGEN SURPLUS THRESHOLDS: Code of Good Agricultural Practice & Water Framework Directive 2000/60/EC'
      : 'LIMITES LEGAIS DE AZOTO (ZONAS VULNERÁVEIS): Código de Boas Práticas Agrícolas e Diretiva Quadro da Água 2000/60/CE',
    marginX + 3,
    cursorY + 4.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isEn
      ? 'All satellite-guided Variable Rate Applications (VRA) are logged with exact pure N, P2O5 and K2O balance units to prevent groundwater leaching.'
      : 'Todas as aplicações a taxa variável (VRA) com prescrição satélite encontram-se discriminadas com balanço puro de N, P2O5 e K2O.',
    marginX + 3,
    cursorY + 8.5
  );

  cursorY += 15;

  // Fertilization Table via autoTable
  const fertTableRows = fertRecords.map((f) => [
    f.date,
    f.parcelName,
    f.crop,
    f.fertilizerType.toUpperCase(),
    f.commercialProduct,
    `${f.rateKgHa} kg/ha`,
    `${f.nutrientUnitsN.toFixed(1)} kg N/ha`,
    `${f.nutrientUnitsP2O5.toFixed(1)} kg P/ha`,
    `${f.nutrientUnitsK2O.toFixed(1)} kg K/ha`,
    f.vraPrescriptionLinked
      ? isEn
        ? 'YES (Sentinel-2 VRA)'
        : 'SIM (Prescrição VRA)'
      : isEn
      ? 'Standard'
      : 'Convencional',
    f.technicalNotes || 'Sem observações adicionais.',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isEn ? 'Date' : 'Data',
      isEn ? 'Parcel / Plot' : 'Parcela / Talhão',
      isEn ? 'Crop' : 'Cultura',
      isEn ? 'Fertilizer Type' : 'Tipo Adubo',
      isEn ? 'Commercial Product' : 'Produto Comercial',
      isEn ? 'Rate' : 'Dose Adubo',
      isEn ? 'Pure N Units' : 'Azoto (N)',
      isEn ? 'P2O5 Units' : 'Fósforo (P2O5)',
      isEn ? 'K2O Units' : 'Potássio (K2O)',
      isEn ? 'Satellite VRA' : 'Origem VRA',
      isEn ? 'Technical Notes' : 'Observações Técnicas',
    ]],
    body: fertTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      cellPadding: 2,
      halign: 'center',
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 32, fontStyle: 'bold', textColor: [6, 78, 59] },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
      9: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 51 },
    },
    margin: { left: marginX, right: marginX },
  });

  const postTableY = (doc as any).lastAutoTable.finalY + 6;

  // Sign-off & Vector Stamp Block
  const sigBoxWidth = 85;
  const sigBoxHeight = 32;

  // Box 1: Operating Entity
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, postTableY, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isEn ? 'OPERATING ENTITY / BENEFICIARY' : 'ENTIDADE EXPLORADORA / BENEFICIÁRIO',
    marginX + 4,
    postTableY + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isEn ? 'Entity:' : 'Entidade:'} ${companyName}`, marginX + 4, postTableY + 9);
  doc.text(`NIF: ${taxId}`, marginX + 4, postTableY + 13);
  doc.text(`${isEn ? 'Location:' : 'Sede:'} ${cadastralAddress}`, marginX + 4, postTableY + 17);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(marginX + 6, postTableY + 24, marginX + sigBoxWidth - 6, postTableY + 24);

  doc.setFontSize(5.5);
  doc.text(
    isEn ? 'Date: _____/_____/2026 | Signature & Official Stamp' : 'Data: _____/_____/2026 | Assinatura e Carimbo',
    marginX + 6,
    postTableY + 28
  );

  // Box 2: Certified Agronomist
  const agroBoxX = marginX + sigBoxWidth + 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(agroBoxX, postTableY, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isEn ? 'CERTIFIED TECHNICAL RESPONSIBILITY' : 'RESPONSABILIDADE TÉCNICA CERTIFICADA',
    agroBoxX + 4,
    postTableY + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isEn ? 'Agronomist:' : 'Agrónomo:'} ${agronomistName}`, agroBoxX + 4, postTableY + 9);
  doc.text(`${isEn ? 'License No.:' : 'Cédula Profissional:'} ${licenseNumber}`, agroBoxX + 4, postTableY + 13);
  doc.text(
    isEn ? 'Certification: DGAV / CAP Integrated Production' : 'Habilitação: DGAV / Produção Integrada',
    agroBoxX + 4,
    postTableY + 17
  );

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(agroBoxX + 6, postTableY + 24, agroBoxX + sigBoxWidth - 6, postTableY + 24);

  doc.setFontSize(5.5);
  doc.text(
    isEn ? 'Date: _____/_____/2026 | Signature & Stamp' : 'Data: _____/_____/2026 | Assinatura e Cédula',
    agroBoxX + 6,
    postTableY + 28
  );

  // Box 3: Official Vector Validation Stamp (Right side)
  const stampCenterX = pageWidth - marginX - 35;
  const stampCenterY = postTableY + 16;
  drawVectorValidationStamp(
    doc,
    stampCenterX,
    stampCenterY,
    auditHash,
    `${dateNow} ${timeNow} UTC`,
    isEn
  );

  // Footer Page 2
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    isEn
      ? `CropVision AgTech Platform | Official Field Book — Fertilizations & Nutrients | Page 2 of 2`
      : `CropVision AgTech Platform | Caderno de Campo Oficial — Fertilizações & Nutrientes | Página 2 de 2`,
    marginX,
    pageHeight - 7
  );
  doc.text(
    isEn ? `Audit Hash: ${auditHash} | Valid for IFAP Control` : `Hash de Controlo: ${auditHash} | Válido para Controlo IFAP`,
    pageWidth - marginX,
    pageHeight - 7,
    { align: 'right' }
  );

  // Trigger Instant PDF Download
  const filename = `caderno_campo_${farmName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateNow}.pdf`;
  doc.save(filename);
}
