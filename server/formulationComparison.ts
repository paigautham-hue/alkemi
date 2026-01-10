import * as db from "./db";

/**
 * Formulation Comparison Service
 * 
 * Compares two formulation versions side-by-side and highlights differences
 * in composition, properties, and metadata.
 */

export interface ComponentComparison {
  materialId: string;
  materialName: string;
  materialCode: string;
  status: "added" | "removed" | "changed" | "unchanged";
  basePercentage: string | null; // null if added in target
  targetPercentage: string | null; // null if removed in target
  percentageDiff: string | null; // difference in percentage points
  baseRole: string | null;
  targetRole: string | null;
}

export interface PropertyComparison {
  property: string;
  baseValue: string | null;
  targetValue: string | null;
  changed: boolean;
}

export interface FormulationComparisonResult {
  baseVersion: {
    id: string;
    versionNumber: string;
    status: string;
    branchType: string | null;
    createdAt: Date;
  };
  targetVersion: {
    id: string;
    versionNumber: string;
    status: string;
    branchType: string | null;
    createdAt: Date;
  };
  componentComparisons: ComponentComparison[];
  propertyComparisons: PropertyComparison[];
  summary: {
    totalComponents: number;
    addedComponents: number;
    removedComponents: number;
    changedComponents: number;
    unchangedComponents: number;
  };
}

export async function compareFormulations(
  baseVersionId: string,
  targetVersionId: string,
  organizationId: string
): Promise<FormulationComparisonResult> {
  // Get both formulation versions
  const baseVersion = await db.getFormulationVersionById(baseVersionId, organizationId);
  const targetVersion = await db.getFormulationVersionById(targetVersionId, organizationId);

  if (!baseVersion || !targetVersion) {
    throw new Error("One or both formulation versions not found");
  }

  // Get components for both versions
  const baseComponents = await db.getFormulationComponents(baseVersionId, organizationId);
  const targetComponents = await db.getFormulationComponents(targetVersionId, organizationId);

  // Build material maps for quick lookup
  const baseMap = new Map<string, typeof baseComponents[0]>();
  const targetMap = new Map<string, typeof targetComponents[0]>();

  for (const comp of baseComponents) {
    baseMap.set(comp.material.id, comp);
  }

  for (const comp of targetComponents) {
    targetMap.set(comp.material.id, comp);
  }

  // Calculate component comparisons
  const componentComparisons: ComponentComparison[] = [];
  const allMaterialIds = new Set([
    ...Array.from(baseMap.keys()),
    ...Array.from(targetMap.keys()),
  ]);

  for (const materialId of Array.from(allMaterialIds)) {
    const baseComp = baseMap.get(materialId);
    const targetComp = targetMap.get(materialId);

    if (baseComp && targetComp) {
      // Component exists in both versions
      const basePercentage = parseFloat(baseComp.component.percentage);
      const targetPercentage = parseFloat(targetComp.component.percentage);
      const percentageDiff = targetPercentage - basePercentage;

      const status =
        Math.abs(percentageDiff) < 0.01 &&
        baseComp.component.role === targetComp.component.role
          ? "unchanged"
          : "changed";

      componentComparisons.push({
        materialId,
        materialName: baseComp.material.name,
        materialCode: baseComp.material.code,
        status,
        basePercentage: baseComp.component.percentage,
        targetPercentage: targetComp.component.percentage,
        percentageDiff: percentageDiff.toFixed(2),
        baseRole: baseComp.component.role,
        targetRole: targetComp.component.role,
      });
    } else if (baseComp) {
      // Component removed in target version
      componentComparisons.push({
        materialId,
        materialName: baseComp.material.name,
        materialCode: baseComp.material.code,
        status: "removed",
        basePercentage: baseComp.component.percentage,
        targetPercentage: null,
        percentageDiff: null,
        baseRole: baseComp.component.role,
        targetRole: null,
      });
    } else if (targetComp) {
      // Component added in target version
      componentComparisons.push({
        materialId,
        materialName: targetComp.material.name,
        materialCode: targetComp.material.code,
        status: "added",
        basePercentage: null,
        targetPercentage: targetComp.component.percentage,
        percentageDiff: null,
        baseRole: null,
        targetRole: targetComp.component.role,
      });
    }
  }

  // Sort by status (removed, changed, added, unchanged) then by material name
  const statusOrder = { removed: 0, changed: 1, added: 2, unchanged: 3 };
  componentComparisons.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.materialName.localeCompare(b.materialName);
  });

  // Calculate property comparisons
  const propertyComparisons: PropertyComparison[] = [
    {
      property: "Status",
      baseValue: baseVersion.status,
      targetValue: targetVersion.status,
      changed: baseVersion.status !== targetVersion.status,
    },
    {
      property: "Branch Type",
      baseValue: baseVersion.branchType,
      targetValue: targetVersion.branchType,
      changed: baseVersion.branchType !== targetVersion.branchType,
    },
  ];

  // Calculate summary statistics
  const summary = {
    totalComponents: componentComparisons.length,
    addedComponents: componentComparisons.filter((c) => c.status === "added")
      .length,
    removedComponents: componentComparisons.filter((c) => c.status === "removed")
      .length,
    changedComponents: componentComparisons.filter((c) => c.status === "changed")
      .length,
    unchangedComponents: componentComparisons.filter(
      (c) => c.status === "unchanged"
    ).length,
  };

  return {
    baseVersion: {
      id: baseVersion.id,
      versionNumber: baseVersion.versionNumber,
      status: baseVersion.status,
      branchType: baseVersion.branchType,
      createdAt: baseVersion.createdAt,
    },
    targetVersion: {
      id: targetVersion.id,
      versionNumber: targetVersion.versionNumber,
      status: targetVersion.status,
      branchType: targetVersion.branchType,
      createdAt: targetVersion.createdAt,
    },
    componentComparisons,
    propertyComparisons,
    summary,
  };
}
