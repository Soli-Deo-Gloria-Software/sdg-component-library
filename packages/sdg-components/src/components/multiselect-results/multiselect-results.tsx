import { Component, Element, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'multiselect-results',
  styleUrl: 'multiselect-results.css',
  styleUrls: ['../../shared-styles.css'],
  scoped: true,
})
export class MultiselectResults {
  @Prop() items: any[] = [];
  @Prop() maxInlineItems: number = 2;
  @Prop() labelKey: string | undefined;
  @Prop() itemLabel: string = 'item';
  @Prop() compactMediaQuery: string = '(max-width: 480px)';

  @State() expanded: boolean = false;
  @State() compactLayout: boolean = false;

  @Event() itemRemoved!: EventEmitter<any>;

  @Element() hostElement!: HTMLElement;

  private compactLayoutQuery?: MediaQueryList;
  private readonly compactLayoutChangeHandler = (event: MediaQueryListEvent) => {
    this.compactLayout = event.matches;
  };

  connectedCallback() {
    this.compactLayoutQuery = window.matchMedia(this.compactMediaQuery);
    this.compactLayout = this.compactLayoutQuery.matches;
    this.compactLayoutQuery.addEventListener('change', this.compactLayoutChangeHandler);
  }

  disconnectedCallback() {
    this.compactLayoutQuery?.removeEventListener('change', this.compactLayoutChangeHandler);
  }

  @Listen('click', { target: 'window' })
  handleWindowClick(ev: MouseEvent) {
    const path = ev.composedPath();
    const clickedInside = path.includes(this.hostElement);

    if (!clickedInside && this.expanded) {
      this.expanded = false;
    }
  }

  @Watch('items')
  handleItemsChanged() {
    if (this.getCollapsedItems().length === 0) {
      this.expanded = false;
    }
  }

  toggleExpanded = () => {
    this.expanded = !this.expanded;
  }

  private getItemLabel(item: any): string {
    let label: string|undefined;
    if (this.labelKey) {
     label = item?.[this.labelKey];
    }

    label = label ?? item?.toString();
    return label ?? '';
  }

  private getCollapsedItems(): any[] {
    if (this.compactLayout) {
      return this.items;
    }

    return this.items.slice(this.maxInlineItems);
  }

  private getCountLabel(count: number): string {
    return count === 1 ? `1 ${this.itemLabel}` : `${count} ${this.itemLabel}s`;
  }

  private renderItem(item: any) {
    return (
      <multiselect-item itemReference={item} onRemoveItem={() => this.itemRemoved.emit(item)}>
        {this.getItemLabel(item)}
      </multiselect-item>
    );
  }

  render() {
    const count = this.items.length;
    if (count === 0) {
      return null;
    }

    const inlineItems = this.items.slice(0, this.maxInlineItems);
    const overflowCount = count - inlineItems.length;
    const collapsedItems = this.getCollapsedItems();
    const countLabel = this.getCountLabel(count);

    return (
      <Host>
        <span class={{ 'results-box': true, 'expanded': this.expanded }}>
          <button
            type="button"
            class="results-chip results-count-chip bg-light text-black clickable"
            aria-expanded={this.expanded ? 'true' : 'false'}
            aria-label={countLabel}
            onClick={() => this.toggleExpanded()}
          >
            {countLabel}
          </button>

          <span class="results-inline">
            {inlineItems.map(item => this.renderItem(item))}
            {overflowCount > 0 && (
              <button
                type="button"
                class="results-chip results-overflow-chip bg-light text-black clickable"
                aria-expanded={this.expanded ? 'true' : 'false'}
                aria-label={`${overflowCount} more ${overflowCount === 1 ? this.itemLabel : `${this.itemLabel}s`}`}
                onClick={() => this.toggleExpanded()}
              >
                +{overflowCount}
              </button>
            )}
          </span>

          {collapsedItems.length > 0 && (
            <div class="results-expanded" role="group" aria-label="Additional selected items">
              {collapsedItems.map(item => this.renderItem(item))}
            </div>
          )}
        </span>
      </Host>
    );
  }
}
