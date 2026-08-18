import { Component, Host, State, Prop, Event, EventEmitter, h, Listen, Element } from '@stencil/core';
import { BibleBookInfo, BibleBooks, BibleChapter } from '@soli-deo-gloria-software/bible-books'
import { BibleParser, BibleReference, RawBibleParseResult} from '@soli-deo-gloria-software/bible-reference-finder'
import { ReferencePickerState } from '../../utils/enums';

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  styleUrls: ['../../shared-styles.css'],
  scoped: true,
})
export class BibleReferencePicker {
  private _parser = new BibleParser();
  @State() value: string = '';
  @State() books: BibleBookInfo[] = [];
  @State() isOpen: boolean = false;
  @State() step: ReferencePickerState = ReferencePickerState.Book;
  @State() availableNumbers: number[] = [];
  @Prop() maxNumberOfReferences: number = 1;
  @Prop() allowWholeBookSubmission: boolean = false;

  allNumbersForStep: number[] = [];
  selectedBook: BibleBookInfo | undefined;
  allowedRegex: RegExp | undefined;
  alphaNumericRegex: RegExp = /[A-Za-z0-9: \-]/
  incompleteReference: RawBibleParseResult | undefined;
  inputElement!: HTMLElement;
  @State() references: BibleReference[] = [];

  @Event() referencesUpdated!: EventEmitter<BibleReference[]>;

  @Element() thisElement!: HTMLElement;

  @Listen('click', { target: 'window' })
  handleWindowClick(ev: MouseEvent) {
    const path = ev.composedPath();

    const clickedInside = path.includes(this.thisElement);

    if (!clickedInside && this.isOpen) {
      this.isOpen = false;
      console.log('Clicked outside the component!');
    }
  }
  
  handlePaste = (event: ClipboardEvent) => {
    if (this.references?.length >= this.maxNumberOfReferences) {
      event.preventDefault();
    }
    
    console.log('paste event' + event.clipboardData?.types)
    if (event.clipboardData == undefined) {
      return;
    }

    let text = event.clipboardData.getData('text/plain');

    if (!text) {
      return;
    }

    let referenceFound = this.handleReferenceSubmit(text);

    if (referenceFound) {
      event.preventDefault();
      this.resetReferenceBuilder();
    }
  }

  handleReferenceSubmit = (text: string): boolean => {
    let parsed = this._parser.parse(text);
    if (!parsed || parsed.length == 0) {
      if (this.allowWholeBookSubmission && this.selectedBook) {
        let partial = this.getPartialReference();
        parsed = [{ //TODO: Move logic to allow whole book references into parser package.
          ProcessedText: text,
          BibleReferences: [new BibleReference(partial!)],
          SourceIndex: 0,
          InstanceIndexes: [],
          GetFormattedText: () => `${text}`
        }]
      } else {
        return false;
      }
    }

    let referenceAdded: boolean = false;
    parsed.forEach(collection => {
      referenceAdded = this.addReferences(collection.BibleReferences)
    })

    if (!referenceAdded) {
      this.value = text;
    }

    return referenceAdded;
  }

  addReferences = (newReferences: BibleReference[]) : boolean => {
    let references: BibleReference[] = [...this.references]

    newReferences.forEach(reference => {
      if (references.length < this.maxNumberOfReferences) {
        if (!references.some(ref => ref.Canonical == reference.Canonical))
        references.push(reference);
      }
    })

    let count = references.length;
    if (count > 0) {
      this.references = [...references];
      if (count >= this.maxNumberOfReferences){
        this.isOpen = false;
      }
    }

    this.referencesUpdated.emit(this.references);

    return count > 0;
  }

  textChange = (event: InputEvent) => {
    let input = (event.target as any).value;
    this.value = input;
    this.handleTextChange(input.toLowerCase());
  }

  onFocus = () => {
    if (this.value) {
      this.handleTextChange(this.value);
    } else {
      this.books = [...BibleBooks];
    }
    this.isOpen = true;
  }

  handleTextChange(currentText: string, autocomplete?: boolean) {
    if (!currentText) {
      this.resetReferenceBuilder();
    }

    currentText = currentText.toLowerCase().replaceAll('  ', ' ').trimEnd();
    if (this.step == ReferencePickerState.Book){
      if (currentText && currentText.length > 0) {
        this.books = BibleBooks.filter(book => book.Name.toLowerCase().includes(currentText));
        if (this.books.length == 1){
          let exactMatch= this.books[0].Name.toLowerCase() == currentText
          if (autocomplete || exactMatch) {
            this.selectBook(this.books[0], !exactMatch);
          }
        }
      }
    } else {
      const partial = this.getPartialReference();
      if (!partial) {
        return;
      }

      this.incompleteReference = partial;
      this.step = this.resolveStateFromPartial(partial);
      console.log(`Resolved state: ${this.step}`)
      this.refreshStepLists(partial);
    }
  }

