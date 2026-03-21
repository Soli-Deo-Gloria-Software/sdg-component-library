import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import {
  BibleBookInfo,
  BibleBooks,
  BibleChapter,
  CommonVariations,
} from '@soli-deo-gloria-software/bible-books';
import { BibleParser, BibleReference } from '@soli-deo-gloria-software/bible-reference-finder';
import { ReferencePickerState } from '../../utils/enums';

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  shadow: true,
})
export class BibleReferencePicker {
  private static readonly parser = new BibleParser();

  /** Maximum number of references that can be collected. */
  @Prop({ reflect: true }) maxReferences: number = 100;

  @Event({ eventName: 'referencesChange' }) referencesChange: EventEmitter<BibleReference[]>;

  @State() value = '';
  @State() books: BibleBookInfo[] = [];
  @State() step: ReferencePickerState = ReferencePickerState.Book;
  @State() availableNumbers: number[] = [];
  @State() selectedBook: BibleBookInfo | undefined;
  @State() references: BibleReference[] = [];

  private startChapter?: number;

  /**
   * When true, `setBook` will not rewrite the input to canonical book + suffix (avoids
   * "autocomplete" while the user is deleting with Backspace).
   */
  private suppressBookCanonicalization = false;

  private getBookAliases(book: BibleBookInfo): string[] {
    const aliases = new Set<string>();
    aliases.add(book.Name);
    aliases.add(book.CanonicalName);
    if (book.OsisCode) {
      aliases.add(book.OsisCode);
    }
    const common = CommonVariations.get(book.Book);
    if (common) {
      common.forEach((a) => aliases.add(a));
    }
    return [...aliases];
  }

  private longestBookMatch(
    value: string,
  ): { book: BibleBookInfo; alias: string } | null {
    const v = value.trimStart();
    if (!v) {
      return null;
    }
    const vl = v.toLowerCase();
    let best: { book: BibleBookInfo; alias: string } | null = null;

    for (const book of BibleBooks) {
      const aliases = this.getBookAliases(book).sort((a, b) => b.length - a.length);
      for (const alias of aliases) {
        const al = alias.toLowerCase();
        if (!vl.startsWith(al)) {
          continue;
        }
        const rest = v.slice(alias.length);
        const next = rest[0];
        if (next !== undefined && next !== ' ' && !/\d/.test(next)) {
          continue;
        }
        if (!best || alias.length > best.alias.length) {
          best = { book, alias };
        }
      }
    }
    return best;
  }

  private filterBooksByQuery(query: string): BibleBookInfo[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    const seen = new Set<number>();
    const out: BibleBookInfo[] = [];
    for (const book of BibleBooks) {
      if (seen.has(book.Book)) {
        continue;
      }
      const hit = this.getBookAliases(book).some((a) => {
        const al = a.toLowerCase();
        return al.startsWith(q) || (q.length >= 2 && al.includes(q));
      });
      if (hit) {
        seen.add(book.Book);
        out.push(book);
      }
    }
    return out;
  }

  private clearNumericState() {
    this.startChapter = undefined;
  }

  private resetReferenceBuilder(preserveValue?: boolean) {
    if (!preserveValue) {
      this.value = '';
    }
    this.books = [];
    this.availableNumbers = [];
    this.step = ReferencePickerState.Book;
    this.selectedBook = undefined;
    this.clearNumericState();
  }

  private emitReferences() {
    this.referencesChange.emit([...this.references]);
  }

  private addReferences(refs: BibleReference[]) {
    if (refs.length === 0) {
      return;
    }
    const room = Math.max(0, this.maxReferences - this.references.length);
    if (room <= 0) {
      return;
    }
    const toAdd = refs.slice(0, room);
    this.references = [...this.references, ...toAdd];
    this.emitReferences();
  }

  private getChapters(book: BibleBookInfo, startChapter = 1): number[] {
    return book.Chapters.filter((c) => c.Number >= startChapter).map((c) => c.Number);
  }

