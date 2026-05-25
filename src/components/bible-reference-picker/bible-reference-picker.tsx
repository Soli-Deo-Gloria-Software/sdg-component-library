import { Component, Host, State, Prop, Event, EventEmitter, h } from '@stencil/core';
import { BibleBookInfo, BibleBooks, BibleChapter } from '@soli-deo-gloria-software/bible-books'
import { BibleParser, BibleReference, RawBibleParseResult} from '@soli-deo-gloria-software/bible-reference-finder'
import { ReferencePickerState } from '../../utils/enums';

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  shadow: true,
})
export class BibleReferencePicker {
  private _parser = new BibleParser();
  @State() value: string = '';
  @State() books: BibleBookInfo[] = [];
  @State() step: ReferencePickerState = ReferencePickerState.Book;
  @State() availableNumbers: number[] = [];
  @Prop() maxNumberOfReferences:number = 1;
  selectedBook: BibleBookInfo | undefined;
  allowedRegex: RegExp | undefined;
  alphaNumericRegex: RegExp = /[A-Za-z0-9: \-]/
  incompleteReference: RawBibleParseResult | undefined;
  inputElement!: HTMLElement;
  @State() references: BibleReference[] = [];
  isEnd: boolean = false;

  @Event() referencesUpdated!: EventEmitter<BibleReference[]>;

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
    if (!parsed) {
      return false;
    }

    let references: BibleReference[] = [...this.references]
    parsed.forEach(collection => {
      collection.BibleReferences.forEach(reference => {
        if (references.length < this.maxNumberOfReferences) {
          references.push(reference);
        }
      })
    })

    if (references.length > 0) {
      this.references = [...references];
    } else {
      this.value = text;
    }

    this.referencesUpdated.emit(this.references);