  filterNumbers = (text: string, sourceNumbers?: number[]):number[] => {
    sourceNumbers = sourceNumbers ?? [...this.allNumbersForStep]
    text = text.trim();
    if (!text) {
      return sourceNumbers;
    }
    return sourceNumbers?.filter(num => num.toString().includes(text)) ?? [];
  }

  handleKeyPress = (event: KeyboardEvent) => {
    if (this.references?.length >= this.maxNumberOfReferences) {
      event.preventDefault();
    }

    if (event.key == "Backspace") { // Handle chapter/verse deletion
      if (this.selectedBook && this.value.length < this.selectBook.name.length) {
        if (this.value.length < this.selectBook.name.length) {
          this.resetReferenceBuilder(true);
        } else {
          if (!this.value.includes('-')) {
            this.incompleteReference!.setEnding(undefined, undefined);
          } else if (!this.value.includes(":") && this.selectedBook.Chapters.length > 1) {
            this.incompleteReference!.StartingVerse = undefined;
            this.incompleteReference!.StartingChapter = undefined;
            this.loadChapters(this.selectedBook, 1, ReferencePickerState.StartingChapter);
          }
        }
      }
    }
    else if (event.key == 'Escape') { //Cancel entry
      this.resetReferenceBuilder();
      event.preventDefault();
    } else if (event.altKey && event.key === 'ArrowLeft') {
      if (this.canStepBack()) {
        event.preventDefault();
        this.handleStepBack();
      }
    } else if (event.key == "Tab") { //Complete current step
      if (this.value) {
        this.handleTextChange(this.value, true);
        event.preventDefault();
      } else {
        return;
      }
    } else if (event.key == "Enter" || event.key == ";") { // Parse reference
      if (this.handleReferenceSubmit(this.value)) {
        event.preventDefault();
        this.resetReferenceBuilder();
      }
    } else if (!this.alphaNumericRegex.test(event.key)) {
      console.log('failed valid key test')
      event.preventDefault();
      // if (this.allowedRegex && !this.allowedRegex.test(event.key)){ //Block text change event.
      //  event.preventDefault(); //TODO: Invalid text indicator.
      // }
    }
  }

  resetReferenceBuilder = (preserveValue?: boolean) => {
      if (!preserveValue) {
        this.value = '';
      }
      this.books = [...BibleBooks];
      this.availableNumbers = [];
      this.allNumbersForStep = [];
      this.step = ReferencePickerState.Book;
      this.selectedBook = undefined;
      this.allowedRegex = undefined;
      this.incompleteReference = undefined;
  }

  handleClearInput = () => {
    this.resetReferenceBuilder();
    this.inputElement?.focus();
  }

  private isChapterStep(step: ReferencePickerState): boolean {
    return step === ReferencePickerState.StartingChapter || step === ReferencePickerState.EndingChapter;
  }

  private isEndingStep(step: ReferencePickerState): boolean {
    return step === ReferencePickerState.EndingChapter || step === ReferencePickerState.EndingVerse;
  }

  private canStepBack(): boolean {
    return this.selectedBook != undefined && this.step !== ReferencePickerState.Book;
  }