  private filterByPrefix(nums: number[], prefix: string): number[] {
    if (!prefix) {
      return nums;
    }
    return nums.filter((n) => n.toString().startsWith(prefix));
  }

  private loadChapters(book: BibleBookInfo) {
    this.availableNumbers = this.getChapters(book);
    this.step = ReferencePickerState.Chapter;
  }

  private loadVerses(chapter: BibleChapter, startVerse = 1) {
    const nums: number[] = [];
    for (let v = startVerse; v <= chapter.VerseCount; v++) {
      nums.push(v);
    }
    this.availableNumbers = nums;
    this.step = ReferencePickerState.Verse;
  }

  private setBook(book: BibleBookInfo, suffix: string) {
    this.selectedBook = book;
    this.books = [];
    if (!this.suppressBookCanonicalization) {
      this.value = suffix.length ? `${book.CanonicalName} ${suffix}` : book.CanonicalName;
    }
    this.clearNumericState();
    if (book.Chapters.length === 1) {
      this.startChapter = 1;
      this.loadVerses(book.Chapters[0]);
      this.syncSingleChapterSuffix(book, suffix);
    } else {
      this.loadChapters(book);
      this.syncMultiChapterSuffix(book, suffix);
    }
  }

  private splitMultiChapterSuffix(suffix: string): { chapterSeg: string; verseSeg: string | undefined } {
    const idx = suffix.indexOf(':');
    if (idx < 0) {
      return { chapterSeg: suffix, verseSeg: undefined };
    }
    return {
      chapterSeg: suffix.slice(0, idx),
      verseSeg: suffix.slice(idx + 1),
    };
  }

  private isIncompleteSuffix(suffix: string): boolean {
    const t = suffix.trimEnd();
    if (!t) {
      return true;
    }
    if (t.endsWith(':') || t.endsWith('-') || t.endsWith(',')) {
      return true;
    }
    return false;
  }

  private tryParseReferencesForSubmit(book: BibleBookInfo, suffix: string): BibleReference[] | null {
    if (book.Chapters.length > 1 && this.isIncompleteSuffix(suffix)) {
      return null;
    }
    if (book.Chapters.length === 1 && this.isIncompleteSuffix(suffix) && suffix.length > 0) {
      return null;
    }
    try {
      const refs = BibleReferencePicker.parser.getSingleReference(book, suffix);
      if (!refs.length) {
        return null;
      }
      return refs;
    } catch {
      return null;
    }
  }

  private syncSingleChapterSuffix(book: BibleBookInfo, suffix: string) {
    this.startChapter = 1;
    this.loadVerses(book.Chapters[0]);
    if (!suffix) {
      this.availableNumbers = this.createArray(1, book.Chapters[0].VerseCount);
      return;
    }
    try {
      BibleReferencePicker.parser.getSingleRawReference(book, suffix);
    } catch {
      this.availableNumbers = this.filterByPrefix(this.createArray(1, book.Chapters[0].VerseCount), suffix.replace(/\D/g, ''));
      return;
    }
    const digits = suffix.replace(/^[^\d]*/, '').split(/[-,]/)[0]?.replace(/\D/g, '') ?? '';
    this.availableNumbers = this.filterByPrefix(this.createArray(1, book.Chapters[0].VerseCount), digits);
  }

