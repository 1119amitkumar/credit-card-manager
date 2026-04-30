import { Component, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CreditCardService } from '../../services/credit-card.service';
import { CreditCard } from '../../models/credit-card.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly cardService = inject(CreditCardService);
  private readonly fb = inject(FormBuilder);

  readonly cards = this.cardService.allCards;
  readonly totalAnnualFees = this.cardService.totalAnnualFees;
  readonly cardsMetThreshold = this.cardService.cardsMetThreshold;
  readonly totalCards = computed(() => this.cards().length);

  readonly cardToDelete = signal<CreditCard | null>(null);
  readonly showAddModal = signal(false);
  readonly cardToEdit = signal<CreditCard | null>(null);

  readonly months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  readonly addCardForm = this.fb.group({
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
    monthlySpends: this.fb.array(this.getLast6Months().map(m =>
      this.fb.group({ month: [m], amount: [0, [Validators.required, Validators.min(0)]] })
    )),
  });

  readonly editCardForm = this.fb.group({
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
    monthlySpends: this.fb.array(this.getLast6Months().map(m =>
      this.fb.group({ month: [m], amount: [0, [Validators.required, Validators.min(0)]] })
    )),
  });

  get addMonthlySpends(): FormArray {
    return this.addCardForm.get('monthlySpends') as FormArray;
  }

  get editMonthlySpends(): FormArray {
    return this.editCardForm.get('monthlySpends') as FormArray;
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
    const currentQuarter = Math.floor(now.getMonth() / 3); // 0=Jan-Mar, 1=Apr-Jun, 2=Jul-Sep, 3=Oct-Dec
    const quarterStartMonth = currentQuarter * 3; // 0, 3, 6, or 9
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
    const remaining = card.spendThreshold - card.spendTillNow;
    return remaining > 0 ? remaining : 0;
  }

  progressPercent(card: CreditCard): number {
    return Math.min((card.spendTillNow / card.spendThreshold) * 100, 100);
  }

  isThresholdMet(card: CreditCard): boolean {
    return card.spendTillNow >= card.spendThreshold;
  }

  isUrgent(card: CreditCard): boolean {
    if (this.isThresholdMet(card)) return false;
    const monthIndex = this.months.indexOf(card.anniversaryMonth);
    if (monthIndex === -1) return false;
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based
    let monthsLeft = monthIndex - currentMonth;
    if (monthsLeft <= 0) monthsLeft += 12;
    return monthsLeft <= 3;
  }

  openDeleteModal(card: CreditCard): void {
    this.cardToDelete.set(card);
  }

  closeDeleteModal(): void {
    this.cardToDelete.set(null);
  }

  confirmDelete(): void {
    const card = this.cardToDelete();
    if (card) {
      this.cardService.deleteCard(card.id);
      this.cardToDelete.set(null);
    }
  }

  openAddModal(): void {
    this.addCardForm.reset();
    const months6 = this.getLast6Months();
    this.addMonthlySpends.clear();
    months6.forEach(m => this.addMonthlySpends.push(
      this.fb.group({ month: [m], amount: [0, [Validators.required, Validators.min(0)]] })
    ));
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  submitCard(): void {
    if (this.addCardForm.invalid) {
      this.addCardForm.markAllAsTouched();
      return;
    }
    const v = this.addCardForm.getRawValue();
    this.cardService.addCard({
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
      additionalNotes: '',
    });
    this.showAddModal.set(false);
  }

  openEditModal(card: CreditCard): void {
    this.cardToEdit.set(card);
    this.editCardForm.patchValue({
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
  }

  closeEditModal(): void {
    this.cardToEdit.set(null);
  }

  submitEdit(): void {
    if (this.editCardForm.invalid) {
      this.editCardForm.markAllAsTouched();
      return;
    }
    const card = this.cardToEdit();
    if (!card) return;
    const v = this.editCardForm.getRawValue();
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
      additionalNotes: card.additionalNotes ?? '',
    });
    this.cardToEdit.set(null);
  }
}
