import PizZip from "pizzip"

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

// Minimal OOXML for AC PF/PJ — label-based fields (no yellow highlight)
const AC_PF_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Nombre:</w:t></w:r>
      <w:r><w:t> </w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>CUIT:</w:t></w:r>
      <w:r><w:t> </w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Domicilio:</w:t></w:r>
      <w:r><w:t> </w:t></w:r>
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

export { ADENDA_XML, AC_PF_XML }
