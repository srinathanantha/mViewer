/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
YUI({
    filter: 'raw'
}).use("loading-panel", "alert-dialog", "utility", "submit-dialog", "yes-no-dialog", "io-base", "node", "node-menunav", "json-parse", "event-delegate", "node-event-simulate", "custom-datatable", "navigator", function(Y) {
        // TODO: make loading panel module
        var dbDiv = Y.one('#dbNames ul.lists');
        dbDiv.delegate('click', handleMenuClickEvent, 'a.onclick');
        YUI.namespace('com.imaginea.mongoV');
        var MV = YUI.com.imaginea.mongoV;
        var sm = YUI.com.imaginea.mongoV.StateManager;

        /**
         * The function handles the successful sending of add Collection request.
         * It parses the response and checks if the collection is successfully added. If not,
         * then prompt the user
         * @param responseObject The response Object
         */
        function addCollection(responseObject) {
            var jsonObject = MV.toJSON(responseObject);
            var responseResult = MV.getResponseResult(jsonObject);
            if (responseResult) {
                sm.clearCurrentColl();
                /**
                 * The alert message need to be shown after simulating the click event,otherwise the message will be hidden by click event
                 */
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                MV.showAlertMessage(responseResult, MV.infoIcon);
            } else {
                var errorMsg = "Could not add Collection: " + MV.getErrorMessage(jsonObject);
                MV.showAlertMessage(errorMsg, MV.warnIcon, MV.getErrorCode(jsonObject));
                Y.log(errorMsg, "error");
                return false;
            }
            return true;
        }

        /**
         * The function handles the successful sending of add gridFS request.
         * It parses the response and checks if the gridFS is successfully added. If not, the prompt the user
         * @param response
         */
        function addGridFSBucket(responseObject) {
            var jsonObject = MV.toJSON(responseObject);
            var responseResult = MV.getResponseResult(jsonObject);
            if (responseResult) {
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                MV.showAlertMessage(responseResult, MV.infoIcon);
            } else {
                var errorMsg = "Could not add gridFS bucket: " + MV.getErrorMessage(jsonObject);
                MV.showAlertMessage(errorMsg, MV.warnIcon, MV.getErrorCode(jsonObject));
                Y.log(errorMsg, "error");
                return false;
            }
            return true;
        }

        /**
         * Sends the dropDb requests and handles it. It is actually the callback for the Yes button click
         * on the YesNo dialog box
         * @param responseObject The response Object
         */
        function sendDropDBRequest() {
            //"this" refers to the Yes/No dialog box
            this.hide();
            var request = Y.io(MV.URLMap.dropDB(), {
                method: "POST",
                on: {
                    success: function(ioId, responseObject) {
                        var jsonObject = MV.toJSON(responseObject);
                        var responseResult = MV.getResponseResult(jsonObject);
                        if (responseResult) {
                            MV.appInfo.currentDB = "";
                            alert(responseResult);
                            window.location.reload();
                        } else {
                            var errorMsg = "Could not drop db: " + MV.getErrorMessage(jsonObject);
                            MV.showAlertMessage(errorMsg, MV.warnIcon, MV.getErrorCode(jsonObject));
                            Y.log(errorMsg, "error");
                        }
                    },
                    failure: function(ioId, responseObject) {
                        MV.showServerErrorMessage(responseObject);
                    }
                }
            });
        }

        /**
         * The function handles event on the menu item for the database
         * @param eventType The event type
         * @param args the arguments containing information about which menu item was clicked
         */

        function handleMenuClickEvent(event) {
            sm.publish(sm.events.actionTriggered);
            var dialog, showErrorMessage;
            var label = $(event.currentTarget._node).closest("ul").closest("li")[0].attributes["data-db-name"].value;
            var index = parseInt(event.currentTarget._node.attributes["index"].value);
            MV.appInfo.currentDB = label;
            MV.selectDatabase(Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)));
            switch (index) {
                case 1:
                    // add collection
                    showErrorMessage = function(responseObject) {
                        MV.showServerErrorMessage(responseObject);
                    };
                    MV.showSubmitDialog("addColDialog", addCollection, showErrorMessage);
                    setTimeout(function() {
                        // Set hidden field updateColl to false to add new collection
                        Y.one("#updateColl").set("value", false);
                    }, 300);
                    break;
                case 2:
                    // add gridfs store
                    showErrorMessage = function(responseObject) {
                        MV.showServerErrorMessage(responseObject);
                    };
                    MV.showSubmitDialog("addGridFSDialog", addGridFSBucket, showErrorMessage);
                    break;
                case 3:
                    // Delete database
                    dialog = MV.showYesNoDialog("Drop Database", "Are you sure you want to drop the Database?", sendDropDBRequest, function() {
                        this.hide();
                    });
                    break;
                case 4:
                    // show statistics
                    MV.hideQueryForm();
                    MV.createDatatable(MV.URLMap.dbStatistics(), MV.appInfo.currentDB);
                    break;
            }
        }

        /**
         * Gets the user information from the URL and sets it
         */
        function setUserInfo(params) {
            var username = params.username ? params.username : "Guest";
            var hostVal = params.host + ":" + params.port;
            // Update View
            Y.one('#user').set("innerHTML", username);
            Y.one('#hostname').set("innerHTML", hostVal);
            // Store the details
            MV.appInfo.host = params.host;
            MV.appInfo.port = params.port;
            MV.appInfo.username = username;

        }

        /**
         *  A function handler to use for successful requests to get DB names.
         *  It parses the response and checks if DB list is successfully received. If not,
         *  then prompt the user that an error occurred.
         *  @param ioId eventId
         *  @param responseObject The response Object
         */
        function showConnectionDetails(ioId, responseObject) {
            try {
                var jsonObject = MV.toJSON(responseObject);
                var responseResult = MV.getResponseResult(jsonObject);
                if (responseResult) {
                    setUserInfo(responseResult);
                    if (responseResult.hasAdminLoggedIn || !responseResult.authMode) {
                        //Adding click handler for new DB button that calls createDB()
                        document.getElementById('createDB').style.display = 'inline-block';
                        Y.on("click", createDB, "#createDB");
                    }
                    var index, dbNames = "";
                    var dbTemplate = '<li class="yui3-menuitem navigable" data-db-name="[0]" data-search_name="[3]"> \
                                <span class="yui3-menu-label"> \
                                      <a id="[1]" data-db-name="[2]" href="javascript:void(0)" title="[4]" class="dbLabel navigableChild"><span class="wrap_listitem">[5]</span></a> \
                                      <a href="#[6]" class="yui3-menu-toggle navigableChild"></a>\
                                </span>\
                                <div id="[7]" class="yui3-menu menu-width">\
                                    <div class="yui3-menu-content">\
                                        <ul>\
                                            <li class="yui3-menuitem">\
                                                <a index="1" class="yui3-menuitem-content onclick">Add Collection</a>\
                                            </li>\
                                            <li class="yui3-menuitem">\
                                                <a index="2" class="yui3-menuitem-content onclick">Add GridFS Bucket</a>\
                                            </li>\
                                            <li class="yui3-menuitem">\
                                                <a index="3" class="yui3-menuitem-content onclick">Drop Database</a>\
                                            </li>\
                                            <li class="yui3-menuitem">\
                                                <a index="4" class="yui3-menuitem-content onclick">Statistics</a>\
                                            </li>\
                                        </ul>\
                                    </div>\
                                </div>\
                                </li>';
                    for (index = 0; index < responseResult.dbNames.length; index++) {
                        var dbName = responseResult.dbNames[index];
                        var spanId = MV.getDatabaseElementId(dbName);
                        var subMenuHref = dbName + "_subMenu";
                        var subMenuId = dbName + "_subMenu";
                        dbNames += dbTemplate.format(dbName, spanId, dbName, dbName, dbName, dbName, subMenuHref, subMenuId);
                    }
                    if (index === 0) {
                        dbDiv.set("innerHTML", "No Databases");
                    }
                    dbDiv.set("innerHTML", dbNames);
                    var menu = Y.one("#dbNames");
                    menu.unplug(Y.Plugin.NodeMenuNav);
                    menu.plug(Y.Plugin.NodeMenuNav, { autoSubmenuDisplay: false, mouseOutHideDelay: 0, _hasFocus: true });
                    menu.set("style.display", "block");
                    MV.hideLoadingPanel();
                    sm.publish(sm.events.dbListUpdated);
                } else {
                    MV.hideLoadingPanel();
                    var errorMsg = "Could not load databases: " + MV.getErrorMessage(jsonObject);
                    Y.log(errorMsg, "error");
                    MV.showAlertMessage(errorMsg, MV.warnIcon, MV.getErrorCode(jsonObject));
                }
            } catch (e) {
                MV.showAlertMessage(e, MV.warnIcon);
            }
        }

        /**
         * A function handler to use for failed requests to get DB names.
         * @param ioId
         * @param responseObject The response Object
         */
        function displayError(ioId, responseObject) {
            var msg = "Could not load Databases: Status Text: [0]".format(responseObject.statusText);
            Y.log(msg, "error");
            MV.hideLoadingPanel();
            MV.showAlertMessage(msg, MV.warnIcon);
        }

        /**
         * The function handles the onLoad event for the home page.
         * It sends request to get the DB names and updates other connection details
         */
        function loadConnectionDetails() {
            MV.showLoadingPanel("Loading Databases...");
            Y.io(MV.URLMap.getConnectionDetails(),
                {
                    method: "GET",
                    on: {
                        success: showConnectionDetails,
                        failure: displayError
                    }
                });
        }

        function addDBSuccessHandler(responseObject) {
            var jsonObject = MV.toJSON(responseObject);
            var responseResult = MV.getResponseResult(jsonObject);
            if (responseResult) {
                loadConnectionDetails();
            } else {
                var msg = "DB creation failed: " + MV.getErrorMessage(jsonObject);
                MV.showAlertMessage(msg, MV.warnIcon, MV.getErrorCode(jsonObject));
                Y.log(msg, "error");
                return false;
            }
            return true;
        }

        /**
         * The function shows a dialog that takes input (i.e. Db name) from user
         */
        function createDB(event) {
            MV.showSubmitDialog("addDBDialog", addDBSuccessHandler, null);
            event.stopPropagation();
        }

        $('#dbBuffer').accordion({
            header: "div.list-head",
            heightStyle: "content",
            collapsible: true
        });

        $('#dbOperations').accordion({
            header: "div.list-head",
            heightStyle: "content",
            collapsible: true,
            active: 0
        });

        var queryExecutor = {};

        function initQueryBox(event) {
            sm.publish(sm.events.actionTriggered);
            MV.appInfo.currentDB = event.currentTarget.getAttribute("data-db-name");
            MV.selectDatabase(event.currentTarget);
            var config = {
                keysUrl: MV.URLMap.dbStatistics(),
                dataUrl: MV.URLMap.runDbCommand(),
                query: "db.runCommand({dbStats:1})",
                currentSelection: sm.currentDB(),
                showKeys: false
            };
            queryExecutor = MV.loadQueryBox(config, showTabView);
        }

        var tabView = new YAHOO.widget.TabView();
        tabView.addTab(new YAHOO.widget.Tab({
            label: 'JSON',
            cacheData: true,
            active: true
        }));
        tabView.addTab(new YAHOO.widget.Tab({
            label: 'Tree Table',
            content: ' <div id="treeTable"></div><div id="table-pagination"></div> '
        }));

        /**
         * The function is an event handler to show the documents whenever a column name is clicked
         * @param {object} e It is an event object
         *
         */
        var showTabView = function(response) {
            try {
                MV.setHeader(MV.headerConstants.QUERY_RESPONSE);
                tabView.appendTo(MV.mainBody.get('id'));
                var treebleData = MV.getTreebleDataForDocs(response);
                var treeble = MV.getTreeble(treebleData, "document");
                treeble.load();
                treeble.subscribe("rowMouseoverEvent", treeble.onEventHighlightRow);
                treeble.subscribe("rowMouseoutEvent", treeble.onEventUnhighlightRow);
                populateJSONTab(response);
                MV.hideLoadingPanel();
            } catch (error) {
                MV.hideLoadingPanel();
                var msg = "Failed to initailise data tabs. Reason: [0]".format(error);
                Y.log(msg, "error");
                MV.showAlertMessage(msg, MV.warnIcon);
            }
        };

        /**
         * The function creates the json view and adds the edit,delete,save and cancel buttons for each document
         * @param response The response Object containing all the documents
         */
        function populateJSONTab(response) {
            var trTemplate = [
                "<div class='docDiv navigable' id='doc[0]' data-search_name='json'>",
                "<div class='textAreaDiv'><pre><textarea id='ta[1]' disabled='disabled' cols='74'>[2]</textarea></pre></div>",
                "</div>"
            ].join('\n');
            var jsonView = "<div class='buffer jsonBuffer'>";
            jsonView += "<table class='jsonTable'><tbody>";

            var documents = response.documents;
            if (documents.length === 0) {
                jsonView = jsonView + "No documents to be displayed";
            } else {
                for (var i = 0; i < documents.length; i++) {
                    jsonView += trTemplate.format(i, i, Y.JSON.stringify(documents[i], null, 4));
                }
            }
            jsonView = jsonView + "</tbody></table></div>";
            tabView.getTab(0).setAttributes({
                content: jsonView
            }, false);
            for (i = 0; i < documents.length; i++) {
                fitToContent(500, document.getElementById("ta" + i));
            }
        }

        /**
         * Sets the size of the text area according to the content in the text area.
         * @param maxHeight The maximum height if the text area
         * @param text The text of the text area
         */
        function fitToContent(maxHeight, text) {
            if (text) {
                var adjustedHeight = text.clientHeight;
                if (!maxHeight || maxHeight > adjustedHeight) {
                    adjustedHeight = Math.max(text.scrollHeight, adjustedHeight) + 4;
                    if (maxHeight) {
                        adjustedHeight = Math.min(maxHeight, adjustedHeight);
                    }
                    if (adjustedHeight > text.clientHeight) {
                        text.style.height = adjustedHeight + "px";
                    }
                }
            }
        }

        // Make request to load collection names when a database name is clicked
        Y.delegate("click", initQueryBox, "#dbNames", "a.dbLabel");

        // Make a request to load Database names when the page loads
        Y.on("load", loadConnectionDetails);
    });
