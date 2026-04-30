import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { CreditCardService } from '../../services/credit-card.service';
import { CreditCard, InsuranceCoverage } from '../../models/credit-card.model';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './card-detail.html',
  styleUrl: './card-detail.scss',
})
export class CardDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cardService = inject(CreditCardService);
  private readonly fb = inject(FormBuilder);

  readonly cardId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly showEditModal = signal(false);
  readonly showNotesEdit = signal(false);

  readonly notesForm = this.fb.group({
    additionalNotes: [''],
  });

  readonly months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  readonly insuranceLabels: { key: keyof InsuranceCoverage; label: string; icon: string }[] = [
    { key: 'accidentalDeathCover', label: 'Accidental Death Cover', icon: '💀' },
    { key: 'airAccidentCover', label: 'Air Accident Cover', icon: '✈️' },
    { key: 'fraudLiabilityCover', label: 'Fraud Liability Cover', icon: '🔒' },
    { key: 'lostCardLiability', label: 'Lost Card Liability', icon: '💳' },
    { key: 'purchaseProtection', label: 'Purchase Protection', icon: '🛍️' },
    { key: 'travelInsurance', label: 'Travel Insurance', icon: '🌍' },
  ];

  readonly card = computed(() => this.cardService.getCardById(this.cardId));

  readonly editForm = this.fb.group({
    bankName: ['', Validators.required],
    cardName: ['', Validators.required],
    annualFee: [null as number | null, [Validators.required, Validators.min(0)]],
    anniversaryMonth: ['', Validators.required],
    spendThreshold: [null as number | null, [Validators.required, Validators.min(1)]],
    spendTillNow: [null as number | null, [Validators.required, Validators.min(0)]],
    insuranceAvailable: [false],
    accidentalDeathCover: [null as number | null],
    airAccidentCover: [null as number | null],
    fraudLiabilityCover: [null as number | null],
    lostCardLiability: [null as number | null],
    purchaseProtection: [null as number | null],
    travelInsurance: [null as number | null],
    loungeAvailable: [false],
    loungeQuarterlyThreshold: [null as number | null],
    monthlySpends: this.fb.array([] as any[]),
    additionalNotes: [''],
  });

  get editMonthlySpends(): FormArray {
    return this.editForm.get('monthlySpends') as FormArray;
  }

  getLast6Months(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  }

  getCurrentQuarterSpend(card: CreditCard): number {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStartMonth = currentQuarter * 3;
    const quarterMonthNames: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), quarterStartMonth + i, 1);
      quarterMonthNames.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return card.monthlySpends
      .filter(ms => quarterMonthNames.includes(ms.month))
      .reduce((sum, ms) => sum + ms.amount, 0);
  }

  isLoungeEligible(card: CreditCard): boolean {
    return card.loungeAccess.available &&
      this.getCurrentQuarterSpend(card) >= card.loungeAccess.quarterlySpendThreshold;
  }

  loungeProgressPercent(card: CreditCard): number {
    if (!card.loungeAccess.available || card.loungeAccess.quarterlySpendThreshold === 0) return 0;
    return Math.min((this.getCurrentQuarterSpend(card) / card.loungeAccess.quarterlySpendThreshold) * 100, 100);
  }

  loungeRemaining(card: CreditCard): number {
    const rem = card.loungeAccess.quarterlySpendThreshold - this.getCurrentQuarterSpend(card);
    return rem > 0 ? rem : 0;
  }

  remainingSpend(card: CreditCard): number {
    const rem = card.spendThreshold - card.spendTillNow;
    return rem > 0 ? rem : 0;
  }

  progressPercent(card: CreditCard): number {
    return Math.min((card.spendTillNow / card.spendThreshold) * 100, 100);
  }

  isThresholdMet(card: CreditCard): boolean {
    return card.spendTillNow >= card.spendThreshold;
  }

  hasCoverage(card: CreditCard, key: keyof InsuranceCoverage): boolean {
    return (card.insurance[key] as number) > 0;
  }

  getCoverageValue(card: CreditCard, key: keyof InsuranceCoverage): number {
    return card.insurance[key] as number;
  }

  getNotesList(card: CreditCard): string[] {
    return card.additionalNotes
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  openNotesEdit(): void {
    const card = this.card();
    if (!card) return;
    this.notesForm.patchValue({ additionalNotes: card.additionalNotes });
    this.showNotesEdit.set(true);
  }

  cancelNotesEdit(): void {
    this.showNotesEdit.set(false);
  }

  saveNotes(): void {
    const card = this.card();
    if (!card) return;
    const { id, ...rest } = card;
    this.cardService.updateCard(card.id, {
      ...rest,
      additionalNotes: this.notesForm.getRawValue().additionalNotes ?? '',
    });
    this.showNotesEdit.set(false);
  }

  openEditModal(): void {
    const card = this.card();
    if (!card) return;
    this.editForm.patchValue({
      bankName: card.bankName,
      cardName: card.cardName,
      annualFee: card.annualFee,
      anniversaryMonth: card.anniversaryMonth,
      spendThreshold: card.spendThreshold,
      spendTillNow: card.spendTillNow,
      insuranceAvailable: card.insurance.available,
      accidentalDeathCover: card.insurance.accidentalDeathCover,
      airAccidentCover: card.insurance.airAccidentCover,
      fraudLiabilityCover: card.insurance.fraudLiabilityCover,
      lostCardLiability: card.insurance.lostCardLiability,
      purchaseProtection: card.insurance.purchaseProtection,
      travelInsurance: card.insurance.travelInsurance,
      loungeAvailable: card.loungeAccess.available,
      loungeQuarterlyThreshold: card.loungeAccess.quarterlySpendThreshold,
      additionalNotes: card.additionalNotes,
    });
    this.editMonthlySpends.clear();
    const months6 = this.getLast6Months();
    months6.forEach((m, i) => {
      const existing = card.monthlySpends[i];
      this.editMonthlySpends.push(
        this.fb.group({
          month: [m],
          amount: [existing?.amount ?? 0, [Validators.required, Validators.min(0)]],
        })
      );
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const card = this.card();
    if (!card) return;
    const v = this.editForm.getRawValue();
    this.cardService.updateCard(card.id, {
      bankName: v.bankName!,
      cardName: v.cardName!,
      annualFee: v.annualFee!,
      anniversaryMonth: v.anniversaryMonth!,
      spendThreshold: v.spendThreshold!,
      spendTillNow: v.spendTillNow!,
      insurance: {
        available: v.insuranceAvailable ?? false,
        accidentalDeathCover: v.accidentalDeathCover ?? 0,
        airAccidentCover: v.airAccidentCover ?? 0,
        fraudLiabilityCover: v.fraudLiabilityCover ?? 0,
        lostCardLiability: v.lostCardLiability ?? 0,
        purchaseProtection: v.purchaseProtection ?? 0,
        travelInsurance: v.travelInsurance ?? 0,
      },
      loungeAccess: {
        available: v.loungeAvailable ?? false,
        quarterlySpendThreshold: v.loungeQuarterlyThreshold ?? 0,
      },
      monthlySpends: (v.monthlySpends ?? []).map((ms: any) => ({ month: ms.month, amount: ms.amount ?? 0 })),
      additionalNotes: v.additionalNotes ?? '',
    });
    this.showEditModal.set(false);
  }

  deleteCard(): void {
    const card = this.card();
    if (!card) return;
    this.cardService.deleteCard(card.id);
    this.router.navigate(['/']);
  }
}
