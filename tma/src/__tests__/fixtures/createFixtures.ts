import PizZip from "pizzip"

// Minimal OOXML with one <w:tbl>, one <w:tr>, 8 yellow-highlighted label paragraphs
// each with unique w14:paraId — used for cloneLocadorRow unit tests (CONTR-11)
const AC_PF_TABLE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:body>
    <w:tbl>
      <w:tr w:rsidR="007E5BE5" w14:paraId="42028EB9" w14:textId="77777777">
        <w:tc>
          <w:p w14:paraId="00000001" w14:textId="00000001"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Nombre y Apellido:</w:t></w:r></w:p>
          <w:p w14:paraId="00000002" w14:textId="00000002"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Domicilio:</w:t></w:r></w:p>
          <w:p w14:paraId="00000003" w14:textId="00000003"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Ciudad:</w:t></w:r></w:p>
          <w:p w14:paraId="00000004" w14:textId="00000004"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>País:</w:t></w:r></w:p>
          <w:p w14:paraId="00000005" w14:textId="00000005"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Código Postal:</w:t></w:r></w:p>
          <w:p w14:paraId="00000006" w14:textId="00000006"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Número de teléfono:</w:t></w:r></w:p>
          <w:p w14:paraId="00000007" w14:textId="00000007"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Dirección de correo electrónico:</w:t></w:r></w:p>
          <w:p w14:paraId="00000008" w14:textId="00000008"><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>DNI/CUIT:</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:sectPr/>
  </w:body>
</w:document>`

// Minimal OOXML with prose references to LOCADOR in various forms
// Used for pluralizeLocadorRefs word-boundary tests (CONTR-12 / D-07)
const ADENDA_LOCADOR_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>El LOCADOR declara que es propietario.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Las obligaciones de el LOCADOR son las siguientes.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Domicilio del LOCADOR y notificaciones al LOCADOR.</w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>`

// Minimal OOXML document.xml with 2 yellow-highlighted runs
const ADENDA_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:rPr><w:highlight w:val="yellow"/></w:rPr>
        <w:t>NOMBRE DEL LOCADOR</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:highlight w:val="yellow"/></w:rPr>
        <w:t>FECHA DE VENCIMIENTO</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Texto no resaltado de referencia</w:t>
      </w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>`

// Minimal OOXML for AC PF/PJ — label paragraphs are yellow-highlighted and end with ":"
// This matches the real AC template structure where the LABEL is highlighted, not the value.
// The value gets appended as a new run just before </w:p>.
const AC_PF_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:rPr><w:highlight w:val="yellow"/></w:rPr>
        <w:t>Nombre:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:highlight w:val="yellow"/></w:rPr>
        <w:t>CUIT:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:highlight w:val="yellow"/></w:rPr>
        <w:t>Domicilio:</w:t>
      </w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>`

function buildDocx(xml: string): Buffer {
  const zip = new PizZip()
  // Minimal required OOXML parts
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)
  zip.file("word/document.xml", xml)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}

export function createAdendaFixture(): Buffer {
  return buildDocx(ADENDA_XML)
}

export function createAcPfFixture(): Buffer {
  return buildDocx(AC_PF_XML)
}

export function createAcPfTableFixture(): Buffer {
  return buildDocx(AC_PF_TABLE_XML)
}

export { ADENDA_XML, AC_PF_XML, AC_PF_TABLE_XML, ADENDA_LOCADOR_XML }
