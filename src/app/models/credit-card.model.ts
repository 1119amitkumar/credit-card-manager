export interface MonthlySpend {
  month: string; // e.g. 'October 2025'
  amount: number;
}

export interface LoungeAccess {
  available: boolean;
  quarterlySpendThreshold: number; // spend required per quarter for lounge eligibility
}

export interface InsuranceCoverage {
  available: boolean;
  accidentalDeathCover: number;      // cover amount in ₹ (0 if not available)
  airAccidentCover: number;           // cover amount in ₹
  fraudLiabilityCover: number;        // cover amount in ₹
  lostCardLiability: number;          // cover amount in ₹
  purchaseProtection: number;         // cover amount in ₹
  travelInsurance: number;            // cover amount in ₹
}

export interface CreditCard {
  id: string;
  bankName: string;
  cardName: string;
  annualFee: number;
  anniversaryMonth: string;
  spendThreshold: number;
  spendTillNow: number;
  insurance: InsuranceCoverage;
  loungeAccess: LoungeAccess;
  monthlySpends: MonthlySpend[]; // last 6 months
  additionalNotes: string; // free-text notes visible only on card detail page
}
