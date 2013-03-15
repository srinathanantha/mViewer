YUI.add('navigator', function (Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;
    var sm = MV.StateManager;
    var arrowKeys = {
        up:38,
        down:40,
        left: 37,
        right: 39
    };

    function Navigator(selectorString) {
        // associative array to hold the navigable links
        this.regions = [];
        this.selectorString = selectorString;
        this.isNavigatorVisible = false;
        this.searchElementsFound = null;
        this.highlightedElementIndex = -1;
        this.navigableChilds = null;
        this.navigableChildElementIndex = -1;
        this.searchBox = Y.one('.searchBox');
        this.searchInput = this.searchBox.one('input');
        this.lastSearchString = null;
        this.keyListeners = {};
        this.bindKeyListeners();
        var self = this;
        var navigatorCallback = function () {
            if (self.isNavigatorVisible) {
                self.buildIndexes();
            }
        };
        sm.subscribe(navigatorCallback, [sm.events.collectionListUpdated, sm.events.dbListUpdated, sm.events.queryExecuted]);
    }

    Navigator.prototype = {
        buildIndexes:function () {
            this.regions = [];
            var self = this;
            Y.all(self.selectorString).each(function (item) {
                self.add(item);
            });
        },
        add:function (section) {
            var regionId = section.getAttribute('data-search_name');
            if (regionId && regionId.length > 0) {
                this.regions.push(section);
            }
        },
        showCommandBar:function () {
            this.buildIndexes();
            this.clearText();
            this.enableOtherSearchShortCuts();
            this.searchBox.show();
            this.searchInput.focus();
            this.isNavigatorVisible = true;
        },
        hideCommandBar:function () {
            this.searchBox.hide();
            this.disableOtherSearchShortCuts();
            this.clearStyles();
            this.isNavigatorVisible = false;
        },
        isSearchInputBoxFocused:function () {
            return (document.activeElement.id === this.searchInput.getAttribute('id'));
        },
        bindKeyListeners:function () {
            var self = this;
            this.keyListeners.spaceListener = new YAHOO.util.KeyListener(document, {
                ctrl:true,
                keys:' '.charCodeAt(0)
            }, {
                fn:function (event) {
                    self.showCommandBar();
                }
            });
            this.keyListeners.spaceListener.enable();

            this.keyListeners.escapeListener = new YAHOO.util.KeyListener(document, {
                keys:27
            }, {
                fn:function (event) {
                    self.hideCommandBar();
                }
            }, 'keyup');

            this.keyListeners.enterKeyListener = new YAHOO.util.KeyListener(document, {
                keys: 13
            }, {
                fn:function (event) {
                    if(self.isNavigatorVisible && self.isSearchInputBoxFocused()) {
                        self.selectElement();
                    }
                }
            },'keyup');

            this.keyListeners.downKeyListener = new YAHOO.util.KeyListener(document, {
                keys: arrowKeys.down
            }, {
                fn:function (event) {
                    if (self.isSearchInputBoxFocused() && self.searchElementsFound && self.searchElementsFound.length > 0) {
                        var allSearchElementsFoundLength = self.searchElementsFound.length;
                        self.deHighlightCurrentSelection();
                        self.highlightedElementIndex = (self.highlightedElementIndex + 1) % allSearchElementsFoundLength;
                        self.highlightCurrentSelection();
                    }
                }
            },'keyup');

            this.keyListeners.upKeyListener = new YAHOO.util.KeyListener(document, {
                keys: arrowKeys.up
            }, {
                fn:function (event) {
                    if (self.isSearchInputBoxFocused() && self.searchElementsFound && self.searchElementsFound.length > 0) {
                        var allSearchElementsFoundLength = self.searchElementsFound.length;
                        self.deHighlightCurrentSelection();
                        self.highlightedElementIndex = (self.highlightedElementIndex + allSearchElementsFoundLength - 1) % allSearchElementsFoundLength;
                        self.highlightCurrentSelection();
                    }
                }
            },'keyup');

            this.keyListeners.ctrlLeftKeyListener = new YAHOO.util.KeyListener(document, {
                ctrl: true,
                keys: arrowKeys.left
            }, {
                fn:function (event) {
                    if (self.getHighlightedElement() != null && self.navigableChilds && self.navigableChilds.length > 0) {
                        var allNavigableElementsFoundLength = self.navigableChilds.length;
                        self.deHighlightCurrentNavigableChildElement();
                        self.navigableChildElementIndex = (self.navigableChildElementIndex + allNavigableElementsFoundLength - 1) % allNavigableElementsFoundLength;
                        self.highlightCurrentNavigableChildElement();
                    }
                }
            });

            this.keyListeners.ctrlRightKeyListener = new YAHOO.util.KeyListener(document, {
                ctrl: true,
                keys: arrowKeys.right
            }, {
                fn:function (event) {
                    if (self.getHighlightedElement() != null && self.navigableChilds && self.navigableChilds.length > 0) {
                        var allNavigableElementsFoundLength = self.navigableChilds.length;
                        self.deHighlightCurrentNavigableChildElement();
                        self.navigableChildElementIndex = (self.navigableChildElementIndex + 1) % allNavigableElementsFoundLength;
                        self.highlightCurrentNavigableChildElement();
                    }
                }
            });

            this.searchInput.on("keyup", function (eventObject) {
                if (eventObject.keyCode !== arrowKeys.up && eventObject.keyCode !== arrowKeys.down && eventObject.keyCode !== arrowKeys.left && eventObject.keyCode !== arrowKeys.right && eventObject.keyCode !== '\r'.charCodeAt(0)) {
                    self.highlightSearchElements();
                }
            });
        },
        highlightSearchElements:function () {
            var searchString = this.searchInput.get('value').trim();
            if(searchString === this.lastSearchString) {
                return;
            }
            this.lastSearchString = searchString;
            this.clearStyles();
            if (searchString && searchString.length > 2) {
                this.highlightedElementIndex = 0;
                this.searchElementsFound = [];
                var searchStringUpperCaseValue = searchString.toUpperCase();
                for (var index = 0; index < this.regions.length; index++) {
                    var navigableElement = this.regions[index];
                    if (navigableElement.getAttribute('data-search_name').toUpperCase().indexOf(searchStringUpperCaseValue) !== -1) {
                        this.searchElementsFound.push(navigableElement);
                        navigableElement.addClass('shadow');
                        navigableElement.addClass('simulatedHover');
                    }
                }
                this.highlightCurrentSelection();
            }
        },
        getHighlightedElement:function () {
            return (this.searchElementsFound && this.searchElementsFound.length > 0) ? this.searchElementsFound[this.highlightedElementIndex] : null;
        },
        highlightCurrentSelection:function() {
            var highlightedElement = this.getHighlightedElement();
            if(highlightedElement) {
                this.updateAllVisibleNavigableChilds(highlightedElement);
                highlightedElement.scrollIntoView();
                highlightedElement.addClass("highlighted");
                this.highlightCurrentNavigableChildElement();
            }
        },
        deHighlightCurrentSelection:function() {
            var highlightedElement = this.getHighlightedElement();
            if(highlightedElement) {
                highlightedElement.removeClass("highlighted");
                this.deHighlightCurrentNavigableChildElement();
                this.navigableChilds = null;
                this.navigableChildElementIndex = -1;
            }
        },
        updateAllVisibleNavigableChilds:function(highlightedElement) {
            this.navigableChilds = [];
            this.navigableChildElementIndex = 0;
            var self = this;
            highlightedElement.all('.navigableChild:not(.invisible)').each(
                function(item) {
                    self.navigableChilds.push(item);
                }
            );
        },
        getCurrentVisibleNavigableChild:function () {
            if(this.navigableChilds && this.navigableChilds.length >0 ) {
                return this.navigableChilds[this.navigableChildElementIndex];
            }
            return null;
        },
        highlightCurrentNavigableChildElement:function() {
            var navigableChild = this.getCurrentVisibleNavigableChild();
            if(navigableChild) {
                navigableChild.addClass('shadow');
                navigableChild.addClass('simulatedHover');
            }
        },
        deHighlightCurrentNavigableChildElement:function() {
            var navigableChild = this.getCurrentVisibleNavigableChild();
            if(navigableChild) {
                navigableChild.removeClass('shadow');
                navigableChild.removeClass('simulatedHover');
            }
        },
        selectElement:function () {
            var highlightedElement = this.getHighlightedElement();
            this.clearText();
            this.clearStyles();
            if (highlightedElement) {
                var selectedNodeName = highlightedElement.get('nodeName');
                if ('INPUT' === selectedNodeName || 'TEXTAREA' === selectedNodeName) {
                    highlightedElement.focus();
                } else if ('DIV' === selectedNodeName || 'LI' === selectedNodeName) {
                    var currentNavigableChild = this.getCurrentVisibleNavigableChild();
                    if (currentNavigableChild) {
                        if(currentNavigableChild.hasClass('yui3-menu-toggle')) {
                            currentNavigableChild.simulate('mousedown');
                        } else {
                            currentNavigableChild.simulate('click');
                        }
                    } else {
                        highlightedElement.simulate('click');
                        this.searchInput.focus();
                    }
                } else if ('SELECT' === selectedNodeName) {
                    highlightedElement.focus();
                } else {
                    highlightedElement.simulate('click');
                }
            }
        },
        clearText:function () {
            this.lastSearchString = null;
            this.searchInput.set('value', '');
        },
        clearStyles:function () {
            Y.all('.shadow').each(function (item) {
                item.removeClass('shadow');
                item.removeClass('simulatedHover');
                item.removeClass('highlighted');
            });
            this.searchElementsFound = null;
        },
        enableOtherSearchShortCuts:function() {
            this.keyListeners.escapeListener.enable();
            this.keyListeners.enterKeyListener.enable();
            this.keyListeners.downKeyListener.enable();
            this.keyListeners.upKeyListener.enable();
            this.keyListeners.ctrlLeftKeyListener.enable();
            this.keyListeners.ctrlRightKeyListener.enable();
        },
        disableOtherSearchShortCuts:function() {
            this.keyListeners.escapeListener.disable();
            this.keyListeners.enterKeyListener.disable();
            this.keyListeners.downKeyListener.disable();
            this.keyListeners.upKeyListener.disable();
            this.keyListeners.ctrlLeftKeyListener.disable();
            this.keyListeners.ctrlRightKeyListener.disable();
        }
    };
    new Navigator('.navigable');
}, '3.3.0', {
    requires:["event-key", "node", "utility", "node-event-simulate"]
});
