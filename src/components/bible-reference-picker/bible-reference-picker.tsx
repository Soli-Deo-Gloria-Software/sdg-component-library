import { Component, Host, State, Prop, Event, EventEmitter, h } from '@stencil/core';
import { BibleBookInfo, BibleBooks, BibleChapter } from '@soli-deo-gloria-software/bible-books'
import { BibleParser, BibleReference, RawBibleParseResult} from '@soli-deo-gloria-software/bible-reference-finder'
import { ReferencePickerState } from '../../utils/enums';

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  scoped: true,
})
export class BibleReferencePicker {
  private _parser = new BibleParser();
  @State() value: string = '';
  @State() books: BibleBookInfo[] = [];
  @State() step: ReferencePickerState = ReferencePickerState.Book;
  @State() availableNumbers: number[] = [];
  @Prop() maxNumberOfReferences:number = 1;

  allNumbersForStep: number[] = [];
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
          references.push(reference);
        }
    })

    if (references.length > 0) {
      this.references = [...references];
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
      this.incompleteReference = this.getPartialReference()!;
      if (this.incompleteReference.StartingChapter) {
        if (!this.incompleteReference.StartingVerse) {
          if (this.value.endsWith(":")) {
            this.loadVerses(this.selectedBook!.Chapters[this.incompleteReference.StartingChapter-1])
          } else if (this.value.endsWith("-")){
            this.isEnd = true;
            this.loadChapters(this.selectedBook!, this.incompleteReference.StartingChapter + 1);
          } else {
            let chapterSegment = this.isEnd ? this.incompleteReference.EndingChapter : this.incompleteReference.StartingChapter;
            let filtered = this.filterNumbers(chapterSegment?.toString() ?? '');
            if (filtered && filtered.length > 0) {
              this.availableNumbers = [...filtered]
            }
          }
        } else {
          //Verse is set here.
          if (this.value.endsWith("-")){
            this.isEnd = true;
            this.loadVerses(this.selectedBook!.Chapters[this.incompleteReference.StartingChapter-1], this.incompleteReference.StartingVerse + 1)
          } else {
            let verseSegment = this.isEnd ? this.incompleteReference.EndingVerse : this.incompleteReference.StartingVerse;
            let filtered = this.filterNumbers(verseSegment?.toString() ?? '');
            if (filtered && filtered.length > 0) {
              this.availableNumbers = [...filtered]
            }
          }
        }
      } 
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
      this.allNumbersForStep = [];
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
    this.allNumbersForStep = this.getChapters(book, startChapter);
    this.availableNumbers = [...this.allNumbersForStep];
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
    this.allNumbersForStep = this.createArray(startVerse, chapter.VerseCount);
    this.availableNumbers = [...this.allNumbersForStep]
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
    let partial = this.getPartialReference();
    if (!partial) {
      return;
    }

    let step = this.getStepFromPartialReference(partial);
    if (!step.isEnd) {
      if (step.step == ReferencePickerState.Chapter) {
        partial.StartingChapter = selectedNumber;
        this.step = ReferencePickerState.Verse;
        this.loadVerses(this.selectedBook!.Chapters[selectedNumber-1])
      } else {
        partial.StartingVerse = selectedNumber;
      }
    } else {
      if (step.step == ReferencePickerState.Chapter) {
        partial.EndingChapter = selectedNumber;
        this.step = ReferencePickerState.Verse
        this.loadVerses(this.selectedBook!.Chapters[selectedNumber-1], partial.StartingVerse)
      } else {
        partial.EndingVerse = selectedNumber;
        let full = new BibleReference(partial);
        if (this.addReferences([full]))
          this.resetReferenceBuilder();

        return;
      }
    }

    let text = `${partial.Book.CanonicalName} `;
    
    if (partial.Book.Chapters.length == 1) {
      if (partial.StartingVerse) {
        text += `${partial.StartingVerse}`;
        if (partial.EndingVerse) {
          text += `-${partial.EndingVerse}`;
        }
      }
    } else {
      if (partial.StartingChapter) {
        text += `${partial.StartingChapter}`;

        if (partial.StartingVerse) {
          text += `:${partial.StartingVerse}-`;
        } else if (!partial.EndingChapter) {
          text += ':'
        }

        if (partial.EndingChapter && partial.EndingChapter != partial.StartingChapter) {
          text += `${partial.EndingChapter}:`;
        } 
        
        if (partial.EndingVerse) {
          text += `${partial.EndingVerse}`;
        }
      }
    }

    this.value = text;
    this.handleTextChange(text);
  }

  private getStepFromPartialReference = (partial: RawBibleParseResult | undefined) : {step: ReferencePickerState, isEnd: boolean} => {
    if (!partial) {
      return {step: ReferencePickerState.Book, isEnd: false};
    }

    let isEnd = partial.EndingChapter != undefined || partial.EndingVerse != undefined || this.value.endsWith('-');

    let step = ReferencePickerState.Chapter;
    if (!isEnd) {
      if (partial.StartingChapter) {
        step = ReferencePickerState.Verse;
      }
    } else {
      if (partial.StartingVerse || partial.EndingChapter) {
        step = ReferencePickerState.Verse;
      }
    }

    return {step: step, isEnd: isEnd};
  }

  private getPartialReference = () : RawBibleParseResult | undefined => {
    if (!this.selectedBook)
      return undefined;

    let nonBookSegment = this.value.toLowerCase().replace(this.selectedBook?.CanonicalName.toLowerCase() ?? '', '').trimStart()
    let partial = this._parser.getSingleRawReference(this.selectedBook!, nonBookSegment);
    if (!partial || partial.length == 0) {
      return undefined;
    }

    return partial[0];
  }

  removeReference(reference: BibleReference){
    this.references = this.references.filter(ref => ref.Canonical != reference.Canonical);
  }

  useWholeChapter = () => {
    console.log('useWholeChapter');
    let input = this.value;

    if (input.endsWith(':')) {
      input = input.substring(0, input.length - 1)
      this.value = input;
    }

    if (this.isEnd){
      this.handleReferenceSubmit(input);
      this.resetReferenceBuilder();
    }
    else {
      if (!input.endsWith('-')) {
        input += '-';
        this.value = input;
      } 
      console.log(`calling handler with input: ${input}`)
      this.handleTextChange(input);
    }
  }

  render() {
    return (
      <Host>
        <div class="search-box">
          <span class="reference-box">
            { this.references.map(reference => {
              return <span class="reference">{reference.Canonical} &nbsp; <span class="clickable" onClick={() => this.removeReference(reference)}>| &nbsp; &times; &nbsp;</span></span>
            })}
          </span>
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
              />
          <div class={{'show': this.books.length > 0, 'result-box':true}}>
            <ul class="listheader"><li>Select Book</li></ul>
              <ul>
                {this.books.map((item) => {
                  return <li onClick={() => {
                    this.selectBook(item, true);
                    this.inputElement.focus();
                  }}>{item.CanonicalName}</li>
                })}
              </ul>
          </div>
          <div class={{'show': this.availableNumbers.length > 0, 'result-box': true}}>
            <ul class="listheader">
              <li>
                Select {this.isEnd ? 'Ending' : 'Starting'} {(this.step == ReferencePickerState.Chapter ? 'Chapter' : 'Verse')}
              </li>
            </ul>
            <ul>
              {
                (this.step == ReferencePickerState.Chapter) ? '' : <li onClick={() => {
                  this.useWholeChapter();
                  this.inputElement.focus();
                }}>Use Entire Chapter</li> 
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