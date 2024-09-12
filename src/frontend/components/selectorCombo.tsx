import React from 'react';
import classNames from 'classnames';
import { FocusTrapCallout, DirectionalHint } from 'office-ui-fabric-react/lib/Callout';
import { List } from 'office-ui-fabric-react/lib/List';
import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

export interface ISelectorComboProps<T> {
  className: string;
  currentValue: T;
  iconName: string;
  selectorList: ISelectorList<T>;
  title: string;

  nameGetter: (item: T) => string;
  selectorListItemOnClick: (item: T) => void;
}

export interface ISelectorList<T> {
  selectorListItems: Array<ISelectorListItem<T>>;
}

export interface ISelectorListItem<T> {
  finishedLoading: boolean;
  header: ISelectorListItemHeader;
  items: T[];
}

export interface ISelectorListItemHeader {
  id: string;
  isHidden?: boolean;
  title: string;
}

export interface ISelectorComboState {
  currentFilterText: string;
  isSelectorCalloutVisible: boolean;
  isSelectorDialogHidden: boolean;
}

class SelectorCombo<T> extends React.Component<ISelectorComboProps<T>, ISelectorComboState>  {
  private selectorButton: HTMLElement | null;

  constructor(props: ISelectorComboProps<T>) {
    super(props);

    this.state = {
      currentFilterText: '',
      isSelectorCalloutVisible: false,
      isSelectorDialogHidden: true,
    };
  }

  public render(): JSX.Element {
    const selectorButtonText: string = this.props.nameGetter(this.props.currentValue);

    return (
      <div className={this.props.className}>
        <div
          className="selector-button"
          aria-label={'Click to search and select ' + this.props.title + '. Current selection is ' + selectorButtonText}
          aria-expanded={this.state.isSelectorCalloutVisible}
          aria-haspopup="true"
          role="button"
          ref={(selectorButton) => this.selectorButton = selectorButton}
          onClick={this.toggleSelectorCallout}
          tabIndex={0}
          onKeyDown={this.handleKeyPressSelectorButton}>
          <i className={"selector-button-icon fa-solid fa-" + this.props.iconName}></i>
          <span className="selector-button-text-wrapper">
            <div className="selector-button-text">
              {selectorButtonText}
            </div>
          </span>
          <i className={"selector-button-chevron fas fa-chevron-down"}></i>
        </div>
        <FocusTrapCallout
          className={classNames('selector-callout', this.props.className)}
          target={this.selectorButton}
          directionalHint={DirectionalHint.bottomLeftEdge}
          gapSpace={0}
          focusTrapProps={{ isClickableOutsideFocusTrap: true }}
          isBeakVisible={false}
          onDismiss={this.hideSelectorCallout}
          hidden={!this.state.isSelectorCalloutVisible}
        >
          {this.renderSelectorCombo(this.getFilteredValues(), true)}
        </FocusTrapCallout>
      </div>
    );
  }

