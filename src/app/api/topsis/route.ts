import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateTOPSIS } from "@/lib/calculations/topsis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get("session") || "Skenario A";

    const data = await db.getTopsisResults(sessionName);
    return NextResponse.json({ success: true, data, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch TOPSIS rankings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionName = "Skenario A" } = body;

    // Fetch criteria and check weights
    const criteriaList = await db.getCriteria();
    const activeAlternatives = (await db.getAlternatives()).filter((a) => a.is_active);

    if (activeAlternatives.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: "Tidak ada objek wisata aktif yang dapat dinilai" },
        { status: 400 }
      );
    }

    // Check if AHP weights are populated and non-zero
    const hasWeights = criteriaList.some((c) => Number(c.weight) > 0);
    if (!hasWeights) {
      return NextResponse.json(
        { success: false, data: null, error: "Bobot kriteria belum dikalkulasi menggunakan AHP. Jalankan AHP terlebih dahulu." },
        { status: 400 }
      );
    }

    const weights = criteriaList.map((c) => Number(c.weight));
    const criteriaTypes = criteriaList.map((c) => c.type);

    // Build Decision Matrix: alternatives (rows) x criteria (columns)
    const decisionMatrix: number[][] = [];
    const altIds: string[] = [];

    activeAlternatives.forEach((alt) => {
      altIds.push(alt.id);
      const row: number[] = [];
      criteriaList.forEach((crit) => {
        const scoreObj = alt.scores?.find((s) => s.criteria_id === crit.id);
        const scoreVal = scoreObj ? Number(scoreObj.score_value) : 3.0; // default to 3
        row.push(scoreVal);
      });
      decisionMatrix.push(row);
    });

    // Run TOPSIS calculation
    const calcResult = calculateTOPSIS(decisionMatrix, weights, criteriaTypes);

    // Prepare TOPSIS results payload
    const resultsPayload = altIds.map((id, idx) => ({
      alternative_id: id,
      d_positive: calcResult.dPlus[idx],
      d_negative: calcResult.dMinus[idx],
      preference_score: calcResult.preferences[idx],
      rank: calcResult.rankings[idx],
    }));

    // Prepare TOPSIS normalized/weighted matrix payload for transparency
    const normalizedPayload: { alternative_id: string; criteria_id: string; r_value: number; v_value: number }[] = [];
    altIds.forEach((altId, i) => {
      criteriaList.forEach((crit, j) => {
        normalizedPayload.push({
          alternative_id: altId,
          criteria_id: crit.id,
          r_value: calcResult.normalizedMatrix[i][j],
          v_value: calcResult.weightedMatrix[i][j],
        });
      });
    });

    // Save calculation outputs
    await db.saveTopsisResults(sessionName, resultsPayload, normalizedPayload);

    return NextResponse.json({
      success: true,
      data: {
        rankings: resultsPayload,
        idealPositive: calcResult.idealPositive,
        idealNegative: calcResult.idealNegative,
      },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "TOPSIS calculation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get("session") || "Skenario A";

    const success = await db.resetCalculation(sessionName);
    return NextResponse.json({ success, data: null, error: success ? null : "Failed to reset session data" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to reset session data" },
      { status: 500 }
    );
  }
}
