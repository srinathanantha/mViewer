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
}).use("loading-panel", "alert-dialog", "utility", "submit-dialog", "yes-no-dialog", "io-base", "node", "node-menunav", "json-parse", "event-delegate", "node-event-simulate", "custom-datatable", function(Y) {
        // TODO: make loading panel module
        var dbDiv = Y.one('#dbNames ul.lists');
        dbDiv.delegate('click', handleClickEvent, 'a.onclick');
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
            var parsedResponse = Y.JSON.parse(responseObject.responseText),
                response = parsedResponse.response.result,
                error;
            if (response !== undefined) {
                MV.showAlertMessage(response, MV.infoIcon);
                Y.log("[0] created in [1]".format(MV.appInfo.newName, MV.appInfo.currentDB), "info");
                sm.clearCurrentColl();
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
            } else {
                error = parsedResponse.response.error;
                MV.showAlertMessage("Could not add Collection! [0]", MV.warnIcon, error.code);
                Y.log("Could not add Collection! [0]".format(MV.errorCodeMap[error.code]), "error");
            }
        }

        /**
         * Sends the dropDb requests and handles it. It is actually the callback for the Yes button click
         * on the YesNo dialog box
         * @param responseObject The response Object
         */
        function sendDropDBRequest() {
            //"this" refers to the Yes/No dialog box
            this.hide();
            Y.log("Preparing to send request to drop DB", "info");
            var request = Y.io(MV.URLMap.dropDB(), {
                method: "POST",
                on: {
                    success: function(ioId, responseObject) {
                        var parsedResponse = Y.JSON.parse(responseObject.responseText),
                            error;
                        if (parsedResponse.response.result !== undefined) {
                            Y.log("[0] dropped".format(MV.appInfo.currentDB), "info");
                            MV.appInfo.currentDB = "";
                            alert(parsedResponse.response.result);
                            window.location.reload();
                        } else {
                            error = parsedResponse.response.error;
                            MV.showAlertMessage("Could not drop: [0]. [1]".format(MV.appInfo.currentDB, MV.errorCodeMap[error.code]), MV.warnIcon);
                            Y.log("Could not drop: [0], Response Recieved: [1], ErrorCode: [2]".format(MV.appInfo.currentDB, error.message, error.code), "error");
                        }
                    },
                    failure: function(ioId, responseObject) {
                        Y.log("Could not drop: [0]. Status Text: [1]".format(MV.appInfo.currentDB, responseObject.statusText), "error");
                        MV.showAlertMessage("Could not drop: [0], Status Text: [2]".format(MV.appInfo.currentDB, responseObject.statusText), MV.warnIcon);
                    }
                }
            });
        }

        /**
         * The function handles event on the menu item for the database
         * @param eventType The event type
         * @param args the arguments containing information about which menu item was clicked
         */

        function handleClickEvent(event) {
            var dialog, showErrorMessage;
            var label = $(event.currentTarget._node).closest("ul").closest("li")[0].attributes["data-db-name"].value;
            var index = parseInt(event.currentTarget._node.attributes["index"].value);
            MV.appInfo.currentDB = label;
            MV.selectDatabase(Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)));
            switch (index) {
                case 1:
                    // add collection
                    showErrorMessage = function(responseObject) {
                        MV.showAlertMessage("Collection creation failed!", MV.warnIcon);
                        Y.log("Collection creation failed. Response Status: [0]".format(responseObject.statusText), "error");
                    };
                    MV.showSubmitDialog("addColDialog", addCollection, showErrorMessage);
                    setTimeout(function() {
                        // Set hidden field updateColl to false to add new collection
                        Y.one("#updateColl").set("value", false);
                    }, 300);
                    break;
                case 2:
                    // add gridfs store
                    var onSuccess = function(response) {
                        var parsedResponse = Y.JSON.parse(response.responseText);
                        var result = parsedResponse.response.result;
                        if (result !== undefined) {
                            MV.showAlertMessage(result, MV.infoIcon);
                            Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                        }
                    };
                    showErrorMessage = function(responseObject) {
                        MV.showAlertMessage("GridFS bucket creation failed!", MV.warnIcon);
                        Y.log("GridFS bucket creation failed. Response Status: [0]".format(responseObject.statusText), "error");
                    };
                    MV.showSubmitDialog("addGridFSDialog", onSuccess, showErrorMessage);
                    break;
                case 3:
                    // Delete database
                    dialog = MV.showYesNoDialog("Do you really want to drop the Database?", sendDropDBRequest, function(dialog) {
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
            Y.log("Response Recieved of get DB request", "info");
            try {
                var parsedResponse = Y.JSON.parse(responseObject.responseText);
                var result = parsedResponse.response.result;
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
                                      <a id=[1] data-db-name=[2] href="javascript:void(0)" class="dbLabel navigable">[3]</a> \
                                      <a href="#[4]" class="yui3-menu-toggle"></a>\
                                </span>\
                                <div id="[5]" class="yui3-menu menu-width">\
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
                        var menuDataDbName = dbName;
                        var spanId = MV.getDatabaseElementId(dbName);
                        var spanDataDbName = dbName;
                        var subMenuHref = dbName + "_subMenu";
                        var subMenuId = dbName + "_subMenu"
                        var formattedName = dbName.length > 18 ? dbName.substring(0, 15) + "..." : dbName;
                        dbNames += dbTemplate.format(menuDataDbName, spanId, spanDataDbName, formattedName, subMenuHref, subMenuId);
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
                    Y.log("Database Names succesfully loaded", "info");
                    sm.publish(sm.events.dbsChanged);
                } else {
                    MV.hideLoadingPanel();
                    var error = parsedResponse.response.error;
                    Y.log("Could not load databases. Message from server: [0]. Error Code from server:[1] ".format(error.message, error.code), "error");
                    MV.showAlertMessage("[0]", MV.warnIcon, error.code);
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
            Y.log("Could not load the databases. [0]".format(responseObject.statusText), "error");
            MV.hideLoadingPanel();
            MV.showAlertMessage("Could not load Databases ! Please check if the app server is running. Status Text: [0]".format(responseObject.statusText), MV.warnIcon);
        }

        /**
         * The function handles the onLoad event for the home page.
         * It sends request to get the DB names
         */
        function requestConnectionDetails(response, a, b, c) {
            var parsedResponse = (response != undefined && response.responseText != undefined) ? Y.JSON.parse(response.responseText) : null;
            var error = parsedResponse == undefined ? undefined : parsedResponse.response.error;
            if (error) {
                MV.showAlertMessage("DB creation failed ! [0].".format(error.message), MV.warnIcon);
                Y.log("DB creation failed. Response Status: [0]".format(error.message), "error");
            } else {
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
                Y.log("Sending request to load DB names", "info");
            }
        }

        /**
         * The function shows a dialog that takes input (i.e. Db name) from user
         */
        function createDB() {
            MV.showSubmitDialog("addDBDialog", requestConnectionDetails, null);
        }

        $('#dbBuffer .db-header-label').click(function(){
            $("#dbNames").toggle();
        });

        $('#dbOperations').accordion({
            header: "div.list-head",
            heightStyle : "content",
            collapsible: true,
            active : 0
        });



        /*$(".left-cont .buffer .list-head").click(function(eventObject) {
            if(eventObject.target.tagName !== "BUTTON") {
                $(this).siblings(".buffer-content").toggle();
            }
        });*/
        // Make a request to load Database names when the page loads
        Y.on("load", requestConnectionDetails);
    });