  private handleKeyPressSelectorButton = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.keyCode === 13) {
      this.toggleSelectorCallout();
    }
  }

  private chooseItem = (item: T) => {
    this.props.selectorListItemOnClick(item);
    if (this.state.isSelectorCalloutVisible) {
      this.hideSelectorCallout();
    }

    if (!this.state.isSelectorDialogHidden) {
      this.closeMobileSelectorDialog();
    }
  }

  private handleKeyPressTeamList = (event: React.KeyboardEvent<HTMLDivElement>, item: T) => {
    if (event.keyCode === 13) {
      this.chooseItem(item);
    }
  }

  private closeMobileSelectorDialog = () => {
    this.setState({
      isSelectorDialogHidden: true,
    });
  }

  private hideSelectorCallout = () => {
    this.setState({
      isSelectorCalloutVisible: false,
    });
  }

  private renderSelectorList = (
    finishedLoading: boolean,
    header: ISelectorListItemHeader,
    items: T[],
    shouldVirtualizeItems: boolean
  ) => {
    return (<div className="selector-list" key={header.id}>
      {!header.isHidden && <div className="selector-list-header">
        <div className="selector-list-header-text">{header.title}</div>
      </div>}
      <List
        className="selector-list-items"
        items={items}
        // Not virtualizing the list for mobile views due to bug on fabricUI blocking scroll events
        // on elements other than the modal plane
        // https://github.com/OfficeDev/office-ui-fabric-react/issues/6315
        onShouldVirtualize={() => shouldVirtualizeItems}
        onRenderCell={(item: T, itemIndex: number) => {
          const itemName: string = this.props.nameGetter(item);
          const itemPosition: number = itemIndex + 1;
          const ariaLabel: string = header.isHidden ? this.props.title + ' ' + itemPosition + ' of ' + items.length + '. ' + itemName : header.title + ' collection. ' + this.props.title + ' ' + itemPosition + ' of ' + items.length + '. ' + itemName;
          return (
            <div className="selector-list-item"
              onClick={() => {
                this.chooseItem(item);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => this.handleKeyPressTeamList(e, item)}
              tabIndex={0}
              aria-label={ariaLabel}>
              <i className={"fa-solid fa-" + this.props.iconName}></i>
              <div title={itemName} className="selector-list-item-text">
                {itemName}
              </div>
            </div>
          );
        }}
      />
      {
        !finishedLoading &&
        <>
          <Shimmer className="list-item-shimmer" />
          <Shimmer className="list-item-shimmer" />
          <Shimmer className="list-item-shimmer" />
          <Shimmer className="list-item-shimmer" />
          <Shimmer className="list-item-shimmer" />
        </>
      }
    </div>);
  }

  private updateFilterText = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    filterText: string) => {
    this.setState({
      currentFilterText: filterText,
    });
  }

  private getFilteredValues = () => {
    const trimmedFilterText = this.state.currentFilterText.trim();

    const newSelectorList: ISelectorList<T> = {
      selectorListItems: this.props.selectorList.selectorListItems.map(
        (selectorListItem) => {
          const newSelectorListItem: ISelectorListItem<T> = {
            finishedLoading: selectorListItem.finishedLoading,
            header: selectorListItem.header,
            items: selectorListItem.items.filter((item) => {
              return this.props.nameGetter(item).toLocaleLowerCase().includes(trimmedFilterText.toLocaleLowerCase());
            }),
          };

          return newSelectorListItem;
        },
      ),
    };

    return newSelectorList;
  }

  private renderSelectorCombo = (
    selectorList: ISelectorList<T>,
    shouldVirtualizeItems: boolean
  ) => {
    let itemCount = 0;
    let searchResultsAriaLabel: string = "";

    if (this.state && this.state.currentFilterText) {
      selectorList.selectorListItems.map(selectorListItem => {
        if (selectorListItem && selectorListItem.items) {
          itemCount += selectorListItem.items.length;
        }
      });

      searchResultsAriaLabel = itemCount === 1
        ? 'Found 1 result.'
        : 'Found ' + itemCount + ' results.';
    }

    return (
      <div className="selector-filter-container">
        <TextField autoFocus
          ariaLabel={searchResultsAriaLabel + ' Please enter text here to search.'}
          placeholder="Search"
          onChange={this.updateFilterText}
          tabIndex={0}
        />
        <div className="selector-list-container" data-is-scrollable={true}>
          {selectorList.selectorListItems.map(
            (selectorListItem) => this.renderSelectorList(
              selectorListItem.finishedLoading,
              selectorListItem.header,
              selectorListItem.items,
              shouldVirtualizeItems
            )
          )}
        </div>
      </div>
    );
  }

  private toggleSelectorCallout = () => {
    this.setState((prevState) => {
      return { isSelectorCalloutVisible: !prevState.isSelectorCalloutVisible };
    }, () => {
      if (!this.state.isSelectorCalloutVisible) {
        this.setState({
          currentFilterText: '',
        });
      }
    });
  }
}

export default SelectorCombo;
