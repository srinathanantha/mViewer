(function() {

    var actualCode = function(Y) {
        var MV = YUI.com.imaginea.mongoV;
        var sm = MV.StateManager;
        var selectedElement;

        function Navigator(selectorString) {
            // associative array to hold the navigable links
            this.regions = [];
            this.selectorString = selectorString;
            var self = this;
            var navigatorCallback = function() {
                self.init();
            };
            sm.subscribe(navigatorCallback, [sm.events.collectionsChanged, sm.events.dbsChanged, sm.events.queryFired]);
            this._bindKeysYUI();
            this.init();
        }

        function addChildren(node, regionManager) {
            node.all('* input, * ul li, * textarea, * button, * select, * a').each(

                function(item) {
                    if (!item.hasClass('non-navigable')) {
                        regionManager.add(item);
                    }
                });
        }

        Navigator.prototype = {
            init: function() {
                var selectorString = this.selectorString;
                var self = this;
                this.regions = [];
                Y.all(selectorString).each(function(item) {
                    self.add(item);
                });
            },
            add: function(section) {
                var regionId = section.get('id');
                if (regionId && regionId.length > 0) {
                    this.regions[this.regions.length] = section;
                    addChildren(section, this);
                }
            },
            getRegions: function() {
                return this.regions;
            },
            showCommandBar: function(type, args) {
                var caSelector = '.floatingFooter';
                Y.one(caSelector + ' input').set('value', '');
                Y.one(caSelector).show();
                Y.one(caSelector + ' input').focus();
                Y.all('div.buffer').each(function(item) {
                    item.addClass('hint');
                });
            },
            hideCommandBar: function(type, args) {
                Y.one('.floatingFooter').hide();
                Y.all('.shadow').each(function(item) {
                    item.removeClass('shadow');
                    item.removeClass('simulatedHover');
                });
                Y.all('div.buffer').each(function(item) {
                    item.removeClass('hint');
                });
            },
            _bindKeysYUI: function() {
                // TODO instead of keylistener use event listener
                var self = this;
                var spaceListener = new YAHOO.util.KeyListener(document, {
                    ctrl: true,
                    keys: ' '.charCodeAt(0)
                }, {
                    fn: self.showCommandBar
                });
                spaceListener.enable();
                var escapeListener = new YAHOO.util.KeyListener(document, {
                    keys: 27
                }, {
                    fn: self.hideCommandBar
                }, 'keyup');
                escapeListener.enable();
                Y.all(".floatingFooter input").on("keyup", function(eventObject) {
                    self.highlight(self);
                    // for enter key select the element
                    if (eventObject.keyCode === '\r'.charCodeAt(0)) {
                        self.selectElement(self);
                    }
                });
                this._addArrowKeyNavigation();
            },
            _addArrowKeyNavigation: function() {
                var arrowKeys = {
                    left: 37,
                    up: 38,
                    right: 39,
                    down: 40
                };
                var findParent = function(yNode, selector) {
                    var parentNode = yNode;
                    do {
                        parentNode = parentNode.get('parentNode');
                    } while (parentNode && parentNode.test(selector) === false);
                    return parentNode;
                };
                var findParentTR = function() {
                    var relevantParent = null;
                    if (document.activeElement) {
                        var yNode = Y.one(document.activeElement);
                        if (yNode.hasClass('non-navigable')) {
                            relevantParent = findParent(yNode, 'tr');
                            // in case the tr contains a save button, skip
                            if (relevantParent.one("* .savebtn") !== null) {
                                relevantParent = null;
                            }
                        }
                    }
                    return relevantParent;
                };

                Y.on("keydown", function(eventObject) {
                    var parentTR = null;
                    var effectTR = null;
                    switch (eventObject.keyCode) {
                        case arrowKeys.down:
                            parentTR = findParentTR();
                            effectTR = (parentTR) ? parentTR.next() : null;
                            break;
                        case arrowKeys.up:
                            parentTR = findParentTR();
                            effectTR = (parentTR) ? parentTR.previous() : null;
                            break;
                    }
                    if (effectTR) {
                        sm.recordLastArrowNavigation();
                        effectTR.simulate('click');
                    }

                }, document);
            },
            highlight: function(self) {
                var regionName = Y.one('.assistText').get('value').trim();
                if (regionName && regionName.length > 0) {
                    self.clearStyles();
                    selectedElement = null;
                    var index = 0;
                    for (; index < self.regions.length; index++) {
                        if (self.regions[index].get('id').toUpperCase().indexOf(regionName.toUpperCase()) !== -1) {
                            self.regions[index].addClass('shadow');
                            self.regions[index].addClass('simulatedHover');
                            //just go for the first selected element as result
                            if (!selectedElement) {
                                selectedElement = self.regions[index];
                            }
                        }
                    }
                } else {
                    self.clearStyles();
                }
            },
            selectElement: function(self) {
                self.hideCommandBar();
                if (selectedElement) {
                    var selectedNodeName = selectedElement.get('nodeName');
                    if ('INPUT' === selectedNodeName || 'TEXTAREA' === selectedNodeName) {
                        selectedElement.focus();
                    } else if ('DIV' === selectedNodeName) {
                        var firstChild = null;
                        if (selectedElement.hasClass('navigateTable')) {
                            firstChild = selectedElement.one('* tr');
                            if (firstChild) {
                                firstChild.simulate('click');
                            }
                        } else {
                            firstChild = selectedElement.one('textarea, input');
                            if (firstChild) {
                                firstChild.focus();
                            } else {
                                selectedElement.simulate('click');
                            }
                        }
                    } else if ('SELECT' === selectedNodeName) {
                        selectedElement.simulate('mousedown');
                    } else {
                        selectedElement.simulate('click');
                    }
                }
            },
            clearStyles: function() {
                Y.all('.shadow').each(function(item) {
                    item.removeClass('shadow');
                    item.removeClass('simulatedHover');
                });
                Y.all('div.buffer').each(function(item) {
                    item.removeClass('hint');
                });
                selectedElement = null;
            },
            rebuild: function() {
                this.init();
            }
        };

        var navigator = new Navigator('.navigable');
    };

    // lets start the fun stuff with YUI
    YUI().use('event-key', 'node', 'utility', 'node-event-simulate', actualCode);

}());
