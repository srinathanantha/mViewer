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
}).use("loading-panel", "alert-dialog", "utility", "submit-dialog", "yes-no-dialog", "io-base", "node", "node-menunav", "event-delegate", "node-event-simulate", "custom-datatable", function(Y) {
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
        function addCollection(responseObj) {
            var response = MV.getResponseResult(responseObj);
            if (response !== undefined) {
                sm.clearCurrentColl();
                /**
                 * The alert message need to be shown after simulating the click event,otherwise the message will be hidden by click event
                 */
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                MV.showAlertMessage(response, MV.infoIcon);
            } else {
                var errorMsg = "Could not add Collection: " + MV.getErrorMessage(responseObj);
                MV.showAlertMessage(errorMsg, MV.warnIcon);
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
        function addGridFSBucket(responseObj) {
            var result = MV.getResponseResult(responseObj);
            if (result !== undefined) {
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                MV.showAlertMessage(result, MV.infoIcon);
            } else {
                var errorMsg = "Could not add gridFS bucket: " + MV.getErrorMessage(responseObj);
                MV.showAlertMessage(errorMsg, MV.warnIcon);
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
                    success: function(ioId, responseObj) {
                        var response = MV.getResponseResult(responseObj);
                        if (response !== undefined) {
                            MV.appInfo.currentDB = "";
                            alert(response);
                            window.location.reload();
                        } else {
                            var errorMsg = "Could not drop db: " + MV.getErrorMessage(responseObj);
                            MV.showAlertMessage(errorMsg, MV.warnIcon);
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
        function showConnectionDetails(ioId, responseObj) {
            try {
                var result = MV.getResponseResult(responseObj);
                if (result !== undefined) {
                    setUserInfo(result);
                    if (result.hasAdminLoggedIn || !result.authMode) {
                        //Adding click handler for new DB button that calls createDB()
                        document.getElementById('createDB').style.display = 'inline-block';
                        Y.on("click", createDB, "#createDB");
                    }
                    var info, index, dbNames = "";
                    var dbTemplate = '' +
                        '<li class="yui3-menuitem" data-db-name=[0]> \
                                <span class="yui3-menu-label"> \
                                      <a id=[1] data-db-name=[2] href="javascript:void(0)" title=[3] class="dbLabel navigable"><span class="wrap_listitem">[4]</span></a> \
                                      <a href="#[5]" class="yui3-menu-toggle"></a>\
                                </span>\
                                <div id="[6]" class="yui3-menu menu-width">\
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
                    for (index = 0; index < result.dbNames.length; index++) {
                        var dbName = result.dbNames[index];
                        var spanId = MV.getDatabaseElementId(dbName);
                        var subMenuHref = dbName + "_subMenu";
                        var subMenuId = dbName + "_subMenu";
                        dbNames += dbTemplate.format(dbName, spanId, dbName, dbName, dbName, subMenuHref, subMenuId);
                    }
                    if (index === 0) {
                        dbDiv.set("innerHTML", "No Databases");
                    }
                    dbDiv.set("innerHTML", dbNames);
                    var menu = Y.one("#dbNames");
                    menu.unplug(Y.Plugin.NodeMenuNav);
                    menu.plug(Y.Plugin.NodeMenuNav, { autoSubmenuDisplay: false, mouseOutHideDelay: 0 });
                    menu.set("style.display", "block");
                    MV.hideLoadingPanel();
                    sm.publish(sm.events.dbListUpdated);
                } else {
                    MV.hideLoadingPanel();
                    var errorMsg = "Could not load databases: " + MV.getErrorMessage(responseObj);
                    Y.log(errorMsg, "error");
                    MV.showAlertMessage(errorMsg, MV.warnIcon);
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
         * It sends request to get the DB names
         */
        function requestConnectionDetails(response, a, b, c) {
            var error = (response != undefined && response.responseText != undefined) ? MV.getErrorMessage(response) : undefined;
            if (error) {
                var msg = "DB creation failed: " + error;
                MV.showAlertMessage(msg, MV.warnIcon);
                Y.log(msg, "error");
                return false;
            } else {
                if (response != undefined && response.responseText != undefined) {
                    MV.showAlertMessage(MV.getResponseResult(response), MV.infoIcon);
                }
                MV.showLoadingPanel("Loading Databases...");
                var request = Y.io(MV.URLMap.getConnectionDetails(),
                    // configuration for loading the database names
                    {
                        method: "GET",
                        on: {
                            success: showConnectionDetails,
                            failure: displayError
                        }
                    });
            }
            return true;
        }

        /**
         * The function shows a dialog that takes input (i.e. Db name) from user
         */
        function createDB(event) {
            MV.showSubmitDialog("addDBDialog", requestConnectionDetails, null);
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

        // Make a request to load Database names when the page loads
        Y.on("load", requestConnectionDetails);
    });