    return this.references.length > 0;
  }

  textChange = (event: InputEvent) => {
    let input = (event.target as any).value;
    this.value = input;
    this.handleTextChange(input.toLowerCase());
  }

  handleTextChange(currentText: string, autocomplete?: boolean) {
    if (!currentText) {
      this.resetReferenceBuilder();
    }

    currentText = currentText.toLowerCase().replaceAll('  ', ' ').trimEnd();
    if (this.step == ReferencePickerState.Book){
      if (currentText && currentText.length > 1) {
        this.books = BibleBooks.filter(book => book.Name.toLowerCase().includes(currentText));
        if (this.books.length == 1){
          let exactMatch= this.books[0].Name.toLowerCase() == currentText
          if (autocomplete || exactMatch) {
            this.selectBook(this.books[0], !exactMatch);
          }
        }
      }
    } else {
      let nonBookSegment = currentText.replace(this.selectedBook?.CanonicalName.toLowerCase() ?? '', '').trimStart();
      this.incompleteReference = this._parser.getSingleRawReference(this.selectedBook!, nonBookSegment)[0];
      if (this.incompleteReference.StartingChapter) {
        if (!this.incompleteReference.StartingVerse) {
          if (this.value.endsWith(":")) {
            this.loadVerses(this.selectedBook!.Chapters[this.incompleteReference.StartingChapter-1])
          } else if (this.value.endsWith("-")){
            this.isEnd = true;
            this.loadChapters(this.selectedBook!, this.incompleteReference.StartingChapter + 1);
          }
        } else {
          //Verse is set here.
          if (this.value.endsWith("-")){
            this.isEnd = true;
            this.loadVerses(this.selectedBook!.Chapters[this.incompleteReference.StartingChapter-1], this.incompleteReference.StartingVerse + 1)
          }
        }
      } 
    }
  }

  filterNumbers = (text: string, sourceNumbers: number[]):number[] => {
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
            this.loadChapters(this.selectedBook);
            this.step = ReferencePickerState.Chapter;
          }
        }
      }
    }
    else if (event.key == 'Escape') { //Cancel entry
      this.resetReferenceBuilder();
      event.preventDefault();
    } else if (event.key == "Tab") { //Complete current step
      this.handleTextChange(this.value, true);
      event.preventDefault();
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
      this.books = [];
      this.availableNumbers = [];
      this.step = ReferencePickerState.Book;
      this.selectedBook = undefined;
      this.allowedRegex = undefined;
      this.incompleteReference = undefined;
      this.isEnd = false;
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
      this.loadVerses(selectedBook.Chapters[0]);
    } else {
      this.loadChapters(selectedBook);
    }
    this.books = [];
  }

  loadChapters = (book: BibleBookInfo, startChapter?: number) => {
    this.availableNumbers = this.getChapters(book, startChapter)
    this.step = ReferencePickerState.Chapter;
    // Think about number of digits allowed. For instance, most chapters only have double digit chapterss and none have 4 digits, so 1111 is invalid...
    this.allowedRegex = new RegExp(/^[\d:\-]$/g); //Untested: only allow numbers optionally ending with : or -.
  }

  getChapters = (book: BibleBookInfo, startChapter?: number) : number[] => {
    startChapter ??= 1;
    return book.Chapters.filter(chapter => chapter.Number >= startChapter).map(chapter => chapter.Number);
  }

  loadVerses = (chapter: BibleChapter, startVerse?: number) => {
    startVerse ??= 1;
    this.availableNumbers = this.createArray(startVerse, chapter.VerseCount);
    this.step = ReferencePickerState.Verse;
    // Think about number of digits allowed. For instance, most chapters only have double digit versess and none have 4 digits, so 1111 is invalid...
    this.allowedRegex = new RegExp(/^[\d\-]$/g); //Untested: only allow numbers optionally ending with a dash for a range.
  }

  createArray = (start: number, end: number): number[] => {
    let array: number[] = [];
    for (let i = start; i <= end; i++){
      array.push(i);
    }
    return array;
  }

  selectNumber = (selectedNumber: number) => {
    this.value += selectedNumber.toString();
    if (this.step == ReferencePickerState.Chapter) {
      let chapter = this.selectedBook!.Chapters.find(ch => ch.Number == selectedNumber);
      this.loadVerses(chapter!);
    } //TODO: Verses.
  }

  removeReference(reference: BibleReference){
    this.references = this.references.filter(ref => ref.Canonical != reference.Canonical);
  }

  render() {
    return (
      <Host>
        <div class="search-box">
          <div class="reference-box">
            { this.references.map(reference => {
              return <span class="reference">{reference.Canonical} &nbsp; <span class="clickable" onClick={() => this.removeReference(reference)}>| &nbsp; &times; &nbsp;</span></span>
            })}
          </div>
          <div class="row">
              <input type="text" name="input" 
                ref={(el) => (this.inputElement = el as HTMLInputElement)}
                value={this.value} 
                id="input" 
                placeholder="Scripture Reference" 
                autocomplete="off" 
                onInput={(event) => this.textChange(event)} 
                onPaste={(event) => this.handlePaste(event)} 
                onKeyDown={(event) => this.handleKeyPress(event)}
                disabled={(this.references?.length ?? 0) >= this.maxNumberOfReferences}/>
          </div>
          <div class={{'show': this.books.length > 0, 'result-box':true}}>
              <ul>
                <li class="listheader">Select Book</li>
                {this.books.map((item) => {
                  return <li onClick={() => {
                    this.selectBook(item, true);
                    this.inputElement.focus();
                  }}>{item.CanonicalName}</li>
                })}
              </ul>
          </div>
          <div class={{'show': this.availableNumbers.length > 0, 'result-box': true}}>
            <ul>
              {

                this.step == ReferencePickerState.Chapter ? (
                  <li class="listheader">Select {this.isEnd ? 'Ending' : 'Starting'} Chapter</li>
                ) : (
                  <li class="listheader">Select {this.isEnd ? 'Ending' : 'Starting'} Verse</li>
                )
              }
              {
                this.availableNumbers.map((number) => {
                  return <li onClick={() => {
                    this.selectNumber(number);
                    this.inputElement.focus();
                  }}>{number}</li>
                })
              }
            </ul>
          </div>
        </div>
      </Host>
    );
  }
}