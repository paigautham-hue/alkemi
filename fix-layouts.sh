#!/bin/bash

# Pages that need DashboardLayout added
pages=(
  "Approvals"
  "Debate"
  "Documents"
  "Equipment"
  "ManufacturingDocs"
  "PatentAnalyzer"
  "Predictions"
  "SupplierRiskDashboard"
  "TestConditions"
  "Trials"
)

for page in "${pages[@]}"; do
  file="client/src/pages/${page}.tsx"
  if [ -f "$file" ]; then
    # Check if DashboardLayout is already imported
    if ! grep -q "import DashboardLayout" "$file"; then
      echo "Processing $file..."
      # Add import at the top
      sed -i '1i import DashboardLayout from "@/components/DashboardLayout";' "$file"
    fi
  fi
done

echo "Done adding imports"
