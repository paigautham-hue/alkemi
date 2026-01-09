/**
 * Advanced Search Page
 * 
 * Full-text search across materials, formulations, and documents
 * with property filters and result grouping
 */

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Building2, FileText, FlaskConical, Package, Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [minViscosity, setMinViscosity] = useState<string>("");
  const [maxViscosity, setMaxViscosity] = useState<string>("");
  const [minDensity, setMinDensity] = useState<string>("");
  const [maxDensity, setMaxDensity] = useState<string>("");

  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const { data: searchResults, isLoading } = trpc.search.unified.useQuery(
    {
      query: query || undefined,
      category: category || undefined,
      supplierId: supplierId || undefined,
      minViscosity: minViscosity ? parseFloat(minViscosity) : undefined,
      maxViscosity: maxViscosity ? parseFloat(maxViscosity) : undefined,
      minDensity: minDensity ? parseFloat(minDensity) : undefined,
      maxDensity: maxDensity ? parseFloat(maxDensity) : undefined,
    },
    {
      enabled: query.length >= 2 || !!category || !!supplierId || !!minViscosity || !!maxViscosity || !!minDensity || !!maxDensity,
    }
  );

  const clearFilters = () => {
    setQuery("");
    setCategory(undefined);
    setSupplierId(undefined);
    setMinViscosity("");
    setMaxViscosity("");
    setMinDensity("");
    setMaxDensity("");
  };

  const hasFilters = query || category || supplierId || minViscosity || maxViscosity || minDensity || maxDensity;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground mt-2">
            Search across materials, formulations, and documents with advanced filters
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Filters Sidebar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filters</CardTitle>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Query</Label>
                <Input
                  placeholder="Enter search term..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Searches across names, codes, descriptions
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Resin">Resin</SelectItem>
                    <SelectItem value="Pigment">Pigment</SelectItem>
                    <SelectItem value="Solvent">Solvent</SelectItem>
                    <SelectItem value="Additive">Additive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Viscosity Range (cP)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minViscosity}
                    onChange={(e) => setMinViscosity(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxViscosity}
                    onChange={(e) => setMaxViscosity(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Density Range (g/cm³)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={minDensity}
                    onChange={(e) => setMinDensity(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={maxDensity}
                    onChange={(e) => setMaxDensity(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {!hasFilters && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Start searching</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter a search term or apply filters to find materials, formulations, and documents
                  </p>
                </CardContent>
              </Card>
            )}

            {hasFilters && isLoading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
              </Card>
            )}

            {hasFilters && !isLoading && searchResults && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.totalCount} result{searchResults.totalCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Materials Results */}
                {searchResults.materials.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Materials ({searchResults.materials.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.materials.map((material) => (
                        <Link key={material.id} href={`/materials`}>
                          <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {material.code} {material.casNumber && `• CAS ${material.casNumber}`}
                                </p>
                                {material.supplierName && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <Building2 className="h-3 w-3 inline mr-1" />
                                    {material.supplierName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                {material.viscosity && <div>η: {material.viscosity} cP</div>}
                                {material.density && <div>ρ: {material.density} g/cm³</div>}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{material.matchReason}</p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Formulations Results */}
                {searchResults.formulations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        Formulations ({searchResults.formulations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.formulations.map((formulation) => (
                        <Link key={formulation.id} href={`/formulations/${formulation.id}`}>
                          <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{formulation.name}</p>
                                <p className="text-sm text-muted-foreground">{formulation.code}</p>
                                {formulation.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formulation.description}
                                  </p>
                                )}
                              </div>
                              {formulation.confidentialityLevel && (
                                <span className="text-xs px-2 py-1 rounded bg-accent">
                                  {formulation.confidentialityLevel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{formulation.matchReason}</p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Documents Results */}
                {searchResults.documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documents ({searchResults.documents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {searchResults.documents.map((document) => (
                        <Link key={document.id} href={`/documents`}>
                          <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{document.title}</p>
                                {document.filename && (
                                  <p className="text-sm text-muted-foreground">{document.filename}</p>
                                )}
                              </div>
                              {document.sourceType && (
                                <span className="text-xs px-2 py-1 rounded bg-accent uppercase">
                                  {document.sourceType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{document.matchReason}</p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {searchResults.totalCount === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
