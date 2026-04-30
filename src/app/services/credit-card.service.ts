import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { CreditCard } from '../models/credit-card.model';
import { db } from '../firebase.config';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';

const COLLECTION = 'cards';

@Injectable({ providedIn: 'root' })
export class CreditCardService implements OnDestroy {
  private readonly cards = signal<CreditCard[]>([]);
  private unsubscribe: Unsubscribe | null = null;

  constructor() {
    this.listenToCards();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private listenToCards(): void {
    const cardsRef = collection(db, COLLECTION);

    this.unsubscribe = onSnapshot(cardsRef, async (snapshot) => {
      if (snapshot.empty) {
        await this.seedFromJSON();
        return;
      }
      const cards = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as CreditCard);
      this.cards.set(cards);
    });
  }

  private async seedFromJSON(): Promise<void> {
    const existing = await getDocs(collection(db, COLLECTION));
    if (!existing.empty) return;

    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const res = await fetch(`${baseHref}data/cards.json`);
    const seedCards: CreditCard[] = await res.json();
    for (const card of seedCards) {
      await setDoc(doc(db, COLLECTION, card.id), card);
    }
  }

  readonly allCards = this.cards.asReadonly();

  readonly totalAnnualFees = computed(() =>
    this.cards().reduce((sum, c) => sum + c.annualFee, 0)
  );

  readonly cardsMetThreshold = computed(() =>
    this.cards().filter(c => c.spendTillNow >= c.spendThreshold).length
  );

  readonly loungeCards = computed(() =>
    this.cards().filter(c => c.loungeAccess.available)
  );

  readonly insuranceCards = computed(() =>
    this.cards().filter(c => c.insurance.available)
  );

  getCardById(id: string): CreditCard | undefined {
    return this.cards().find(c => c.id === id);
  }

  async deleteCard(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  async addCard(card: Omit<CreditCard, 'id'>): Promise<void> {
    const newId = crypto.randomUUID();
    const newCard: CreditCard = { ...card, id: newId };
    await setDoc(doc(db, COLLECTION, newId), newCard);
  }

  async updateCard(id: string, updates: Omit<CreditCard, 'id'>): Promise<void> {
    const updated: CreditCard = { ...updates, id };
    await setDoc(doc(db, COLLECTION, id), updated);
  }
}