  handleStepBack = () => {
    if (!this.canStepBack() || !this.selectedBook) {
      return;
    }

    const partial = this.getPartialReference();
    if (!partial) {
      this.resetReferenceBuilder();
      this.inputElement?.focus();
      this.isOpen = true;
      return;
    }

    const book = this.selectedBook;
    const singleChapter = book.Chapters.length === 1;

    switch (this.step) {
      case ReferencePickerState.StartingChapter:
        this.resetReferenceBuilder();
        break;
      case ReferencePickerState.StartingVerse:
        if (singleChapter) {
          this.resetReferenceBuilder();
        } else {
          partial.StartingChapter = undefined;
          partial.StartingVerse = undefined;
          this.step = ReferencePickerState.StartingChapter;
          this.loadChapters(book, 1, ReferencePickerState.StartingChapter);
        }
        break;
      case ReferencePickerState.EndingChapter:
        partial.setEnding(undefined, undefined);
        if (partial.StartingVerse != undefined) {
          partial.StartingVerse = undefined;
          this.step = ReferencePickerState.StartingVerse;
          this.loadVerses(book.Chapters[(partial.StartingChapter ?? 1) - 1], 1, ReferencePickerState.StartingVerse);
        } else {
          this.step = ReferencePickerState.StartingChapter;
          this.loadChapters(book, 1, ReferencePickerState.StartingChapter);
        }
        break;
      case ReferencePickerState.EndingVerse:
        if (partial.EndingChapter != undefined && partial.EndingChapter !== partial.StartingChapter) {
          partial.EndingChapter = undefined; //TODO: fix setEnding behavior in package.
          this.step = ReferencePickerState.EndingChapter;
          partial.setEnding(undefined, undefined);
          this.loadChapters(book, partial.StartingChapter! + 1, ReferencePickerState.EndingChapter);
        } else if (partial.StartingVerse != undefined) {
          this.step = ReferencePickerState.StartingVerse;
          partial.StartingVerse = undefined;
          partial.setEnding(undefined, undefined);
          this.loadVerses(book.Chapters[(partial.StartingChapter ?? 1) - 1], 1, ReferencePickerState.StartingVerse);
        } else if (partial.StartingChapter != undefined) {
          partial.StartingVerse = undefined; //TODO: evaluate this code block - shouldn't happen.
          partial.setEnding(undefined, undefined);
          this.loadChapters(book, 1, ReferencePickerState.StartingChapter);
        } else {
          this.resetReferenceBuilder();
        }
        break;
    }

    if (this.step !== ReferencePickerState.Book) {
      this.incompleteReference = partial;
      this.value = partial.toString();
    } else {
      this.incompleteReference = undefined;
    }

    this.inputElement?.focus();
    this.isOpen = true;
  }

  selectBook = (selectedBook: BibleBookInfo, addSpace?: boolean) => {
    console.log('selected: ' + selectedBook.CanonicalName)
    this.value = selectedBook.CanonicalName;
    if (addSpace) {
      this.value += ' ';
    }
    this.selectedBook = selectedBook;

    if (selectedBook.Chapters.length == 1){
      this.incompleteReference!.StartingChapter = 1;
      this.loadVerses(selectedBook.Chapters[0], 1, ReferencePickerState.StartingVerse);
    } else {
      this.loadChapters(selectedBook, undefined, ReferencePickerState.StartingChapter);
    }
    this.books = [];
  }

  loadChapters = (book: BibleBookInfo, startChapter?: number, step: ReferencePickerState = ReferencePickerState.StartingChapter) => {
    this.allNumbersForStep = this.getChapters(book, startChapter);
    this.availableNumbers = [...this.allNumbersForStep];
    this.step = step;
    this.allowedRegex = new RegExp(/^[\d:\-]$/g);
  }

  getChapters = (book: BibleBookInfo, startChapter?: number) : number[] => {
    startChapter ??= 1;
    return book.Chapters.filter(chapter => chapter.Number >= startChapter).map(chapter => chapter.Number);
  }

  loadVerses = (chapter: BibleChapter, startVerse?: number, step: ReferencePickerState = ReferencePickerState.StartingVerse) => {
    startVerse ??= 1;
    this.allNumbersForStep = this.createArray(startVerse, chapter.VerseCount);
    this.availableNumbers = [...this.allNumbersForStep]
    this.step = step;
    this.allowedRegex = new RegExp(/^[\d\-]$/g);
  }

  createArray = (start: number, end: number): number[] => {
    let array: number[] = [];
    for (let i = start; i <= end; i++){
      array.push(i);
    }
    return array;
  }

  selectNumber = (selectedNumber: number) => {
    let partial = this.getPartialReference();
    if (!partial) {
      return;
    }

    switch (this.step) {
      case ReferencePickerState.StartingChapter:
        partial.StartingChapter = selectedNumber;
        this.loadVerses(this.selectedBook!.Chapters[selectedNumber - 1], 1, ReferencePickerState.StartingVerse);
        break;
      case ReferencePickerState.StartingVerse:
        partial.StartingVerse = selectedNumber;
        break;
      case ReferencePickerState.EndingChapter:
        partial.EndingChapter = selectedNumber;
        this.loadVerses(
          this.selectedBook!.Chapters[selectedNumber - 1],
          partial.StartingVerse ?? 1,
          ReferencePickerState.EndingVerse
        );
        break;
      case ReferencePickerState.EndingVerse:
        partial.EndingVerse = selectedNumber;
        let full = new BibleReference(partial);
        if (this.addReferences([full])) {
          this.resetReferenceBuilder();
        }
        return;
    }

    this.value = partial.toString();
    this.step = this.resolveStateFromPartial(partial);
  }

