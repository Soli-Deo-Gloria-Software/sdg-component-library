import { Component, Host, State, h } from '@stencil/core';
import { BibleBookInfo, BibleBooks } from '@soli-deo-gloria-software/bible-books'

@Component({
  tag: 'bible-reference-picker',
  styleUrl: 'bible-reference-picker.css',
  shadow: true,
})
export class BibleReferencePicker {
  @State() value: string;
  @State() items: BibleBookInfo[] = [];

  textChange = (event) => {
    let input = event.target.value.toLowerCase();

    if (input && input.length > 1) {
        this.items = BibleBooks.filter(book => book.Name.toLowerCase().includes(input));
    }
  }

  selectBook = (selectedText: string) => {
    console.log('selected: ' + selectedText)
    this.value = selectedText;
    this.items = [];
}

  render() {
    return (
      <Host>
          <div class="search-box">
            <div class="row">
                <input type="text" name="input" value={this.value} id="input" placeholder="Scripture Reference" autocomplete="off" onInput={(event) => this.textChange(event)} />
                <button>search</button>
            </div>
            <div class={{'show': this.items.length > 0, 'result-box':true}}>
                <ul>
                  {this.items.map((item) => {
                    return <li onClick={() => this.selectBook(item.CanonicalName)}>{item.CanonicalName}</li>
                  })}
                </ul>
            </div>
        </div>
      </Host>
    );
  }
}