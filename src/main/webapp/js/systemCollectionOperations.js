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
 * Contains all the operations that are related to users & indexes
 */
YUI({
    filter: 'raw'
}).use("loading-panel", "yes-no-dialog", "alert-dialog", "io-base", "json-parse", "node-event-simulate", "node", "event-delegate", "json-stringify", "utility", "treeble-paginator", "event-key", "event-focus", "node-focusmanager", function(Y) {
        YUI.namespace('com.imaginea.mongoV');
        var MV = YUI.com.imaginea.mongoV,
            sm = MV.StateManager;
        MV.treebleData = {};
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
        var actionMap = {
            save: "save",
            edit: "edit"
        };

        var idMap = {};

        var initQueryBox = function(event) {
            MV.appInfo.currentColl = event.currentTarget.getAttribute("data-collection-name");
            MV.selectDBItem(event.currentTarget);
            MV.loadQueryBox(MV.URLMap.getDocKeys(), MV.URLMap.getDocs(), sm.currentColl(), showTabView);
        };

        /**
         * The function is an event handler to show the documents whenever a column name is clicked
         * @param {object} e It is an event object
         *
         */
        var showTabView = function(response) {
            MV.deleteDocEvent.unsubscribeAll();
            MV.deleteDocEvent.subscribe(deleteUserOrIndex);

            try {
                MV.setHeader(MV.headerConstants.QUERY_RESPONSE);
                tabView.appendTo(MV.mainBody.get('id'));
                var treebleData = MV.getTreebleDataForDocs(response);
                var treeble = MV.getTreeble(treebleData, "document");
                // Remove download column for document operations
                treeble.removeColumn(treeble.getColumn("download_column"));
                treeble.load();
                treeble.subscribe("rowMouseoverEvent", treeble.onEventHighlightRow);
                treeble.subscribe("rowMouseoutEvent", treeble.onEventUnhighlightRow);

                //If we are showing indexes then no need to show edit
                populateJSONTab(response);
                if (sm.currentColl() == MV.indexes) {
                    $('.editbtn').each(function() {
                        $(this).css('visibility', 'hidden');
                    });
                }
                sm.publish(sm.events.queryFired);
                MV.hideLoadingPanel();
            } catch (error) {
                MV.hideLoadingPanel();
                Y.log("Failed to initailise data tabs. Reason: [0]".format(error), "error");
                MV.showAlertMessage("Failed to initailise data tabs. [0]".format(error), MV.warnIcon);
            }
        };

        /**
         * The function creates the json view and adds the edit,delete,save and cancel buttons for each document
         * @param response The response Object containing all the documents
         */
        function populateJSONTab(response) {
            var jsonView = "<div class='buffer jsonBuffer navigable navigateTable' id='jsonBuffer'>";
            var template = [
                "<div id='doc[0]'class='docDiv'>",
                "<div class='textAreaDiv'><pre><textarea id='ta[1]' class='disabled non-navigable' disabled='disabled' cols='74'>[2]</textarea></pre></div>",
                "<div class='actionsDiv'>",
                "<button id='edit[3]'class='bttn editbtn non-navigable'>edit</button>",
                "<button id='delete[4]'class='bttn deletebtn non-navigable'>delete</button>",
                "<button id='save[5]'class='bttn savebtn non-navigable invisible'>save</button>",
                "<button id='cancel[6]'class='bttn cancelbtn non-navigable invisible'>cancel</button>",
                "</div>" ,
                "</div>"
            ].join('\n');

            var nonEditableTemplate = [
                "<div id='doc[0]' style='display: inline-block;width:99%;position: relative;'>",
                "<div style='display: inline; float: left; width: 98%;padding: 10px;'><pre> <textarea id='ta[1]' class='disabled non-navigable' disabled='disabled' cols='74' style='width: 99%'>[2]</textarea></pre></div>",
                "<div style='display: inline; float: left;left:85%;position: absolute;top: 15%;'>",
                "</div>",
                "</div>"
            ].join('\n');

            jsonView += "<table class='jsonTable'><tbody>";

            var documents = response.documents;
            for (var i = 0; i < documents.length; i++) {
                if (documents[i].name == "_id_") {
                    jsonView += nonEditableTemplate.format(i, i, Y.JSON.stringify(documents[i], null, 4));
                } else {
                    jsonView += template.format(i, i, Y.JSON.stringify(documents[i], null, 4), i, i, i, i);
                }
            }
            if (i === 0) {
                if (sm.currentColl() == MV.users) {
                    jsonView = jsonView + "No users to be displayed";
                } else {
                    jsonView = jsonView + "No indexes to be displayed";
                }
            }

            jsonView = jsonView + "</tbody></table></div>";
            tabView.getTab(0).setAttributes({
                content: jsonView
            }, false);
            for (i = 0; i < documents.length; i++) {
                Y.on("click", editUser, "#edit" + i);
                Y.on("click", function(e) {
                    MV.deleteDocEvent.fire({eventObj: e});
                }, "#delete" + i);
                Y.on("click", saveDoc, "#save" + i);
                Y.on("click", cancelSave, "#cancel" + i);
            }
            for (i = 0; i < documents.length; i++) {
                fitToContent(500, document.getElementById("ta" + i));
            }
            var trSelectionClass = 'selected';
            // add click listener to select and deselect rows.
            Y.all('.jsonTable tr').on("click", function(eventObject) {
                var currentTR = eventObject.currentTarget;
                var alreadySelected = currentTR.hasClass(trSelectionClass);

                Y.all('.jsonTable tr').each(function(item) {
                    item.removeClass(trSelectionClass);
                });

                if (!alreadySelected) {
                    currentTR.addClass(trSelectionClass);
                    var editBtn = currentTR.one('button.editbtn');
                    if (editBtn) {
                        editBtn.focus();
                    }
                }
            });
            Y.on('blur', function(eventObject) {
                var resetAll = true;
                // FIXME ugly hack for avoiding blur when scroll happens
                if (sm.isNavigationSideEffect()) {
                    resetAll = false;
                }
                if (resetAll) {
                    Y.all('tr.selected').each(function(item) {
                        item.removeClass(trSelectionClass);
                    });
                }
            }, 'div.jsonBuffer');

            Y.on('keyup', function(eventObject) {
                var firstItem;
                // escape edit mode
                if (eventObject.keyCode === 27) {
                    Y.all("button.savebtn").each(function(item) {
                        toggleSaveEdit(item, getButtonIndex(item), actionMap.save);
                        if (!(firstItem)) {
                            firstItem = item;
                        }
                    });
                }
            }, 'div.jsonBuffer');
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

        function getButtonIndex(targetNode) {
            var btnID = targetNode.get("id");
            var match = btnID.match(/\d+/);
            return (parseInt(match[0], 10));
        }

        /**
         * This function is an event handler to handle the delete button click.
         * It sends request to delete the document
         * @param eventObject The event Object
         */
        function deleteUserOrIndex(type, args) {
            var btnIndex;
            var collname = sm.currentColl();
            var sendDeleteDocRequest = function() {
                var targetNode = args[0].eventObj.currentTarget;
                var index = getButtonIndex(targetNode);
                var doc = Y.one('#doc' + index).one("pre").one("textarea").get("value");
                var parsedDoc = Y.JSON.parse(doc);
                var docId = Y.JSON.stringify(parsedDoc._id);
                var username, nameSpace, indexName;

                //if the collection is from system.users then we need to remove the user
                if (collname == MV.users) {
                    username = parsedDoc.user;
                    var request = Y.io(MV.URLMap.removeUser(),
                        // configuration for dropping the document
                        {
                            method: "POST",
                            data: "username=" + username,
                            on: {
                                success: function(ioId, responseObj) {
                                    var parsedResponse = Y.JSON.parse(responseObj.responseText);
                                    var response = parsedResponse.response.result;
                                    if (response !== undefined) {
                                        MV.showAlertMessage(response, MV.infoIcon);
                                        Y.one('#execQueryButton').simulate('click');
                                    }
                                    else {
                                        var error = parsedResponse.response.error;
                                        MV.showAlertMessage("Could not delete the user with username [0]. [1]".format(username, MV.errorCodeMap[error.code]), MV.warnIcon);
                                        Y.log("Could not delete the user with username =  [0], Error message: [1], Error Code: [2]".format(username, error.message, error.code), "error");
                                    }
                                },
                                failure: function(ioId, responseObj) {
                                    Y.log("Could not delete the user Status text: ".format(MV.appInfo.currentColl, responseObj.statusText), "error");
                                    MV.showAlertMessage("Could not delete the user! Please check if your app server is running and try again. Status Text: [1]".format(responseObj.statusText), MV.warnIcon);
                                }
                            }
                        });

                }
                //If the collection is from system.indexes we need to remove the index
                else if (collname == MV.indexes) {
                    //Send the name space and the name of the index
                    nameSpace = parsedDoc.ns;
                    indexName = parsedDoc.name;

                    var request = Y.io(MV.URLMap.dropIndex(),
                        // configuration for dropping the Index
                        {
                            method: "POST",
                            data: "nameSpace=" + nameSpace + "&indexName=" + indexName,
                            on: {
                                success: function(ioId, responseObj) {
                                    var parsedResponse = Y.JSON.parse(responseObj.responseText);
                                    var response = parsedResponse.response.result;
                                    if (response !== undefined) {
                                        MV.showAlertMessage(response, MV.infoIcon);
                                        Y.one('#execQueryButton').simulate('click');
                                    }
                                    else {
                                        var error = parsedResponse.response.error;
                                        MV.showAlertMessage("Could not delete the index with IndexName [0]. [1]".format(indexName, MV.errorCodeMap[error.code]), MV.warnIcon);
                                        Y.log("Could not delete the index with Index name =  [0], Error message: [1], Error Code: [2]".format(indexName, error.message, error.code), "error");
                                    }
                                },
                                failure: function(ioId, responseObj) {
                                    Y.log("Could not delete the index Status text: ".format(MV.appInfo.currentColl, responseObj.statusText), "error");
                                    MV.showAlertMessage("Could not delete the index! Please check if your app server is running and try again. Status Text: [1]".format(responseObj.statusText), MV.warnIcon);
                                }
                            }
                        });
                }

                this.hide();
            };
            if (args[0].eventObj.currentTarget.hasClass('deletebtn') || args[0].eventObj.currentTarget.hasClass('delete-icon')) {
                var alertmsg = "Do you really want to drop the ";
                if (collname == MV.users) {
                    alertmsg = alertmsg.concat("user ?");

                }
                else if (collname == MV.indexes) {
                    alertmsg = alertmsg.concat("index ?");
                }
                MV.showYesNoDialog(alertmsg, sendDeleteDocRequest, function() {
                    this.hide();
                });
            } else {
                //get the sibling save/edit bttn and toggle using that
                btnIndex = getButtonIndex(args[0].eventObj.currentTarget);
                toggleSaveEdit(Y.one('#delete' + btnIndex).get('parentNode').one('button'), btnIndex, actionMap.save);
            }
        }

        /**
         * The function is an event handler for the save button click.
         * @param eventObject The event Object
         */

        function saveDoc(eventObject) {
            var targetNode = eventObject.currentTarget;
            var index = getButtonIndex(targetNode);
            var textArea = Y.one('#doc' + index).one("pre").one("textarea");
            var doc = textArea.get("value");
            doc = doc.replace(/'/g, '"');
            try {
                var parsedDoc = Y.JSON.parse(doc);
                sendUpdateDocRequest(Y.JSON.stringify(parsedDoc), idMap[index].docId, eventObject);
            } catch (e) {
                MV.showAlertMessage("The document entered is not in the correct JSON format", MV.warnIcon);
                textArea.focus();
            }
        }

        /**
         * The function is an event handler for the cancel button click
         * @param eventObject The event Object
         */

        function cancelSave(eventObject) {
            var targetNode = eventObject.currentTarget;
            var index = getButtonIndex(targetNode);
            var textArea = Y.one('#doc' + index).one("pre").one("textarea");
            textArea.set("value", idMap[index].originalDoc);
            toggleSaveEdit(targetNode, index, actionMap.save);
        }


        /**
         * The function is an event handler for the edit button click
         * @param eventObject The event Object
         */
        function editUser(eventObject) {
            if (sm.currentColl() == MV.users) {
                var targetNode = eventObject.currentTarget;
                var index = getButtonIndex(targetNode);
                var textArea = Y.one('#doc' + index).one("pre").one("textarea");
                var doc = textArea.get("value");
                var parsedDoc = Y.JSON.parse(doc);
                var username = parsedDoc.user;
                var readOnlyValue = parsedDoc["readOnly"];

                var showError = function(responseObject) {
                    MV.showAlertMessage("Adding user failed! Please check if your app server is running and then refresh the page.", MV.warnIcon);
                    Y.log("Editing user failed. Response Status: [0]".format(responseObject.statusText), "error");
                };
                MV.showSubmitDialog("addUserDialog", addUser, showError);
                setTimeout(function() {
                    //Set the values of the dialog box as per the user values
                    Y.one("#addUser_user_name").set("value", username);
                    Y.one("#addUser_user_name").setAttribute("readonly", "readonly");
                    if (readOnlyValue == false) {
                        Y.one("#addUser_readonly").removeAttribute("checked");
                    } else {
                        Y.one("#addUser_readonly").setAttribute("checked", readOnlyValue);
                    }
                    //set the style for the username to make an impression as a readonly field
                    Y.one("#addUser_user_name").setStyle('backgroundColor', '#E5E5E5');
                    Y.one("#addUser_password").focus();
                }, 300);
            }
        }

        /**
         * The function handles click event on the menu item for the Users & Indexes
         * @param eventType The event type
         * @param args the arguments containing information about which menu item was clicked
         */
        function handleUserAndIndexEvent(event) {
            var label = $(event.currentTarget._node).closest("ul").closest("li")[0].attributes["data-collection-name"].value;
            var index = parseInt(event.currentTarget._node.attributes["index"].value);
            MV.appInfo.currentColl = label;
            if (label == MV.users) {
                switch (index) {
                    //Add User
                    case 1:
                        var showError = function(responseObject) {
                            MV.showAlertMessage("Adding user failed! Please check if your app server is running and then refresh the page.", MV.warnIcon);
                            Y.log("Add user failed. Response Status: [0]".format(responseObject.statusText), "error");
                        };

                        //Clear the dialog box before showing for adding the user(not working)
                        Y.one("#addUser_readonly").removeAttribute("checked");
                        Y.one("#addUser_user_name").setAttribute("value", "");
                        Y.one("#addUser_password").setAttribute("value", "");

                        //Remove the readonly attribute for the username text field when the dialog is used for adding user.
                        Y.one("#addUser_user_name").removeAttribute("readonly");
                        Y.one("#addUser_user_name").setStyle('backgroundColor', 'White');

                        MV.showSubmitDialog("addUserDialog", addUser, showError);
                        break;
                    case 2:
                        // Drop All the users present in the database
                        MV.showYesNoDialog("Do you want to drop all the users ?", dropUsers, function() {
                            this.hide();
                        });
                        break;

                }
            }
            if (label == MV.indexes) {
                //AddIndex
                switch (index) {
                    case 1:
                        var showError = function(responseObject) {
                            MV.showAlertMessage("Adding Index failed! Please check if your app server is running and then refresh the page.", MV.warnIcon);
                            Y.log("Add Index failed. Response Status: [0]".format(responseObject.statusText), "error");
                        };
                        MV.showSubmitDialog("addIndexDialog", addIndex, showError);
                        break;
                    case 2:
                        MV.showYesNoDialog("Do you want to drop Indexes on all the collections ?", dropAllIndexes, function() {
                            this.hide();
                        });
                        break;
                }
            }
        }


        /**
         * The function is the handler function for dropping the users. This function is called
         * when the user clicks on "YES" on the YesNO dialog box for confirming if the user wants to
         * drop the users or not. This function will delete all the users from the current high lighted
         * database.
         */

        function dropUsers() {
            //"this" refers to the YesNO dialog box
            this.hide();
            var request = Y.io(MV.URLMap.removeAllUsers(),
                // configuration for dropping the users
                {
                    method: "POST",
                    on: {
                        success: function(ioId, responseObj) {
                            var parsedResponse = Y.JSON.parse(responseObj.responseText),
                                response = parsedResponse.response.result,
                                error;
                            if (response !== undefined) {
                                MV.showAlertMessage(response, MV.infoIcon);
                                var collection = MV.getCollectionElementId(MV.appInfo.currentColl);
                                Y.one("#" + collection).simulate("click");
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
         * The function is the handler function for dropping the Indexes. This function is called
         * when the user clicks on "YES" on the YesNO dialog box for confirming if the user wants to
         * drop the Indexes or not. This function will delete all the Indexes on all the collections for
         * the selected database.
         */

        function dropAllIndexes() {
            //"this" refers to the YesNO dialog box
            this.hide();
            var request = Y.io(MV.URLMap.dropAllIndexes(),
                // configuration for dropping the indexes
                {
                    method: "POST",
                    on: {
                        success: function(ioId, responseObj) {
                            var parsedResponse = Y.JSON.parse(responseObj.responseText),
                                response = parsedResponse.response.result,
                                error;
                            if (response !== undefined) {
                                MV.showAlertMessage(response, MV.infoIcon);
                                sm.clearcurrentColl();
                                Y.one("#" + MV.getDatabaseElementId(MV.appInfo.currentDB)).simulate("click");
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
         * This method is the response handler for the addUser request.
         * @param responseObject
         */
        function addUser(responseObject) {
            var parsedResponse = Y.JSON.parse(responseObject.responseText),
                response = parsedResponse.response.result,
                error;
            if (response !== undefined) {
                MV.showAlertMessage(response, MV.infoIcon);
                var collection = MV.getCollectionElementId(MV.appInfo.currentColl);
                Y.one("#" + collection).simulate("click");

            } else {
                error = parsedResponse.response.error;
                MV.showAlertMessage("Could not add user ! [0]", MV.warnIcon, error.code);
                Y.log("Could not add user! [0]".format(MV.errorCodeMap[error.code]), "error");
            }
        }

        /**
         * This method is the response handler for the addIndex request
         * @param responseObject
         */
        function addIndex(responseObject) {
            var parsedResponse = Y.JSON.parse(responseObject.responseText),
                response = parsedResponse.response.result,
                error;
            if (response !== undefined) {
                MV.showAlertMessage(response, MV.infoIcon);
                var collection = MV.getCollectionElementId(MV.appInfo.currentColl);
                Y.one("#" + collection).simulate("click");
            } else {
                error = parsedResponse.response.error;
                MV.showAlertMessage("Could not add Index ! [0]", MV.warnIcon, error.code);
                Y.log("Could not add Index ! [0]".format(MV.errorCodeMap[error.code]), "error");
            }
        }

        // Make request to load the users/Indexes when a system.users or system.indexes name is clicked
        Y.delegate("click", initQueryBox, "#systemCollections", "a.collectionLabel");
        var systemCollDiv = Y.one("#systemCollections ul.lists");
        systemCollDiv.delegate('click', handleUserAndIndexEvent, 'a.onclick');
    });
