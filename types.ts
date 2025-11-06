export interface EcoScore {
  carbon: number;
  recyclability: number;
  sourcing: number;
}

export interface Impact {
  co2_per_year_kg: number;
  trees_saved_per_year: number;
  plastic_bottles_avoided: number;
}

export interface EcoScoreResponse {
  eco_score: EcoScore;
  analysis: string;
  impact: Impact;
  alternatives: string[];
  barcode_detected?: string;
}
