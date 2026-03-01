import { Component, Host, State, h } from '@stencil/core';
import { BibleBookInfo, BibleBooks, BibleChapter } from '@soli-deo-gloria-software/bible-books'
import { BibleParser, BibleReference} from '@soli-deo-gloria-software/bible-reference-finder'
import { ReferencePickerState } from '../../utils/enums';

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  shadow: true,
})
export class BibleReferencePicker {
  @State() value: string;
  @State() books: BibleBookInfo[] = [];
  @State() step: ReferencePickerState = ReferencePickerState.Book;
  @State() availableNumbers: number[] = [];
  selectedBook: BibleBookInfo;
  allowedRegex: RegExp;
  @State() references: BibleReference[] = [];
  //TODO: Output BibleBookReference[] with a max count specified by an input.

  handlePaste = (event: ClipboardEvent) => {
    console.log('paste event' + event.clipboardData.types)
    if (event.clipboardData == undefined) {
      return;
    }

    let text = event.clipboardData.getData('text/plain');

    if (!text) {
      return;
    }

    let parser = new BibleParser(); //TODO: Shared instance?
    let parsed = parser.parse(text);
    if (!parsed) {
      return;
    }

    let references: BibleReference[] = []
    //TODO: clean up - only accept up to the configured number of reference.
    parsed.forEach(collection => {
      collection.BibleReferences.forEach(reference => {
        references.push(reference);
      })
    })
    this.references = references;
  }

  textChange = (event) => {
    //TODO: Prevent input if allowedRegexp is set and text is invalid.
    //TODO: Handle Paste using bible reference parser to see if it's a full reference. If not carry on to the matches below.
    //Todo: handle enter press and semi-colon press as "early" termination of a reference - parse text and if valid reference, store the result.
    //TODO: handle esc press as cancel of process - reset all states and clear current imput.

    if (this.step == ReferencePickerState.Book){
      let input = event.target.value.toLowerCase();

      if (input && input.length > 1) {
        this.books = BibleBooks.filter(book => book.Name.toLowerCase().includes(input));
        if (this.books.length == 1 && this.books[0].Name.toLowerCase() == input.toLowerCase()){
          this.selectBook(this.books[0]);
        }
      }
    } else {
      //TODO: if value exceeds max available number, prevent input OR cap at max number.
      // Handle range and colon delimiters
    }
  }

  selectBook = (selectedBook: BibleBookInfo) => {
    console.log('selected: ' + selectedBook.CanonicalName)
    this.value = selectedBook.CanonicalName;
    this.selectedBook = selectedBook;

    if (selectedBook.Chapters.length == 1){
      this.loadVerses(selectedBook.Chapters[0]);
    } else {
      this.loadChapters(selectedBook);
    }
    this.books = [];
  }

  loadChapters = (book: BibleBookInfo, startChapter?: number) => {
    startChapter ??= 1;
    this.availableNumbers = book.Chapters.filter(chapter => chapter.Number >= startChapter).map(chapter => chapter.Number);
    this.step = ReferencePickerState.Chapter;
    // Think about number of decimals allowed. For instance, most chapters only have double digit chapterss and none have 4 digits, so 1111 is invalid...
    this.allowedRegex = new RegExp(/^\d+[\d:\-]$/g); //Untested: only allow numbers optionally ending with : or -.
  }

  loadVerses = (chapter: BibleChapter, startVerse?: number) => {
    startVerse ??= 1;
    this.availableNumbers = this.createArray(startVerse, chapter.VerseCount);
    this.step = ReferencePickerState.Verse;
    // Think about number of decimals allowed. For instance, most chapters only have double digit versess and none have 4 digits, so 1111 is invalid...
    this.allowedRegex = new RegExp(/^\d+[\d\-]$/g); //Untested: only allow numbers optionally ending with a dash for a range.
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
              <input type="text" name="input" value={this.value} id="input" placeholder="Scripture Reference" autocomplete="off" onInput={(event) => this.textChange(event)} onPaste={(event) => this.handlePaste(event)}/>
              <button>search</button>
          </div>
          <div class={{'show': this.books.length > 0, 'result-box':true}}>
              <ul>
                <li class="listheader">Select Book</li>
                {this.books.map((item) => {
                  return <li onClick={() => this.selectBook(item)}>{item.CanonicalName}</li>
                })}
              </ul>
          </div>
          <div class={{'show': this.availableNumbers.length > 0, 'result-box': true}}>
            <ul>
              {
                this.step == ReferencePickerState.Chapter ? (
                  <li class="listheader">Select Chapter</li>
                ) : (
                  <li class="listheader">Select Verse</li>
                )
              }
              {
                this.availableNumbers.map((number) => {
                  return <li onClick={() => this.selectNumber(number)}>{number}</li>
                })
              }
            </ul>
          </div>
        </div>
      </Host>
    );
  }
}