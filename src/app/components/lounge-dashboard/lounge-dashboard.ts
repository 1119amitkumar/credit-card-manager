import { Component, inject, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreditCardService } from '../../services/credit-card.service';
import { CreditCard } from '../../models/credit-card.model';

@Component({
  selector: 'app-lounge-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './lounge-dashboard.html',
  styleUrl: './lounge-dashboard.scss',
})
export class LoungeDashboard {
  private readonly cardService = inject(CreditCardService);

  readonly cards = this.cardService.loungeCards;
  readonly totalCards = computed(() => this.cards().length);
  readonly eligibleCount = computed(() =>
    this.cards().filter(c => this.isLoungeEligible(c)).length
  );

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
    return this.getCurrentQuarterSpend(card) >= card.loungeAccess.quarterlySpendThreshold;
  }

  loungeProgressPercent(card: CreditCard): number {
    if (card.loungeAccess.quarterlySpendThreshold === 0) return 0;
    return Math.min((this.getCurrentQuarterSpend(card) / card.loungeAccess.quarterlySpendThreshold) * 100, 100);
  }

  loungeRemaining(card: CreditCard): number {
    const rem = card.loungeAccess.quarterlySpendThreshold - this.getCurrentQuarterSpend(card);
    return rem > 0 ? rem : 0;
  }
}
