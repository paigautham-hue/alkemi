import re
import os

pages = [
    "Debate",
    "Documents", 
    "Equipment",
    "ManufacturingDocs",
    "PatentAnalyzer",
    "Predictions",
    "SupplierRiskDashboard",
    "TestConditions",
    "Trials"
]

for page in pages:
    filepath = f"client/src/pages/{page}.tsx"
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already wrapped
    if '<DashboardLayout>' in content:
        print(f"Already wrapped: {page}")
        continue
    
    # Find the main return statement (the one at function level, not nested)
    # Look for "  return (" at the start of a line (2 spaces indent)
    pattern = r'(\n  return \(\n)(    <div)'
    replacement = r'\1    <DashboardLayout>\n\2'
    
    content = re.sub(pattern, replacement, content, count=1)
    
    # Add closing tag before the final );
    # Find the last "  );" which closes the function
    content = re.sub(r'(    </div>\n  \);\n\})', r'    </div>\n    </DashboardLayout>\n  );\n}', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Wrapped: {page}")

print("Done!")
