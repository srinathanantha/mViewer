YUI.add('navigator', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;
    var sm = MV.StateManager;
    var ARROW_KEYS = {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39
    };
    var ESCAPE_KEY = 27;
    var SPACE_KEY = ' '.charCodeAt(0);
    var ENTER_KEY = 13;
    var MIN_CHARACTERS_REQUIRED_FOR_SEARCHING = 3;

    function Navigator() {
        this.selectorString = '.navigable';

        // associative array to hold the navigable links
        this.navigableRegions = [];

        //holds all the search elements found in an array
        this.searchElementsFound = [];
        //holds the index of the active search element
        this.activeElementIndex = -1;

        //holds all the navigable siblings(kind of actions) on the active element
        this.navigableSiblings = [];
        //holds the index of the active navigable sibling of the active element
        this.activeSiblingIndex = -1;

        //holds the map of searchElementIndex vs the active sibling index.It is used when the search elements are found
        this.siblingIndexes = null;

        this.searchBox = Y.one('.searchBox');
        this.searchInput = this.searchBox.one('input');
        this.currentSearchString = null;

        this.subscribeToDataChangeEvents();

        this.keyListeners = {};
        this.bindKeyListeners();
    }

    Navigator.prototype = {
        indexNavigableRegions: function() {
            this.navigableRegions = [];
            var self = this;
            Y.all(self.selectorString).each(function(item) {
                self.navigableRegions.push(item);
            });
        },
        highlightSearchElements: function() {
            this.clearCurrentSearches();
            var searchString = this.currentSearchString;
            if (searchString && searchString.length >= MIN_CHARACTERS_REQUIRED_FOR_SEARCHING) {
                this.activeElementIndex = 0;//Initially active element is pointed to first matched serach result
                this.searchElementsFound = [];
                this.siblingIndexes = {};
                var searchStringUpperCaseValue = searchString.toUpperCase();
                for (var i = 0; i < this.navigableRegions.length; i++) {
                    var navigableElement = this.navigableRegions[i];
                    var searchKey = navigableElement.getAttribute('data-search_name');
                    if (searchKey && searchKey.length > 0 && searchKey.toUpperCase().indexOf(searchStringUpperCaseValue) !== -1) {
                        this.addToSearchElementsFoundList(navigableElement);
                    } else {
                        var siblingIndex = 0;
                        var self = this;
                        navigableElement.all('.navigableChild[data-search_name]:not(.invisible)').some(function(subItem) {
                            var searchKey = subItem.getAttribute('data-search_name');
                            if (searchKey && searchKey.length > 0 && searchKey.toUpperCase().indexOf(searchStringUpperCaseValue) !== -1) {
                                self.addToSearchElementsFoundList(navigableElement);
                                var elementIndex = self.searchElementsFound.length - 1;
                                self.siblingIndexes[elementIndex] = siblingIndex;
                                //Highlight only the first matched navigable sibling and exit the loop.
                                return true;
                            }
                            siblingIndex++;
                        });
                    }
                }
                this.highlightActiveElement();
            }
        },
        addToSearchElementsFoundList: function(navigableElement) {
            this.searchElementsFound.push(navigableElement);
            navigableElement.addClass('shadow');
            navigableElement.addClass('simulatedHover');
        },
        /**
         * returns the active search element found if exists
         */
        getActiveElement: function() {
            return (this.searchElementsFound && this.searchElementsFound.length > 0) ? this.searchElementsFound[this.activeElementIndex] : null;
        },
        /**
         * highlights the active element if exists and updates its navigable siblings and then highlights the active sibling.
         * Note:Before highlighting active sibling, it updates active sibling if there is any property found in siblingIndexes which means a search pattern is found on
         * a navigable sibling
         */
        highlightActiveElement: function() {
            var activeElement = this.getActiveElement();
            if (activeElement) {
                this.updateNavigableSiblings();
                activeElement.scrollIntoView();
                activeElement.addClass("highlighted");
                var activeSiblingIndex = this.siblingIndexes[this.activeElementIndex];
                if (activeSiblingIndex) {
                    this.activeSiblingIndex = activeSiblingIndex;
                }
                this.highlightActiveSibling();
            }
        },
        /**
         * deHighlights the active element if exists and deHighlights the navigable sibling of the active navigable sibling.
         */
        deHighlightActiveElement: function() {
            var activeElement = this.getActiveElement();
            if (activeElement) {
                activeElement.removeClass("highlighted");
                this.deHighlightActiveSibling();
                this.navigableSiblings = null;
                this.activeSiblingIndex = -1;
            }
        },
        /**
         * deHighlights the current navigable element and highlights the next navigable element
         */
        goToNextSearchResult: function() {
            if (this.isSearchInputBoxFocused() && this.searchElementsFound && this.searchElementsFound.length > 0) {
                var allSearchElementsFoundLength = this.searchElementsFound.length;
                this.deHighlightActiveElement();
                this.activeElementIndex = (this.activeElementIndex + 1) % allSearchElementsFoundLength;
                this.highlightActiveElement();
            }
        },
        /**
         * deHighlights the current navigable element and highlights the previous navigable element
         */
        goToPreviousSearchResult: function() {
            if (this.isSearchInputBoxFocused() && this.searchElementsFound && this.searchElementsFound.length > 0) {
                var allSearchElementsFoundLength = this.searchElementsFound.length;
                this.deHighlightActiveElement();
                this.activeElementIndex = (this.activeElementIndex + allSearchElementsFoundLength - 1) % allSearchElementsFoundLength;
                this.highlightActiveElement();
            }
        },
        /**
         * deHighlights the current navigable sibling and highlights the previous navigable sibling
         */
        goToPreviousNavigableSibling: function() {
            if (this.getActiveElement() != null && this.navigableSiblings && this.navigableSiblings.length > 0) {
                var allNavigableElementsFoundLength = this.navigableSiblings.length;
                this.deHighlightActiveSibling();
                this.activeSiblingIndex = (this.activeSiblingIndex + allNavigableElementsFoundLength - 1) % allNavigableElementsFoundLength;
                this.highlightActiveSibling();
            }
        },
        /**
         * deHighlights the current navigable sibling and highlights the next navigable sibling
         */
        goToNextNavigableSibling: function() {
            if (this.getActiveElement() != null && this.navigableSiblings && this.navigableSiblings.length > 0) {
                var allNavigableElementsFoundLength = this.navigableSiblings.length;
                this.deHighlightActiveSibling();
                this.activeSiblingIndex = (this.activeSiblingIndex + 1) % allNavigableElementsFoundLength;
                this.highlightActiveSibling();
            }
        },
        /**
         * initialises the property 'navigableSiblings' and add to it all the navigable siblings of the current navigable element
         */
        updateNavigableSiblings: function() {
            this.navigableSiblings = [];
            this.activeSiblingIndex = 0;
            var self = this;
            this.getActiveElement().all('.navigableChild:not(.invisible)').each(
                function(item) {
                    self.navigableSiblings.push(item);
                }
            );
        },
        /**
         * returns the active Sibling element
         */
        getActiveSibling: function() {
            if (this.navigableSiblings && this.navigableSiblings.length > 0) {
                return this.navigableSiblings[this.activeSiblingIndex];
            }
            return null;
        },
        /**
         * highlights the active sibling element if present
         */
        highlightActiveSibling: function() {
            var activeSibling = this.getActiveSibling();
            if (activeSibling) {
                activeSibling.addClass('shadow');
                activeSibling.addClass('simulatedHover');
            }
        },
        /**
         * deHighlights the active sibling element if present
         */
        deHighlightActiveSibling: function() {
            var activeSibling = this.getActiveSibling();
            if (activeSibling) {
                activeSibling.removeClass('shadow');
                activeSibling.removeClass('simulatedHover');
            }
        },
        /**
         * Used for Selecting the active highlighted element
         */
        selectElement: function() {
            var highlightedElement = this.getActiveElement();
            this.clearText();
            this.clearCurrentSearches();
            var self = this;
            var setFocus = function() {
                self.searchInput.focus();
            };
            if (highlightedElement) {
                var selectedNodeName = highlightedElement.get('nodeName');
                if ('INPUT' === selectedNodeName || 'TEXTAREA' === selectedNodeName) {
                    highlightedElement.focus();
                } else if ('DIV' === selectedNodeName || 'LI' === selectedNodeName) {
                    var activeSibling = this.getActiveSibling();
                    if (activeSibling) {
                        if (activeSibling.hasClass('yui3-menu-toggle')) {
                            activeSibling.simulate('mousedown');
                        } else {
                            activeSibling.simulate('click');
                            // TODO Instead of checking for anchor tag, we need to have a better way to decide
                            // if the focus needs to be reset to the searchInput or not after the click
                            selectedNodeName = activeSibling.get('nodeName');
                            if ('A' === selectedNodeName) {
                                setTimeout(setFocus, 500);
                            }
                        }
                    } else {
                        highlightedElement.simulate('click');
                        setTimeout(setFocus, 500);
                    }
                } else if ('SELECT' === selectedNodeName) {
                    highlightedElement.focus();
                    highlightedElement.simulate('mousedown');
                } else {
                    highlightedElement.simulate('click');
                }
            }
        },
        /**
         * empties the text in the search Input Box
         */
        clearText: function() {
            this.currentSearchString = null;
            this.searchInput.set('value', '');
        },
        /**
         * clears the styles on all the previous search elements found and removes all the searchElementsFound
         */
        clearCurrentSearches: function() {
            Y.all('.shadow').each(function(item) {
                item.removeClass('shadow');
                item.removeClass('simulatedHover');
                item.removeClass('highlighted');
            });
            this.searchElementsFound = null;
        },
        /**
         * returns true if the search Input box is currently focused,else returns false
         * @return {Boolean}
         */
        isSearchInputBoxFocused: function() {
            return (document.activeElement.id === this.searchInput.getAttribute('id'));
        },
        /**
         * binds listeners for the key board based shortcuts
         */
        bindKeyListeners: function() {
            var self = this;
            this.keyListeners.spaceListener = new YAHOO.util.KeyListener(document, {
                ctrl: true,
                keys: SPACE_KEY
            }, {
                fn: function() {
                    self.searchInput.focus();
                }
            });
            this.keyListeners.spaceListener.enable();

            this.keyListeners.escapeListener = new YAHOO.util.KeyListener(document, {
                keys: ESCAPE_KEY
            }, {
                fn: function() {
                    if(self.isSearchInputBoxFocused()) {
                        self.clearText();
                    }
                }
            }, 'keyup');
            this.keyListeners.escapeListener.enable();

            this.keyListeners.enterKeyListener = new YAHOO.util.KeyListener(document, {
                keys: ENTER_KEY
            }, {
                fn: function() {
                    if (self.isSearchInputBoxFocused()) {
                        self.selectElement();
                    }
                }
            }, 'keyup');
            this.keyListeners.enterKeyListener.enable();

            this.keyListeners.downKeyListener = new YAHOO.util.KeyListener(document, {
                keys: ARROW_KEYS.DOWN
            }, {
                fn: function() {
                    if(self.isSearchInputBoxFocused()) {
                        self.goToNextSearchResult();
                    }
                }
            }, 'keyup');
            this.keyListeners.downKeyListener.enable();

            this.keyListeners.upKeyListener = new YAHOO.util.KeyListener(document, {
                keys: ARROW_KEYS.UP
            }, {
                fn: function() {
                    if(self.isSearchInputBoxFocused()) {
                        self.goToPreviousSearchResult();
                    }
                }
            }, 'keyup');
            this.keyListeners.upKeyListener.enable();

            this.keyListeners.ctrlLeftKeyListener = new YAHOO.util.KeyListener(document, {
                ctrl: true,
                keys: ARROW_KEYS.LEFT
            }, {
                fn: function() {
                    if(self.isSearchInputBoxFocused()) {
                        self.goToPreviousNavigableSibling();
                    }
                }
            });
            this.keyListeners.ctrlLeftKeyListener.enable();

            this.keyListeners.ctrlRightKeyListener = new YAHOO.util.KeyListener(document, {
                ctrl: true,
                keys: ARROW_KEYS.RIGHT
            }, {
                fn: function() {
                    if(self.isSearchInputBoxFocused() ) {
                        self.goToNextNavigableSibling();
                    }
                }
            });
            this.keyListeners.ctrlRightKeyListener.enable();

            this.searchInput.on("keyup", function(eventObject) {
                if (eventObject.keyCode !== ARROW_KEYS.UP && eventObject.keyCode !== ARROW_KEYS.DOWN && eventObject.keyCode !== ARROW_KEYS.LEFT && eventObject.keyCode !== ARROW_KEYS.RIGHT && eventObject.keyCode !== '\r'.charCodeAt(0)) {
                    var searchString = self.searchInput.get('value').trim();
                    if (searchString === self.currentSearchString) {
                        return;
                    }
                    self.currentSearchString = searchString;
                    self.highlightSearchElements();
                }
            });

            this.searchInput.on("focus", function(eventObject) {
                self.indexNavigableRegions();
                self.clearText();
            });
        },
        /**
         * Whenever the collections list/db list is updated or a query is executed we re-index the navigable regions.
         */
        subscribeToDataChangeEvents: function() {
            var self = this;
            sm.subscribe(function() {
                self.indexNavigableRegions();
            }, [sm.events.collectionListUpdated, sm.events.dbListUpdated, sm.events.queryExecuted]);
        }
    };
    new Navigator();
}, '3.3.0', {
    requires: ["event-key", "node", "utility", "node-event-simulate"]
});
