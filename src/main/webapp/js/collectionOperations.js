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

/**
 * Contains all the collection related operations
 */
YUI({
    filter: 'raw'
}).use("loading-panel", "alert-dialog", "query-executor", "utility", "submit-dialog", "yes-no-dialog", "io", "node", "node-menunav", "json-parse", "event-delegate", "node-event-simulate", "custom-datatable", function(Y) {
        var MV = YUI.com.imaginea.mongoV,
            sm = MV.StateManager,
            collDiv = Y.one("#collNames ul.lists"),
            systemCollDiv = Y.one("#systemCollections ul.lists"),
            gridFSDiv = Y.one("#bucketNames ul.lists");
        collDiv.delegate('click', handleCollectionMenuClickEvent, 'a.onclick');
        gridFSDiv.delegate('click', handleBucketMenuClickEvent, 'a.onclick');

        /**
         * Click event handler on the database name. It sets the current DB and
         * sends he request to get the list of collections
         * @param e The event Object
         */
        function requestCollNames(e) {
            sm.publish(sm.events.actionTriggered);
            MV.appInfo.currentDB = e.currentTarget.getAttribute("data-db-name");
            MV.appInfo.currentColl = "";
            Y.one("#collNames").unplug(Y.Plugin.NodeMenuNav);
            Y.one("#bucketNames").unplug(Y.Plugin.NodeMenuNav);
            Y.one("#systemCollections").unplug(Y.Plugin.NodeMenuNav);

            MV.createDatatable(MV.URLMap.dbStatistics(), MV.appInfo.currentDB);
            MV.selectDatabase(e.currentTarget);
            MV.hideQueryForm();
            MV.showLoadingPanel("Loading Collections...");
            var request = Y.io(MV.URLMap.getColl(), {
                // configuration for loading the collections
                method: "GET",
                on: {
                    success: displayCollectionNames,
                    failure: displayError
                }
            });
            $("#dbOperations").show();
        }

        /**
         * A function handler to use for successful get Collection Names requests.
         * It parses the response and checks if correct response is received. If and error is received
         * then notify the user.
         * @param oId the event Id object
         * @param responseObject The response Object
         */
        function displayCollectionNames(oId, responseObject) {
            var parsedResponse, parsedResult, info, index, error, collections = "", gridFSBuckets = "", systemCollections = "";
            try {
                parsedResponse = Y.JSON.parse(responseObject.responseText);
                parsedResult = parsedResponse.response.result;

                var collTemplate = '' +
                    '<li class="yui3-menuitem" data-collection-name="[0]"> \
                         <span class="yui3-menu-label"> \
                             <a id=[1] data-collection-name="[2]" title=[3] href="javascript:void(0)" class="collectionLabel navigable"><span class="wrap_listitem">[4]</span></a> \
                             <a href="#[5]" class="yui3-menu-toggle"></a>\
                         </span>\
                         <div id="[6]" class="yui3-menu menu-width">\
                             <div class="yui3-menu-content">\
                                 <ul>\
                                     <li class="yui3-menuitem">\
                                         <a index="1" class="yui3-menuitem-content onclick">Add Document</a>\
                                     </li>\
                                     <li class="yui3-menuitem">\
                                          <a index="2" class="yui3-menuitem-content onclick">Drop Collection</a>\
                                      </li>\
                                     <li class="yui3-menuitem">\
                                         <a index="3" class="yui3-menuitem-content onclick">Update Collection</a>\
                                     </li>\
                                     <li class="yui3-menuitem">\
                                         <a index="4" class="yui3-menuitem-content onclick">Statistics</a>\
                                     </li>\
                                 </ul>\
                             </div>\
                         </div>\
                         </li>';
                var bucketTemplate = '' +
                    '<li class="yui3-menuitem" data-bucket-name="[0]"> \
                         <span class="yui3-menu-label"> \
                             <a id=[1] data-bucket-name="[2]" title=[3] href="javascript:void(0)" class="collectionLabel navigable"><span class="wrap_listitem">[4]</span></a> \
                             <a href="#[5]" class="yui3-menu-toggle"></a>\
                         </span>\
                         <div id="[6]" class="yui3-menu menu-width">\
                             <div class="yui3-menu-content">\
                                 <ul>\
                                     <li class="yui3-menuitem">\
                                         <a index="1" class="yui3-menuitem-content onclick">Add File(s)</a>\
                                     </li>\
                                     <li class="yui3-menuitem">\
                                         <a index="2" class="yui3-menuitem-content onclick">Drop Bucket</a>\
                                     </li>\
                                     <li class="yui3-menuitem">\
                                         <a index="3" class="yui3-menuitem-content onclick">Statistics</a>\
                                     </li>\
                                 </ul>\
                             </div>\
                         </div>\
                         </li>';
                var usersTemplate = '' +
                    '<li class="yui3-menuitem" data-collection-name="[0]"> \
                    <span class="yui3-menu-label"> \
                        <a id=[1] data-collection-name="[2]" title=[3] href="javascript:void(0)" class="collectionLabel navigable"><span class="wrap_listitem">[4]</span></a> \
                        <a href="#[5]" class="yui3-menu-toggle"></a>\
                    </span>\
                    <div id="[6]" class="yui3-menu menu-width">\
                        <div class="yui3-menu-content">\
                            <ul>\
                                <li class="yui3-menuitem">\
                                    <a index="1" class="yui3-menuitem-content onclick">Add User</a>\
                                </li>\
                                <li class="yui3-menuitem">\
                                    <a index="2" class="yui3-menuitem-content onclick">Drop Users</a>\
                                </li>\
                            </ul>\
                        </div>\
                    </div>\
                    </li>';
                var indexesTemplate = '' +
                    '<li class="yui3-menuitem" data-collection-name="[0]"> \
                    <span class="yui3-menu-label"> \
                        <a id=[1] data-collection-name="[2]" title=[3] href="javascript:void(0)" class="collectionLabel navigable"><span class="wrap_listitem">[4]</span></a> \
                        <a href="#[5]" class="yui3-menu-toggle"></a>\
                    </span>\
                    <div id="[6]" class="yui3-menu menu-width">\
                        <div class="yui3-menu-content">\
                            <ul>\
                                <li class="yui3-menuitem">\
                                    <a index="1" class="yui3-menuitem-content onclick">Add Index</a>\
                                </li>\
                                <li class="yui3-menuitem">\
                                    <a index="2" class="yui3-menuitem-content onclick">Drop Indexes</a>\
                                </li>\
                            </ul>\
                        </div>\
                    </div>\
                    </li>';

                var hasCollections = false, hasFiles = false, hasUsersAndIndexes = false;
                if (parsedResult) {
                    for (index = 0; index < parsedResult.length; index++) {
                        var collectionName = parsedResult[index];
                        var id;
                        if (collectionName == 'system.users') {
                            id = MV.getCollectionElementId(collectionName);
                            systemCollections += usersTemplate.format(collectionName, id, collectionName, collectionName, collectionName, id + "_subMenu", id + "_subMenu");
                            hasUsersAndIndexes = true;
                        } else if (collectionName == 'system.indexes') {
                            id = MV.getCollectionElementId(collectionName);
                            systemCollections += indexesTemplate.format(collectionName, id, collectionName, collectionName, collectionName, id + "_subMenu", id + "_subMenu");
                            hasUsersAndIndexes = true;
                        } else {
                            var pos = collectionName.lastIndexOf(".files");
                            if (pos > 0) {
                                collectionName = collectionName.substring(0, pos);
                                id = MV.getBucketElementId(collectionName);
                                gridFSBuckets += bucketTemplate.format(collectionName, id, collectionName, collectionName, collectionName, id + "_subMenu", id + "_subMenu");
                                hasFiles = true;
                            }
                            // Issue 17 https://github.com/Imaginea/mViewer/issues/17
                            if (pos < 0 && collectionName.search(".chunks") < 0) {
                                id = MV.getCollectionElementId(collectionName);
                                collections += collTemplate.format(collectionName, id, collectionName, collectionName, collectionName, id + "_subMenu", id + "_subMenu");
                                hasCollections = true;
                            }
                        }
                    }

                    if (!hasFiles) gridFSBuckets = "&nbsp&nbsp No Files present.";
                    if (!hasCollections)    collections = "&nbsp&nbsp No Collections present.";
                    if (!hasUsersAndIndexes) systemCollections = "&nbsp&nbsp No Users & Indexes present.";
                    collDiv.set("innerHTML", collections);
                    gridFSDiv.set("innerHTML", gridFSBuckets);
                    systemCollDiv.set("innerHTML", systemCollections);

                    var menu1 = Y.one("#collNames");
                    menu1.plug(Y.Plugin.NodeMenuNav, { autoSubmenuDisplay: false, mouseOutHideDelay: 0 });
                    var menu2 = Y.one("#bucketNames");
                    menu2.plug(Y.Plugin.NodeMenuNav, { autoSubmenuDisplay: false, mouseOutHideDelay: 0 });
                    var menu3 = Y.one("#systemCollections");
                    menu3.plug(Y.Plugin.NodeMenuNav, { autoSubmenuDisplay: false, mouseOutHideDelay: 0 });
                    sm.publish(sm.events.collectionListUpdated);
                    MV.hideLoadingPanel();
                } else {
                    error = parsedResponse.response.error;
                    Y.log("Could not load collections. Message: [0]".format(error.message), "error");
                    MV.hideLoadingPanel();
                    MV.showAlertMessage("Could not load Collections! [0]", MV.warnIcon, error.code);
                }
            } catch (e) {
                MV.hideLoadingPanel();
                MV.showAlertMessage(e, MV.warnIcon);
            }
        }

        /**
         * The function handles click event on the menu item for the collection
         * @param eventType The event type
         * @param args the arguments containing information about which menu item was clicked
         */
        function handleCollectionMenuClickEvent(event) {
            sm.publish(sm.events.actionTriggered);
            var label = $(event.currentTarget._node).closest("ul").closest("li")[0].attributes["data-collection-name"].value;
            var index = parseInt(event.currentTarget._node.attributes["index"].value);
            MV.appInfo.currentColl = label;
            MV.selectDBItem(Y.one("#" + MV.getCollectionElementId(MV.appInfo.currentColl)));
            switch (index) {
                case 1:
                    // Add Document
                    var showError = function(responseObject) {
                        MV.showAlertMessage("Document creation failed! Please check if your app server is running and then refresh the page.", MV.warnIcon);
                        Y.log("Document creation failed. Response Status: [0]".format(responseObject.statusText), "error");
                    };
                    MV.showSubmitDialog("addDocDialog", addDocument, showError);
                    break;
                case 2:
                    // Drop Collection
                    MV.showYesNoDialog("Drop Collection", "Are you sure you want to drop the Collection - " + MV.appInfo.currentColl + "?", dropCollection, function() {
                        this.hide();
                    });
                    break;
                case 3:
                    // Update collection
                    var showErrorMessage = function(responseObject) {
                        MV.showAlertMessage("Failed to update collection!", MV.warnIcon);
                        Y.log("Collection creation failed. Response Status: [0]".format(responseObject.statusText), "error");
                    };
                    MV.showSubmitDialog("addColDialog", updateCollection, showErrorMessage);
                    setTimeout(function() {
                        Y.one("#newCollName").set("value", label);
                        // Set hidden field updateColl to true to update existing collection
                        Y.one("#updateColl").set("value", true);
                        Y.one("#newCollName").focus();
                        Y.io(MV.URLMap.isCappedCollection(), {
                            method: "GET",
                            on: {
                                success: function(ioId, responseObject) {
                                    var parsedResponse, isCapped;
                                    try {
                                        parsedResponse = Y.JSON.parse(responseObject.responseText);
                                        isCapped = parsedResponse.response.result;
                                        if (isCapped) {
                                            $("#isCapped").attr('checked', 'checked');
                                            $("#cappedSection").removeClass('disabled');
                                            $("#cappedSection input").removeAttr('disabled');
                                        } else {
                                            $("#isCapped").removeAttr('checked');
                                            $("#cappedSection").addClass('disabled');
                                            $("#cappedSection input").attr('disabled', 'disabled');
                                        }
                                    } catch (e) {
                                        Y.log("Could not parse the JSON response to get the keys", "error");
                                        MV.showAlertMessage("Invalid JSON Response!", MV.warnIcon);
                                    }
                                }
                            }
                        });
                    }, 300);
                    break;
                case 4:
                    // View collections Statistics
                    MV.hideQueryForm();
                    MV.createDatatable(MV.URLMap.collStatistics(), MV.appInfo.currentColl);
                    break;
            }
        }

        /**
         * The function handles event on the context menu for the bucket
         * @param eventType The event type
         * @param args the arguments containing information about which menu item was clicked
         */
        function handleBucketMenuClickEvent(event) {
            sm.publish(sm.events.actionTriggered);
            var label = $(event.currentTarget._node).closest("ul").closest("li")[0].attributes["data-bucket-name"].value;
            var index = parseInt(event.currentTarget._node.attributes["index"].value);
            MV.appInfo.currentBucket = label;
            MV.selectDBItem(Y.one("#" + MV.getBucketElementId(MV.appInfo.currentBucket)));
            switch (index) {
                case 1:
                    // Add File
                    var showErrorMessage = function(responseObject) {
                        MV.showAlertMessage("File upload failed! Please check if your app server is running and then refresh the page.", MV.warnIcon);
                        Y.log("File upload failed. Response Status: [0]".format(responseObject.statusText), "error");
                    };
                    MV.showUploadDialog("addFileDialog");
                    break;
                case 2:
                    // Delete
                    MV.showYesNoDialog("Drop Bucket", "Are you sure you want to drop all files in this bucket - " + MV.appInfo.currentBucket + "?", sendDropBucketRequest, function() {
                        this.hide();
                    });
                    break;
                case 3:
                    // click to view details
                    MV.hideQueryForm();
                    MV.createDatatable(MV.URLMap.bucketStatistics(".files"), MV.appInfo.currentBucket);
                    MV.createDatatable(MV.URLMap.bucketStatistics(".chunks"), MV.appInfo.currentBucket);
                    break;
            }
        }

        /**
         * Handler for drop bucket request.
         * @param responseObject The response Object
         */
        function sendDropBucketRequest() {
            //"this" refers to the Yes/No dialog box
            this.hide();
            var request = Y.io(MV.URLMap.dropBucket(), {
                on: {
                    success: function(ioId, responseObj) {
                        var parsedResponse = Y.JSON.parse(responseObj.responseText);
                        var response = parsedResponse.response.result;
                        if (response !== undefined) {
                            Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                            MV.showAlertMessage(response, MV.infoIcon);
                        } else {
                            var error = parsedResponse.response.error;
                            MV.showAlertMessage("Could not delete all files : [0]", MV.warnIcon, error.code);
                            Y.log("Could not delete all files, Error message: [0], Error Code: [1]".format(error.message, error.code), "error");
                        }
                    },
                    failure: function(ioId, responseObj) {
                        Y.log("Could not delete the file. Status text: ".format(MV.appInfo.currentBucket, responseObj.statusText), "error");
                        MV.showAlertMessage("Could not drop the file! Please check if your app server is running and try again. Status Text: [1]".format(responseObj.statusText), MV.warnIcon);
                    }
                }
            });
        }

        /**
         * The function is the handler function for dropping the collection. This function is called
         * when the user clicks on "YES" on the YesNO dialog box for confirming if the user wants to
         * drop the collection or not.
         */

        function dropCollection() {
            //"this" refers to the YesNO dialog box
            this.hide();
            var request = Y.io(MV.URLMap.dropColl(),
                // configuration for dropping the collection
                {
                    method: "POST",
                    on: {
                        success: function(ioId, responseObj) {
                            var parsedResponse = Y.JSON.parse(responseObj.responseText),
                                response = parsedResponse.response.result,
                                error;
                            if (response !== undefined) {
                                sm.clearCurrentColl();
                                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                                MV.showAlertMessage(response, MV.infoIcon);
                            } else {
                                error = parsedResponse.response.error;
                                MV.showAlertMessage("Could not drop: [0]. [1]".format(MV.appInfo.currentColl, MV.errorCodeMap[error.code]), MV.warnIcon);
                                Y.log("Could not drop [0], Error message: [1], Error Code: [2]".format(MV.appInfo.currentColl, error.message, error.code), "error");
                            }
                        },
                        failure: function(ioId, responseObj) {
                            Y.log("Could not drop [0].Status text: ".format(MV.appInfo.currentColl, responseObj.statusText), "error");
                            MV.showAlertMessage("Could not drop [0]!  Please check if your app server is running and try again. Status Text: [1]".format(MV.appInfo.currentColl, responseObj.statusText), MV.warnIcon);
                        }
                    }
                });
        }

        /**
         * THe function handles the successful sending of the add Document request
         * @param responseObject the response object
         */
        function addDocument(responseObject) {
            var parsedResponse = Y.JSON.parse(responseObject.responseText),
                response = parsedResponse.response.result,
                error;
            if (response !== undefined) {
                Y.one("#" + MV.getCollectionElementId(MV.appInfo.currentColl)).simulate("click");
                MV.showAlertMessage("New document added successfully to collection '[0]'".format(MV.appInfo.currentColl), MV.infoIcon);
            } else {
                error = parsedResponse.response.error;
                MV.showAlertMessage("Could not add Document : " + error.message, MV.warnIcon);
                Y.log("Could not add Document : " + error.message, "error");
                return false;
            }
            return true;
        }

        /**
         * The function handles the successful sending of edit Collection request.
         * It parses the response and checks if the collection is successfully edited. If not,
         * then prompt the user
         * @param responseObject The response Object
         */
        function updateCollection(responseObject) {
            var parsedResponse = Y.JSON.parse(responseObject.responseText),
                response = parsedResponse.response.result,
                error;
            if (response !== undefined) {
                sm.clearCurrentColl();
                /**
                 * The alert message need to be shown after simulating the click event,otherwise the message will be hidden by click event
                 */
                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
                MV.showAlertMessage(response, MV.infoIcon);
            } else {
                error = parsedResponse.response.error;
                MV.showAlertMessage("Could not update Collection! [0]", MV.warnIcon, error.code);
                Y.log("Could not update Collection! [0]".format(MV.errorCodeMap[error.code]), "error");
                return false;
            }
            return true;
        }

        /**
         *  A function handler to use for unsuccessful get Collection request.
         *  This function is called whenever sending request for getting collection list fails.
         *  @param oId the event Id object
         * @param responseObject The response Object
         */

        function displayError(ioId, responseObj) {
            if (responseObj.responseText) {
                Y.log("Could not load collections. Status message: [0]".format(responseObj.statusText), "error");
                MV.showAlertMessage("Could not load collections! Check if your app server is running and refresh the page.", MV.warnIcon);
            }
            MV.hideLoadingPanel();
        }

        // Make request to load collection names when a database name is clicked
        Y.delegate("click", requestCollNames, "#dbNames", "a.dbLabel");
    });
