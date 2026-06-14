import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateAHP, buildMatrixFromUpperTriangle } from "@/lib/calculations/ahp";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get("session") || "Skenario A";

    const [matrices, results] = await Promise.all([
      db.getAhpMatrices(sessionName),
      db.getAhpResults(sessionName),
    ]);

    return NextResponse.json({
      success: true,
      data: { matrices, results },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to fetch AHP data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionName = "Skenario A", comparisons } = body; // comparisons is record of "criteria_i_id-criteria_j_id" -> value

    if (!comparisons) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing comparisons data" },
        { status: 400 }
      );
    }

    const criteriaList = await db.getCriteria();
    const n = criteriaList.length;

    // Create mapping indices to criteria IDs
    const criteriaIds = criteriaList.map((c) => c.id);

    // Build upperTriangle mapping using indices (0 to n-1)
    const upperTriangleIndices: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const id_i = criteriaIds[i];
        const id_j = criteriaIds[j];
        // Check if value is passed from client
        const key = `${id_i}-${id_j}`;
        const val = comparisons[key] !== undefined ? Number(comparisons[key]) : 1;
        upperTriangleIndices[`${i}-${j}`] = val;
      }
    }

    // Build the N x N numerical matrix
    const matrix = buildMatrixFromUpperTriangle(upperTriangleIndices, n);

    // Calculate AHP
    const calcResult = calculateAHP(matrix);

    // Map weights back to criteria IDs
    const weightsMap: Record<string, number> = {};
    criteriaIds.forEach((id, idx) => {
      weightsMap[id] = calcResult.weights[idx];
    });

    // Save pairwise comparison matrices inputs to database
    const matricesSavePayload = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const id_i = criteriaIds[i];
        const id_j = criteriaIds[j];
        const key = `${id_i}-${id_j}`;
        const val = comparisons[key] !== undefined ? Number(comparisons[key]) : 1;
        matricesSavePayload.push({
          criteria_i_id: id_i,
          criteria_j_id: id_j,
          value: val,
        });
      }
    }

    await Promise.all([
      db.saveAhpMatrices(sessionName, matricesSavePayload),
      db.saveAhpResults(
        sessionName,
        weightsMap,
        calcResult.lambdaMax,
        calcResult.ci,
        calcResult.cr,
        calcResult.isConsistent
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: calcResult,
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || "AHP calculation failed" },
      { status: 500 }
    );
  }
}
