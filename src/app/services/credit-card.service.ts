import { Injectable, signal, computed } from '@angular/core';
import { CreditCard } from '../models/credit-card.model';

const DB_NAME = 'CreditCardDB';
const STORE_NAME = 'cards';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class CreditCardService {
  private readonly cards = signal<CreditCard[]>([]);
  private db!: IDBDatabase;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
      this.loadCards();
    };
  }

  private loadCards(): void {
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAll = store.getAll();

    getAll.onsuccess = () => {
      if (getAll.result.length > 0) {
        this.cards.set(getAll.result);
      } else {
        this.seedFromJSON();
      }
    };
  }

  private seedFromJSON(): void {
    fetch('/data/cards.json')
      .then(res => res.json())
      .then((seedCards: CreditCard[]) => {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        seedCards.forEach(card => store.put(card));
        tx.oncomplete = () => this.cards.set(seedCards);
      });
  }

  private saveAll(): void {
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    this.cards().forEach(card => store.put(card));
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

  deleteCard(id: string): void {
    this.cards.update(cards => cards.filter(c => c.id !== id));
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  }

  addCard(card: Omit<CreditCard, 'id'>): void {
    const newCard: CreditCard = { ...card, id: crypto.randomUUID() };
    this.cards.update(cards => [...cards, newCard]);
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(newCard);
  }

  updateCard(id: string, updates: Omit<CreditCard, 'id'>): void {
    const updated: CreditCard = { ...updates, id };
    this.cards.update(cards =>
      cards.map(c => c.id === id ? updated : c)
    );
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(updated);
  }
}