  private syncMultiChapterSuffix(book: BibleBookInfo, suffix: string) {
    if (!suffix.trim()) {
      this.clearNumericState();
      this.loadChapters(book);
      return;
    }

    const { chapterSeg, verseSeg } = this.splitMultiChapterSuffix(suffix);

    if (verseSeg === undefined) {
      this.step = ReferencePickerState.Chapter;
      const chDigits = chapterSeg.split(/[-,]/)[0]?.replace(/\D/g, '') ?? '';
      const allCh = this.getChapters(book);
      this.availableNumbers = this.filterByPrefix(allCh, chDigits);

      try {
        const raws = BibleReferencePicker.parser.getSingleRawReference(book, chapterSeg);
        const first = raws[0];
        const sc = first?.StartingChapter;
        if (Number.isFinite(sc) && sc > 0 && book.Chapters.some((c) => c.Number === sc)) {
          this.startChapter = sc;
        } else {
          this.startChapter = undefined;
        }
      } catch {
        this.startChapter = undefined;
      }
      return;
    }

    const chPart = chapterSeg.trim();
    let verseChapter = 1;
    try {
      const chRaws = BibleReferencePicker.parser.getSingleRawReference(book, chPart);
      const chRaw = chRaws[0];
      const sc = chRaw?.StartingChapter;
      if (!Number.isFinite(sc) || sc <= 0 || !book.Chapters.some((c) => c.Number === sc)) {
        return;
      }
      verseChapter = sc;
      this.startChapter = verseChapter;
    } catch {
      return;
    }

    const chObj = book.Chapters.find((c) => c.Number === verseChapter);
    if (!chObj) {
      return;
    }
    this.loadVerses(chObj);
    const vDigits = verseSeg.split(/[-,]/)[0]?.replace(/\D/g, '') ?? '';
    this.availableNumbers = this.filterByPrefix(this.createArray(1, chObj.VerseCount), vDigits);
  }

  private syncFromValue(full: string) {
    const t = full.trimStart();
    const match = this.longestBookMatch(t);
    if (!match) {
      this.selectedBook = undefined;
      this.step = ReferencePickerState.Book;
      this.books = this.filterBooksByQuery(t);
      this.availableNumbers = [];
      this.clearNumericState();
      return;
    }

    const suffix = t.slice(match.alias.length).trimStart();
    if (!this.selectedBook || this.selectedBook.Book !== match.book.Book) {
      this.setBook(match.book, suffix);
      return;
    }

    const book = match.book;

    if (book.Chapters.length === 1) {
      this.syncSingleChapterSuffix(book, suffix);
    } else {
      this.syncMultiChapterSuffix(book, suffix);
    }
  }

  private normalizeBookPrefixInValue(full: string, book: BibleBookInfo): string {
    const m = this.longestBookMatch(full);
    if (!m || m.book.Book !== book.Book) {
      return full;
    }
    const suffix = full.trimStart().slice(m.alias.length).trimStart();
    return suffix ? `${book.CanonicalName} ${suffix}` : book.CanonicalName;
  }

  handleTextChange(currentText: string, options?: { autocomplete?: boolean }) {
    const text = currentText.replace(/\s{2,}/g, ' ');
    if (!text.trim()) {
      this.resetReferenceBuilder();
      this.suppressBookCanonicalization = false;
      return;
    }
    this.value = text;
    this.syncFromValue(text);

    const auto = options?.autocomplete;
    if (auto && !this.suppressBookCanonicalization && this.step === ReferencePickerState.Book && text.trim()) {
      const list = this.filterBooksByQuery(text.trim());
      if (list.length === 1) {
        const b = list[0];
        this.value = this.normalizeBookPrefixInValue(text, b);
        this.syncFromValue(this.value);
      }
    }
    this.suppressBookCanonicalization = false;
  }

  textChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.handleTextChange(input.value);
  };

  private getChapterSegmentForRules(book: BibleBookInfo, suffix: string): string {
    if (book.Chapters.length === 1) {
      return '';
    }
    return this.splitMultiChapterSuffix(suffix).chapterSeg;
  }

  private getVerseSegmentForRules(book: BibleBookInfo, suffix: string): string {
    if (book.Chapters.length === 1) {
      return suffix;
    }
    return this.splitMultiChapterSuffix(suffix).verseSeg ?? '';
  }

  private hasVerseHyphen(book: BibleBookInfo, suffix: string): boolean {
    const v = this.getVerseSegmentForRules(book, suffix);
    return v.includes('-');
  }

  private hasChapterHyphen(book: BibleBookInfo, suffix: string): boolean {
    const c = this.getChapterSegmentForRules(book, suffix);
    return c.includes('-');
  }

  /** Reference suffix (after book name) for `full`, if `book` is the matched book. */
  private refSuffixForBook(full: string, book: BibleBookInfo): string {
    const t = full.trimStart();
    const m = this.longestBookMatch(t);
    if (!m || m.book.Book !== book.Book) {
      return '';
    }
    return t.slice(m.alias.length).trimStart();
  }

  /**
   * True when the chapter-only segment (before first `:`) matches at least one chapter,
   * including digit-prefix matches (e.g. "1" when chapters 1, 10, 11 exist).
   */
  private chapterSegmentHasValidMatch(book: BibleBookInfo, chapterSeg: string): boolean {
    const s = chapterSeg.trim();
    if (!s) {
      return false;
    }
    try {
      const raws = BibleReferencePicker.parser.getSingleRawReference(book, s);
      const sc = raws[0]?.StartingChapter;
      if (Number.isFinite(sc) && sc > 0 && book.Chapters.some((c) => c.Number === sc)) {
        return true;
      }
    } catch {
      /* fall through */
    }
    const head = s.split(/[-,]/)[0]?.trim() ?? '';
    if (/^\d+$/.test(head)) {
      return this.filterByPrefix(this.getChapters(book), head).length > 0;
    }
    return false;
  }

  /** Resolved starting chapter for the verse segment (first `:` only). */
  private startingChapterFromRefSuffix(book: BibleBookInfo, refSuffix: string): number | undefined {
    const chPart = this.splitMultiChapterSuffix(refSuffix).chapterSeg.trim();
    if (!chPart) {
      return undefined;
    }
    try {
      const raws = BibleReferencePicker.parser.getSingleRawReference(book, chPart);
      const sc = raws[0]?.StartingChapter;
      if (Number.isFinite(sc) && sc > 0 && book.Chapters.some((c) => c.Number === sc)) {
        return sc;
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }

  /**
   * Whether the verse token before a hyphen (prefix up to first `-` or comma) is valid for the chapter.
   */
  private versePrefixHasValidMatch(book: BibleBookInfo, chapterNumber: number, versePrefix: string): boolean {
    const head = versePrefix.split(/[-,]/)[0]?.trim() ?? '';
    if (!head || !/\d/.test(head)) {
      return false;
    }
    const chObj = book.Chapters.find((c) => c.Number === chapterNumber);
    if (!chObj) {
      return false;
    }
    const digits = head.replace(/\D/g, '');
    if (!digits) {
      return false;
    }
    try {
      const raws = BibleReferencePicker.parser.getSingleRawReference(book, `${chapterNumber}:${head}`);
      const sv = raws[0]?.StartingVerse;
      if (Number.isFinite(sv) && sv >= 1 && sv <= chObj.VerseCount) {
        return true;
      }
    } catch {
      /* fall through */
    }
    if (/^\d+$/.test(head.replace(/\s/g, ''))) {
      return this.filterByPrefix(this.createArray(1, chObj.VerseCount), digits).length > 0;
    }
    return false;
  }

  /**
   * Whether the typed book token is still growing toward a longer alias, exactly matches
   * an alias, or does not match any alias prefix.
   */
  private bookPrefixStatus(text: string): 'none' | 'prefix' | 'exact' {
    const t = text.trim().toLowerCase();
    if (!t) {
      return 'prefix';
    }
    let exact = false;
    let strictPrefix = false;
    for (const book of BibleBooks) {
      for (const alias of this.getBookAliases(book)) {
        const al = alias.toLowerCase();
        if (al === t) {
          exact = true;
        }
        if (al.startsWith(t) && al.length > t.length) {
          strictPrefix = true;
        }
      }
    }
    if (strictPrefix) {
      return 'prefix';
    }
    if (exact) {
      return 'exact';
    }
    return 'none';
  }

  private buildPriorValue(input: HTMLInputElement): string {
    const v = this.value;
    const start = input.selectionStart ?? v.length;
    const end = input.selectionEnd ?? v.length;
    return v.slice(0, start) + v.slice(end);
  }

  /**
   * `prior` is the value before the key is applied; `trial` is after. Using both avoids
   * treating a full alias match with empty suffix as "chapter mode" while the user is still
   * typing the last letters (e.g. "Gen" → "Genesis" or "Ge" → "Gen").
   */
  private isAllowedKeyForTrial(prior: string, trial: string, key: string): boolean {
    if (!/^[a-zA-Z0-9 :\-]$/.test(key)) {
      return false;
    }
    const tt = trial.trimStart();
    const pt = prior.trimStart();
    const match = this.longestBookMatch(tt);
    if (!match) {
      return /^[a-zA-Z0-9 ]$/.test(key);
    }

    const rawAfterAlias = tt.slice(match.alias.length);
    const refSuffix = rawAfterAlias.trimStart();
    const b = match.book;
    const priorRefSuffix = this.refSuffixForBook(pt, b);

    // Still typing letters that belong to the book name (longest alias is shorter than the full title).
    if (/[a-zA-Z]/.test(rawAfterAlias)) {
      return /^[a-zA-Z0-9 ]$/.test(key);
    }

    // Only whitespace between the matched alias and the reference — not in chapter/verse yet.
    if (refSuffix === '' && /^\s*$/.test(rawAfterAlias)) {
      const trialCore = tt.replace(/\s+$/, '');
      const priorWasPrefix = this.bookPrefixStatus(pt) === 'prefix';
      const trialStillPrefix = this.bookPrefixStatus(trialCore) === 'prefix';
      if (priorWasPrefix || trialStillPrefix) {
        return /^[a-zA-Z0-9 ]$/.test(key);
      }
      if (key === ' ') {
        return true;
      }
      if (b.Chapters.length === 1) {
        if (!/^[0-9-]$/.test(key)) {
          return false;
        }
        if (key === '-' && this.hasVerseHyphen(b, priorRefSuffix)) {
          return false;
        }
        if (key === '-' && !this.versePrefixHasValidMatch(b, 1, priorRefSuffix)) {
          return false;
        }
        return true;
      }
      if (!/^[0-9:\-]$/.test(key)) {
        return false;
      }
      const chSegPrior = this.getChapterSegmentForRules(b, priorRefSuffix);
      if ((key === ':' || key === '-') && !/\d/.test(chSegPrior)) {
        return false;
      }
      if (key === '-') {
        if (this.hasChapterHyphen(b, priorRefSuffix)) {
          return false;
        }
        const chOnly = this.splitMultiChapterSuffix(priorRefSuffix).chapterSeg;
        const startTok = chOnly.split('-')[0]?.trim() ?? '';
        if (!this.chapterSegmentHasValidMatch(b, startTok)) {
          return false;
        }
      }
      return true;
    }

    const suffix = refSuffix;

    if (b.Chapters.length === 1) {
      if (!/^[0-9-]$/.test(key)) {
        return false;
      }
      if (key === '-' && this.hasVerseHyphen(b, priorRefSuffix)) {
        return false;
      }
      if (key === '-' && !this.versePrefixHasValidMatch(b, 1, priorRefSuffix)) {
        return false;
      }
      return true;
    }

    // First colon: chapter must match; do this before verse-only rules (which disallow ':').
    if (key === ':') {
      const sp = this.splitMultiChapterSuffix(suffix);
      if (sp.verseSeg !== undefined && sp.verseSeg.length === 0) {
        return this.chapterSegmentHasValidMatch(b, sp.chapterSeg);
      }
      return false;
    }

    if (!suffix.includes(':')) {
      if (!/^[0-9:\-]$/.test(key)) {
        return false;
      }
      const chSegPrior = this.getChapterSegmentForRules(b, priorRefSuffix);
      if (key === '-' && !/\d/.test(chSegPrior)) {
        return false;
      }
      if (key === '-') {
        if (this.hasChapterHyphen(b, priorRefSuffix)) {
          return false;
        }
        const chOnly = this.splitMultiChapterSuffix(priorRefSuffix).chapterSeg;
        const startTok = chOnly.split('-')[0]?.trim() ?? '';
        if (!this.chapterSegmentHasValidMatch(b, startTok)) {
          return false;
        }
      }
      return true;
    }

    const verseSegPrior = this.getVerseSegmentForRules(b, priorRefSuffix);
    if (!/^[0-9-]$/.test(key)) {
      return false;
    }
    if (key === '-') {
      if (this.hasVerseHyphen(b, priorRefSuffix)) {
        return false;
      }
      const chNum = this.startingChapterFromRefSuffix(b, priorRefSuffix);
      if (chNum === undefined || !this.versePrefixHasValidMatch(b, chNum, verseSegPrior)) {
        return false;
      }
    }
    return true;
  }

  private buildTrialValue(input: HTMLInputElement, key: string): string {
    const v = this.value;
    const start = input.selectionStart ?? v.length;
    const end = input.selectionEnd ?? v.length;
    return v.slice(0, start) + key + v.slice(end);
  }

  private removeTrialRange(input: HTMLInputElement): string {
    const v = this.value;
    const start = input.selectionStart ?? v.length;
    const end = input.selectionEnd ?? v.length;
    if (start === end && start > 0) {
      return v.slice(0, start - 1) + v.slice(end);
    }
    return v.slice(0, start) + v.slice(end);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement;

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Escape') {
      this.suppressBookCanonicalization = false;
      this.resetReferenceBuilder();
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      this.suppressBookCanonicalization = true;
      const trial = this.removeTrialRange(input);
      if (this.selectedBook) {
        const m = this.longestBookMatch(trial.trimStart());
        if (!m || m.book.Book !== this.selectedBook.Book) {
          this.resetReferenceBuilder(true);
          this.value = trial;
          this.syncFromValue(this.value);
          event.preventDefault();
          input.value = this.value;
          this.suppressBookCanonicalization = false;
          return;
        }
      }
      return;
    }

    if (event.key === 'Tab') {
      this.suppressBookCanonicalization = false;
      this.runAutocomplete();
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ';') {
      this.suppressBookCanonicalization = false;
      this.runAutocomplete();
      this.trySubmitCurrentValue();
      event.preventDefault();
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    const prior = this.buildPriorValue(input);
    const trial = this.buildTrialValue(input, event.key);
    if (!this.isAllowedKeyForTrial(prior, trial, event.key)) {
      event.preventDefault();
    }
  };

  private runAutocomplete() {
    if (this.step === ReferencePickerState.Book) {
      const q = this.value.trim();
      const list = this.filterBooksByQuery(q);
      if (!list.length) {
        return;
      }
      const pick =
        list.find((b) => b.Name.toLowerCase() === q.toLowerCase()) ??
        list.find((b) => b.CanonicalName.toLowerCase() === q.toLowerCase()) ??
        list.sort((a, b) => a.CanonicalName.localeCompare(b.CanonicalName))[0];
      this.value = pick.CanonicalName + ' ';
      this.handleTextChange(this.value);
      return;
    }

    const book = this.selectedBook;
    if (!book) {
      return;
    }

    const t = this.value.trimStart();
    const m = this.longestBookMatch(t);
    if (!m) {
      return;
    }
    let suffix = t.slice(m.alias.length).trimStart();

    if (book.Chapters.length > 1 && this.step === ReferencePickerState.Chapter) {
      const nums = this.availableNumbers.length ? this.availableNumbers : this.getChapters(book);
      const chDigits = suffix.replace(/\D/g, '');
      const candidates = chDigits ? nums.filter((n) => n.toString().startsWith(chDigits)) : nums;
      if (candidates.length === 1) {
        const ch = candidates[0];
        this.value = `${book.CanonicalName} ${ch}:`;
        this.handleTextChange(this.value);
      }
      return;
    }

    if (this.step === ReferencePickerState.Verse) {
      const { chapterSeg, verseSeg } = this.splitMultiChapterSuffix(suffix);
      const vSeg = book.Chapters.length === 1 ? suffix : verseSeg ?? '';
      const vd = vSeg.replace(/\D/g, '');
      const chObj =
        book.Chapters.find((c) => c.Number === (this.startChapter ?? 1)) ?? book.Chapters[0];
      const nums = this.availableNumbers.length
        ? this.availableNumbers
        : this.createArray(1, chObj.VerseCount);
      const candidates = vd ? nums.filter((n) => n.toString().startsWith(vd)) : nums;
      if (candidates.length === 1) {
        const verse = candidates[0];
        if (book.Chapters.length === 1) {
          this.value = `${book.CanonicalName} ${verse}`;
        } else {
          this.value = `${book.CanonicalName} ${chapterSeg}:${verse}`;
        }
        this.handleTextChange(this.value);
      }
    }
  }

  private trySubmitCurrentValue() {
    const t = this.value.trim();
    const m = this.longestBookMatch(t);
    if (!m) {
      return;
    }
    const suffix = t.slice(m.alias.length).trimStart();
    const refs = this.tryParseReferencesForSubmit(m.book, suffix);
    if (!refs?.length) {
      return;
    }
    this.addReferences(refs);
    this.resetReferenceBuilder();
  }

  private isValidPartialSuffix(book: BibleBookInfo, suffix: string): boolean {
    if (!suffix.trim()) {
      return true;
    }
    try {
      const raws = BibleReferencePicker.parser.getSingleRawReference(book, suffix);
      if (raws.length === 0) {
        if (suffix.endsWith(':')) {
          const chPart = suffix.slice(0, -1).trim();
          if (!chPart) {
            return false;
          }
          const chRaws = BibleReferencePicker.parser.getSingleRawReference(book, chPart);
          const sc = chRaws[0]?.StartingChapter;
          return Number.isFinite(sc) && book.Chapters.some((c) => c.Number === sc);
        }
        return /^[\d\-]+$/.test(suffix.trim());
      }
      const sc = raws[0]?.StartingChapter;
      if (sc != null) {
        if (!Number.isFinite(sc) || !book.Chapters.some((c) => c.Number === sc)) {
          return false;
        }
      }
      if (suffix.includes(':')) {
        const chPart = suffix.split(':')[0]?.trim() ?? '';
        if (!chPart) {
          return false;
        }
        const chRaws = BibleReferencePicker.parser.getSingleRawReference(book, chPart);
        const scOnly = chRaws[0]?.StartingChapter;
        if (!Number.isFinite(scOnly) || !book.Chapters.some((c) => c.Number === scOnly)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private pasteOutcome(text: string): { kind: 'complete'; refs: BibleReference[] } | { kind: 'partial'; value: string } | { kind: 'reject' } {
    const trimmed = text.trim();
    if (!trimmed) {
      return { kind: 'reject' };
    }

    const segments = trimmed.includes(';')
      ? trimmed.split(';').map((s) => s.trim()).filter(Boolean)
      : [trimmed];

    if (segments.length > 1) {
      const refs: BibleReference[] = [];
      for (const segment of segments) {
        const m = this.longestBookMatch(segment);
        if (!m) {
          return { kind: 'reject' };
        }
        const suffix = segment.slice(m.alias.length).trimStart();
        const parsed = this.tryParseReferencesForSubmit(m.book, suffix);
        if (!parsed?.length) {
          return { kind: 'reject' };
        }
        refs.push(...parsed);
      }
      return { kind: 'complete', refs };
    }

    const single = segments[0];
    const m = this.longestBookMatch(single);
    if (!m) {
      return { kind: 'reject' };
    }
    const suffix = single.slice(m.alias.length).trimStart();
    const complete = this.tryParseReferencesForSubmit(m.book, suffix);
    if (complete?.length) {
      return { kind: 'complete', refs: complete };
    }
    if (!suffix) {
      return { kind: 'partial', value: `${m.book.CanonicalName} ` };
    }
    if (!this.isValidPartialSuffix(m.book, suffix)) {
      return { kind: 'reject' };
    }
    return { kind: 'partial', value: `${m.book.CanonicalName} ${suffix}` };
  }

  handlePaste = (event: ClipboardEvent) => {
    const cd = event.clipboardData;
    if (!cd) {
      return;
    }
    const text = cd.getData('text/plain');
    if (!text) {
      return;
    }
    const outcome = this.pasteOutcome(text);
    if (outcome.kind === 'reject') {
      event.preventDefault();
      return;
    }
    if (outcome.kind === 'complete') {
      event.preventDefault();
      this.addReferences(outcome.refs);
      this.resetReferenceBuilder();
      return;
    }
    event.preventDefault();
    this.handleTextChange(outcome.value);
  };

  createArray = (start: number, end: number): number[] => {
    const array: number[] = [];
    for (let i = start; i <= end; i++) {
      array.push(i);
    }
    return array;
  };

  selectBook = (selectedBook: BibleBookInfo, addSpace?: boolean) => {
    this.value = selectedBook.CanonicalName + (addSpace ? ' ' : '');
    this.handleTextChange(this.value);
  };

  selectNumber = (selectedNumber: number) => {
    const book = this.selectedBook;
    if (!book) {
      return;
    }
    if (this.step === ReferencePickerState.Chapter) {
      this.value = `${book.CanonicalName} ${selectedNumber}:`;
      this.handleTextChange(this.value);
      return;
    }
    if (this.step === ReferencePickerState.Verse) {
      const t = this.value.trimStart();
      const m = this.longestBookMatch(t);
      if (!m) {
        return;
      }
      let suffix = t.slice(m.alias.length).trimStart();
      if (book.Chapters.length === 1) {
        this.value = `${book.CanonicalName} ${selectedNumber}`;
        this.handleTextChange(this.value);
        return;
      }
      const { chapterSeg } = this.splitMultiChapterSuffix(suffix);
      this.value = `${book.CanonicalName} ${chapterSeg}:${selectedNumber}`;
      this.handleTextChange(this.value);
    }
  };

  removeReference(reference: BibleReference) {
    this.references = this.references.filter((ref) => ref.Canonical !== reference.Canonical);
    this.emitReferences();
  }

  render() {
    return (
      <Host>
        <div class="search-box">
          <div class="reference-box">
            {this.references.map((reference) => (
              <span class="reference">
                {reference.Canonical}&nbsp;
                <span class="clickable" onClick={() => this.removeReference(reference)}>
                  | &nbsp; &times; &nbsp;
                </span>
              </span>
            ))}
          </div>
          <div class="row">
            <input
              type="text"
              name="input"
              value={this.value}
              id="input"
              placeholder="Scripture Reference"
              autocomplete="off"
              onInput={(event) => this.textChange(event)}
              onPaste={(event) => this.handlePaste(event)}
              onKeyDown={(event) => this.handleKeyDown(event)}
            />
          </div>
          <div class={{ show: this.books.length > 0, 'result-box': true }}>
            <ul>
              <li class="listheader">Select Book</li>
              {this.books.map((item) => (
                <li onClick={() => this.selectBook(item, true)}>{item.CanonicalName}</li>
              ))}
            </ul>
          </div>
          <div class={{ show: this.availableNumbers.length > 0, 'result-box': true }}>
            <ul>
              {this.step === ReferencePickerState.Chapter ? (
                <li class="listheader">Select Chapter</li>
              ) : this.step === ReferencePickerState.Verse ? (
                <li class="listheader">Select Verse</li>
              ) : null}
              {this.availableNumbers.map((number) => (
                <li onClick={() => this.selectNumber(number)}>{number}</li>
              ))}
            </ul>
          </div>
        </div>
      </Host>
    );
  }
}
