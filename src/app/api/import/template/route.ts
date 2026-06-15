import { NextResponse, NextRequest } from "next/server";

const TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  clusters: {
    headers: ["name", "description", "color"],
    example: ["Wisata Bahari", "Destinasi wisata pantai dan laut", "#0ea5e9"],
  },
  criteria: {
    headers: ["code", "name", "type", "description", "sort_order"],
    example: ["K1", "Aksesibilitas", "benefit", "Kemudahan akses menuju lokasi", "1"],
  },
  sub_criteria: {
    headers: ["criteria_code", "score_value", "label", "description"],
    example: ["K1", "3", "Baik", "Akses jalan aspal baik, ada transportasi umum"],
  },
  alternatives: {
    headers: ["code", "name", "cluster_name", "description", "address", "latitude", "longitude", "image_url", "is_active"],
    example: ["A1", "Pantai Manggar", "Wisata Bahari", "Pantai populer di Balikpapan", "Kec. Balikpapan Timur", "-1.2745", "116.9231", "", "true"],
  },
  scores: {
    headers: ["alternative_code", "K1", "K2", "K3", "K4", "K5", "K6", "K7"],
    example: ["A1", "4", "4", "4", "3", "4", "3", "4"],
  },
  ahp_matrices: {
    headers: ["session_name", "criteria_i_code", "criteria_j_code", "value"],
    example: ["Skenario A", "K1", "K2", "2"],
  },
  references: {
    headers: ["category", "title", "number", "year", "publisher", "description", "url", "sort_order"],
    example: ["Peraturan Daerah", "RTRW Kota Balikpapan", "No. 12/2012", "2012", "DPRD Balikpapan", "Regulasi tata ruang", "https://balikpapan.go.id", "1"],
  },
};

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (!type || !TEMPLATES[type]) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid type. Available types: ${Object.keys(TEMPLATES).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const tmpl = TEMPLATES[type];
  const csvContent = [
    tmpl.headers.map(escapeCSV).join(","),
    tmpl.example.map(escapeCSV).join(","),
  ].join("\n");

  const filename = `template_${type}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
