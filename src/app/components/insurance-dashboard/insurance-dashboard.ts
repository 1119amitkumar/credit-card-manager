import { Component, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreditCardService } from '../../services/credit-card.service';
import { CreditCard, InsuranceCoverage } from '../../models/credit-card.model';

@Component({
  selector: 'app-insurance-dashboard',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './insurance-dashboard.html',
  styleUrl: './insurance-dashboard.scss',
})
export class InsuranceDashboard {
  private readonly cardService = inject(CreditCardService);
  private readonly fb = inject(FormBuilder);

  readonly cards = this.cardService.insuranceCards;
  readonly totalCards = computed(() => this.cards().length);
  readonly cardToEdit = signal<CreditCard | null>(null);

  readonly coverageLabels: { key: keyof InsuranceCoverage; label: string; icon: string }[] = [
    { key: 'accidentalDeathCover', label: 'Accidental Death Cover', icon: '💀' },
    { key: 'airAccidentCover', label: 'Air Accident Cover', icon: '✈️' },
    { key: 'fraudLiabilityCover', label: 'Fraud Liability Cover', icon: '🔒' },
    { key: 'lostCardLiability', label: 'Lost Card Liability', icon: '💳' },
    { key: 'purchaseProtection', label: 'Purchase Protection', icon: '🛍️' },
    { key: 'travelInsurance', label: 'Travel Insurance', icon: '🌍' },
  ];

  readonly editInsuranceForm = this.fb.group({
    accidentalDeathCover: [0, [Validators.required, Validators.min(0)]],
    airAccidentCover: [0, [Validators.required, Validators.min(0)]],
    fraudLiabilityCover: [0, [Validators.required, Validators.min(0)]],
    lostCardLiability: [0, [Validators.required, Validators.min(0)]],
    purchaseProtection: [0, [Validators.required, Validators.min(0)]],
    travelInsurance: [0, [Validators.required, Validators.min(0)]],
  });

  getCoverageValue(card: CreditCard, key: keyof InsuranceCoverage): number {
    return card.insurance[key] as number;
  }

  hasCoverage(card: CreditCard, key: keyof InsuranceCoverage): boolean {
    return (card.insurance[key] as number) > 0;
  }

  totalCoverageTypes(card: CreditCard): number {
    return this.coverageLabels.filter(c => this.hasCoverage(card, c.key)).length;
  }

  openEditModal(card: CreditCard): void {
    this.cardToEdit.set(card);
    this.editInsuranceForm.patchValue({
      accidentalDeathCover: card.insurance.accidentalDeathCover,
      airAccidentCover: card.insurance.airAccidentCover,
      fraudLiabilityCover: card.insurance.fraudLiabilityCover,
      lostCardLiability: card.insurance.lostCardLiability,
      purchaseProtection: card.insurance.purchaseProtection,
      travelInsurance: card.insurance.travelInsurance,
    });
  }

  closeEditModal(): void {
    this.cardToEdit.set(null);
  }

  submitEdit(): void {
    if (this.editInsuranceForm.invalid) {
      this.editInsuranceForm.markAllAsTouched();
      return;
    }
    const card = this.cardToEdit();
    if (!card) return;
    const v = this.editInsuranceForm.getRawValue();
    this.cardService.updateCard(card.id, {
      ...card,
      insurance: {
        available: true,
        accidentalDeathCover: v.accidentalDeathCover ?? 0,
        airAccidentCover: v.airAccidentCover ?? 0,
        fraudLiabilityCover: v.fraudLiabilityCover ?? 0,
        lostCardLiability: v.lostCardLiability ?? 0,
        purchaseProtection: v.purchaseProtection ?? 0,
        travelInsurance: v.travelInsurance ?? 0,
      },
    });
    this.cardToEdit.set(null);
  }
}
