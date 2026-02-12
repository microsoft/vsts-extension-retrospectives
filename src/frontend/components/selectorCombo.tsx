import React, { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "../utilities/classNameHelper";
import { FocusTrapCallout, DirectionalHint } from "@fluentui/react/lib/Callout";
import { List } from "@fluentui/react/lib/List";
import { Shimmer } from "@fluentui/react/lib/Shimmer";
import { TextField } from "@fluentui/react/lib/TextField";
import { getIconElement } from "./icons";

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

function SelectorCombo<T>({ className, currentValue, iconName, selectorList, title, nameGetter, selectorListItemOnClick }: ISelectorComboProps<T>): React.JSX.Element {
  const [currentFilterText, setCurrentFilterText] = useState("");
  const [isSelectorCalloutVisible, setIsSelectorCalloutVisible] = useState(false);

  const selectorButton = useRef<HTMLDivElement>(null);

  const handleKeyPressSelectorButton = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.keyCode === 13) {
      setIsSelectorCalloutVisible(prev => {
        if (prev) {
          setCurrentFilterText("");
        }
        return !prev;
      });
    }
  }, []);

  const hideSelectorCallout = useCallback(() => {
    setIsSelectorCalloutVisible(false);
  }, []);

  const chooseItem = useCallback(
    (item: T) => {
      selectorListItemOnClick(item);
      hideSelectorCallout();
    },
    [selectorListItemOnClick, hideSelectorCallout],
  );

  const handleKeyPressTeamList = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, item: T) => {
      if (event.keyCode === 13) {
        chooseItem(item);
      }
    },
    [chooseItem],
  );

  const updateFilterText = useCallback((event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, filterText: string) => {
    setCurrentFilterText(filterText);
  }, []);

  const getFilteredValues = useMemo((): ISelectorList<T> => {
    const trimmedFilterText = currentFilterText.trim();

    return {
      selectorListItems: selectorList.selectorListItems.map(selectorListItem => {
        const items = selectorListItem.items ?? [];
        const newSelectorListItem: ISelectorListItem<T> = {
          finishedLoading: selectorListItem.finishedLoading,
          header: selectorListItem.header,
          items: items.filter(item => {
            return nameGetter(item).toLocaleLowerCase().includes(trimmedFilterText.toLocaleLowerCase());
          }),
        };

        return newSelectorListItem;
      }),
    };
  }, [currentFilterText, selectorList, nameGetter]);

  const renderSelectorList = useCallback(
    (finishedLoading: boolean, header: ISelectorListItemHeader, items: T[], shouldVirtualizeItems: boolean) => {
      return (
        <div className="selector-list" key={header.id}>
          {!header.isHidden && (
            <div className="selector-list-header">
              <div className="selector-list-header-text">{header.title}</div>
            </div>
          )}
          <List
            className="selector-list-items"
            items={items}
            // Not virtualizing the list for mobile views due to bug on fabricUI blocking scroll events
            // on elements other than the modal plane
            onShouldVirtualize={() => shouldVirtualizeItems}
            onRenderCell={(item: T, itemIndex: number) => {
              const itemName: string = nameGetter(item);
              const itemPosition: number = itemIndex + 1;
              const ariaLabel: string = header.isHidden ? title + " " + itemPosition + " of " + items.length + ". " + itemName : header.title + " collection. " + title + " " + itemPosition + " of " + items.length + ". " + itemName;
              return (
                <div
                  className="selector-list-item"
                  onClick={() => {
                    chooseItem(item);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => handleKeyPressTeamList(e, item)}
                  tabIndex={0}
                  aria-label={ariaLabel}
                >
                  <i className={"fa-solid fa-" + iconName}></i>
                  <div title={itemName} className="selector-list-item-text">
                    {itemName}
                  </div>
                </div>
              );
            }}
          />
          {!finishedLoading && (
            <>
              <Shimmer className="list-item-shimmer" />
              <Shimmer className="list-item-shimmer" />
              <Shimmer className="list-item-shimmer" />
              <Shimmer className="list-item-shimmer" />
              <Shimmer className="list-item-shimmer" />
            </>
          )}
        </div>
      );
    },
    [nameGetter, title, iconName, chooseItem, handleKeyPressTeamList],
  );

  const renderSelectorCombo = useCallback(
    (selectorListData: ISelectorList<T>, shouldVirtualizeItems: boolean) => {
      let itemCount = 0;
      let searchResultsAriaLabel: string = "";

      if (currentFilterText) {
        selectorListData.selectorListItems.forEach(selectorListItem => {
          itemCount += selectorListItem.items.length;
        });

        searchResultsAriaLabel = itemCount === 1 ? "Found 1 result." : "Found " + itemCount + " results.";
      }

      return (
        <div className="selector-filter-container">
          <TextField autoFocus ariaLabel={searchResultsAriaLabel + " Please enter text here to search."} placeholder="Search" onChange={updateFilterText} tabIndex={0} />
          <div className="selector-list-container" data-is-scrollable={true}>
            {selectorListData.selectorListItems.map(selectorListItem => renderSelectorList(selectorListItem.finishedLoading, selectorListItem.header, selectorListItem.items, shouldVirtualizeItems))}
          </div>
        </div>
      );
    },
    [currentFilterText, updateFilterText, renderSelectorList],
  );

  const toggleSelectorCallout = useCallback(() => {
    setIsSelectorCalloutVisible(prev => {
      if (prev) {
        setCurrentFilterText("");
      }
      return !prev;
    });
  }, []);

  const selectorButtonText: string = currentValue ? nameGetter(currentValue) : "";

  return (
    <div className={className}>
      <div className="selector-button" aria-label={"Click to search and select " + title + ". Current selection is " + (selectorButtonText || "none")} aria-expanded={isSelectorCalloutVisible} aria-haspopup="true" role="button" data-testid="selector-button" ref={selectorButton} onClick={toggleSelectorCallout} tabIndex={0} onKeyDown={handleKeyPressSelectorButton}>
        {getIconElement(iconName)}
        <div>
          <span>{selectorButtonText}</span>
        </div>
        {getIconElement("chevron-down")}
      </div>
      <FocusTrapCallout className={cn("selector-callout", className)} target={selectorButton.current} directionalHint={DirectionalHint.bottomLeftEdge} gapSpace={0} focusTrapProps={{ isClickableOutsideFocusTrap: true }} isBeakVisible={false} onDismiss={hideSelectorCallout} hidden={!isSelectorCalloutVisible}>
        {renderSelectorCombo(getFilteredValues, true)}
      </FocusTrapCallout>
    </div>
  );
}

export default SelectorCombo;