  private resolveStateFromPartial(partial: RawBibleParseResult): ReferencePickerState {
    const singleChapter = partial.Book.Chapters.length === 1;

    if (singleChapter) {
      if (!partial.StartingVerse) {
        return ReferencePickerState.StartingVerse;
      }
      if (this.value.endsWith('-') || partial.EndingVerse != undefined) {
        return ReferencePickerState.EndingVerse;
      }
      return ReferencePickerState.StartingVerse;
    }

    if (!partial.StartingChapter) {
      return ReferencePickerState.StartingChapter;
    }

    if (partial.EndingChapter != undefined && partial.EndingChapter !== partial.StartingChapter) {
      return ReferencePickerState.EndingVerse;
    }

    if (!partial.StartingVerse) {
      if (this.value.endsWith(':')) {
        return ReferencePickerState.StartingVerse;
      }
      if (this.value.endsWith('-')) {
        return ReferencePickerState.EndingChapter;
      }
      return ReferencePickerState.StartingChapter;
    }

    if (this.value.endsWith('-') || partial.EndingVerse != undefined) {
      return ReferencePickerState.EndingVerse;
    }

    return ReferencePickerState.StartingVerse;
  }

  private getActiveNumberSegment(partial: RawBibleParseResult): string {
    let segment: number | undefined;

    switch (this.step) {
      case ReferencePickerState.StartingChapter:
        segment = partial.StartingChapter;
        break;
      case ReferencePickerState.StartingVerse:
        segment = partial.StartingVerse;
        break;
      case ReferencePickerState.EndingChapter:
        segment = partial.EndingChapter;
        break;
      case ReferencePickerState.EndingVerse:
        segment = partial.EndingVerse;
        break;
      default:
        return '';
    }

    if (segment == null || segment <= 0) {
      return '';
    }

    return segment.toString();
  }

  private refreshStepLists(partial: RawBibleParseResult) {
    const book = this.selectedBook!;

    switch (this.step) {
      case ReferencePickerState.StartingChapter:
        this.loadChapters(book, 1, ReferencePickerState.StartingChapter);
        break;
      case ReferencePickerState.StartingVerse:
        this.loadVerses(book.Chapters[(partial.StartingChapter ?? 1) - 1], 1, ReferencePickerState.StartingVerse);
        break;
      case ReferencePickerState.EndingChapter:
        this.loadChapters(book, (partial.StartingChapter ?? 1) + 1, ReferencePickerState.EndingChapter);
        break;
      case ReferencePickerState.EndingVerse: {
        const endingChapter = partial.EndingChapter != undefined && partial.EndingChapter !== partial.StartingChapter
          ? partial.EndingChapter
          : partial.StartingChapter!;
        const startVerse = partial.EndingChapter != undefined && partial.EndingChapter !== partial.StartingChapter
          ? (partial.StartingVerse ?? 1)
          : (partial.StartingVerse ?? 0) + 1;
        this.loadVerses(book.Chapters[endingChapter - 1], startVerse, ReferencePickerState.EndingVerse);
        break;
      }
    }

    const filtered = this.filterNumbers(this.getActiveNumberSegment(partial));
    if (filtered.length > 0) {
      this.availableNumbers = [...filtered];
    }
  }

  private getPartialReference = () : RawBibleParseResult | undefined => {
    if (!this.selectedBook) {
      return undefined;
    }

    let nonBookSegment = this.value.toLowerCase().replace(this.selectedBook?.CanonicalName.toLowerCase() ?? '', '').trimStart();

    try {
      let partial = this._parser.getSingleRawReference(this.selectedBook!, nonBookSegment);
      if (!partial || partial.length == 0) {
        return undefined;
      }

      return partial[0];
    } catch {
      // Intermediate input such as "1:6-2" can throw before the ending chapter verse is complete ("1:6-2:5").
      return undefined;
    }
  }

  private canSelectEndingChapter(partial: RawBibleParseResult | undefined): boolean {
    if (!partial || !this.selectedBook || this.step !== ReferencePickerState.EndingVerse) {
      return false;
    }

    if (partial.Book.Chapters.length === 1) {
      return false;
    }

    if (partial.EndingChapter != undefined && partial.EndingChapter !== partial.StartingChapter) {
      return false;
    }

    const startingChapter = partial.StartingChapter ?? 1;
    return startingChapter < partial.Book.Chapters.length;
  }

