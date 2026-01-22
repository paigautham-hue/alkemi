/**
 * Physics Validation Panel Component
 * 
 * Displays real-time physics validation results for formulations:
 * - Mass balance gauge
 * - Viscosity warnings
 * - Hansen solubility compatibility
 */

import { AlertTriangle, CheckCircle2, XCircle, Beaker, Droplet, Atom } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface PhysicsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculations?: {
    totalPercentage?: number;
    predictedViscosity?: number;
    maxHansenDistance?: number;
  };
}

interface PhysicsValidationPanelProps {
  validation: PhysicsValidationResult | null;
  isLoading?: boolean;
}

export function PhysicsValidationPanel({ validation, isLoading }: PhysicsValidationPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Physics Validation
          </CardTitle>
          <CardDescription>Analyzing formulation physics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Physics Validation
          </CardTitle>
          <CardDescription>Add components to see validation results</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { isValid, errors, warnings, calculations } = validation;
  const totalPercentage = calculations?.totalPercentage ?? 0;
  const predictedViscosity = calculations?.predictedViscosity;
  const maxHansenDistance = calculations?.maxHansenDistance;

  // Determine overall status
  const getStatusColor = () => {
    if (!isValid) return 'text-red-600';
    if (warnings.length > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!isValid) return <XCircle className="h-5 w-5" />;
    if (warnings.length > 0) return <AlertTriangle className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (!isValid) return 'Validation Failed';
    if (warnings.length > 0) return 'Warnings Detected';
    return 'Validation Passed';
  };

  // Viscosity color coding
  const getViscosityColor = (viscosity: number | undefined) => {
    if (!viscosity) return 'bg-gray-200';
    if (viscosity > 1_000_000) return 'bg-red-500';
    if (viscosity > 100_000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getViscosityLabel = (viscosity: number | undefined) => {
    if (!viscosity) return 'Unknown';
    if (viscosity > 1_000_000) return 'Too High';
    if (viscosity > 100_000) return 'Very High';
    if (viscosity > 10_000) return 'High';
    return 'Normal';
  };

  // Hansen compatibility color coding
  const getHansenColor = (distance: number | undefined) => {
    if (!distance) return 'bg-gray-200';
    if (distance > 8) return 'bg-red-500';
    if (distance > 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getHansenLabel = (distance: number | undefined) => {
    if (!distance) return 'Unknown';
    if (distance > 8) return 'Incompatible';
    if (distance > 5) return 'Borderline';
    return 'Compatible';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Physics Validation
          </div>
          <div className={`flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time physics-based validation of formulation composition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mass Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Mass Balance</span>
            </div>
            <Badge variant={Math.abs(totalPercentage - 100) <= 0.1 ? 'default' : 'destructive'}>
              {totalPercentage.toFixed(2)}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(totalPercentage, 100)} 
            className="h-2"
          />
          {Math.abs(totalPercentage - 100) > 0.1 && (
            <p className="text-xs text-red-600">
              Must equal 100% (currently {(totalPercentage - 100).toFixed(2)}% {totalPercentage > 100 ? 'over' : 'under'})
            </p>
          )}
        </div>

        {/* Viscosity Prediction */}
        {predictedViscosity !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Predicted Viscosity</span>
              </div>
              <Badge 
                variant={predictedViscosity > 100_000 ? 'destructive' : 'default'}
                className={predictedViscosity <= 100_000 ? 'bg-green-600' : ''}
              >
                {predictedViscosity.toLocaleString()} cP
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-full rounded ${getViscosityColor(predictedViscosity)}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {getViscosityLabel(predictedViscosity)}
              </span>
            </div>
          </div>
        )}

        {/* Hansen Solubility Compatibility */}
        {maxHansenDistance !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Atom className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium">Hansen Compatibility</span>
              </div>
              <Badge 
                variant={maxHansenDistance > 8 ? 'destructive' : 'default'}
                className={maxHansenDistance <= 5 ? 'bg-green-600' : maxHansenDistance <= 8 ? 'bg-yellow-600' : ''}
              >
                Ra = {maxHansenDistance.toFixed(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-full rounded ${getHansenColor(maxHansenDistance)}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {getHansenLabel(maxHansenDistance)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ra &lt; 5: Compatible • Ra 5-8: Borderline • Ra &gt; 8: Incompatible
            </p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Errors ({errors.length})
            </h4>
            {errors.map((error, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </h4>
            {warnings.map((warning, idx) => (
              <Alert key={idx} className="border-yellow-600 bg-yellow-50">
                <AlertDescription className="text-sm text-yellow-800">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Success State */}
        {isValid && errors.length === 0 && warnings.length === 0 && (
          <Alert className="border-green-600 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              All physics checks passed. Formulation is ready for processing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