  selectEndingChapter = () => {
    const partial = this.getPartialReference();
    if (!partial || !this.selectedBook || !this.canSelectEndingChapter(partial)) {
      return;
    }

    partial.setEnding(undefined, undefined);
    this.incompleteReference = partial;
    this.value = partial.toString();
    this.loadChapters(this.selectedBook, (partial.StartingChapter ?? 1) + 1, ReferencePickerState.EndingChapter);
    this.isOpen = true;
  }

  private preventInputBlur = (event: MouseEvent) => {
    event.preventDefault();
  }

  removeReference(reference: BibleReference){
    this.references = this.references.filter(ref => ref.Canonical != reference.Canonical);
    this.referencesUpdated.emit(this.references);
  }

  useWholeChapter = () => {
    console.log('useWholeChapter');
    let input = this.value;

    if (input.endsWith(':')) {
      input = input.substring(0, input.length - 1)
      this.value = input;
    }

    if (this.isEndingStep(this.step)){
      this.handleReferenceSubmit(input);
      this.resetReferenceBuilder();
    }
    else {
      if (!input.endsWith('-')) {
        input += '-';
        this.value = input;
      } 
      console.log(`calling handler with input: ${input}`);
      this.handleTextChange(input);
    }

    console.log(`end of use whole chapter, current state: ${this.step}`)
  }

  render() {
    return (
      <Host>
        <div class="search-box">
          <div class="flex">
            <input type="text" name="input" 
              ref={(el) => (this.inputElement = el as HTMLInputElement)}
              value={this.value} 
              id="input" 
              placeholder="Scripture Reference" 
              autocomplete="off" 
              onInput={(event) => this.textChange(event)} 
              onPaste={(event) => this.handlePaste(event)} 
              onKeyDown={(event) => this.handleKeyPress(event)}
              disabled={(this.references?.length ?? 0) >= this.maxNumberOfReferences}
              onFocus={() => this.onFocus()}
            />
            <multiselect-results
              items={this.references}
              itemLabel="reference"
              onItemRemoved={(event) => this.removeReference(event.detail)}
            />
          </div>
          <div class={{'show': this.isOpen, 'result-box':true}}>
            <ul class={{'hide': this.value == '', 'listheader': true}}>
              <li class="flex">
                {this.canStepBack() && (
                  <i
                    class="icon caret-left bg-secondary clickable"
                    title="Back (Alt+←)"
                    onClick={() => this.handleStepBack()}
                  ></i>
                )}
                <span class="flex-1">{this.value}</span>
                <i class="icon circle-x bg-secondary clickable" title="clear" onClick={() => this.handleClearInput()}></i>
                <i class="icon circle-check bg-success clickable" title="submit" onClick={() => {
                  this.handleReferenceSubmit(this.value);
                  this.resetReferenceBuilder();
                  }}
                ></i>
              </li>
            </ul>
            <div class={{'hide' : this.step != ReferencePickerState.Book}}>
              <ul class="listheader"><li>Select Book</li></ul>
              <ul>
                {this.books.map((item) => {
                  return <li onMouseDown={(event) => this.preventInputBlur(event)} onClick={() => {
                    this.selectBook(item, true);
                    this.inputElement.focus();
                  }}>{item.CanonicalName}</li>
                })}
              </ul>
            </div>
            <div class={{'hide': this.availableNumbers.length <= 0}}>
              <ul>
                {
                  this.step === ReferencePickerState.StartingVerse ?  <li onMouseDown={(event) => this.preventInputBlur(event)} onClick={() => {
                    this.useWholeChapter();
                    if (this.isOpen) {
                      this.inputElement.focus();
                    }
                  }}>Use Entire Chapter</li> : ''
                }
                {
                  this.canSelectEndingChapter(this.getPartialReference()) ? <li onMouseDown={(event) => this.preventInputBlur(event)} onClick={() => {
                    this.selectEndingChapter();
                  }}>Select Ending Chapter</li> : ''
                }
                {
                  this.availableNumbers.map((number) => {
                    return <li onMouseDown={(event) => this.preventInputBlur(event)} onClick={() => {
                      this.selectNumber(number);
                      if (this.isOpen) {
                        this.inputElement.focus();
                      }
                    }}>{this.isChapterStep(this.step) ? 'Chapter' : 'Verse'} {number}</li>
                  })
                }
              </ul>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
