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
            MV.deleteDocEvent.subscribe(deleteDoc);

            try {
                Y.log("Preparing the data tabs...", "info");
                MV.setHeader(MV.headerConstants.QUERY_RESPONSE);
                tabView.appendTo(MV.mainBody.get('id'));
                var treebleData = MV.getTreebleDataForDocs(response);
                var treeble = MV.getTreeble(treebleData, "document");
                // Remove download column for document operations
                treeble.removeColumn(treeble.getColumn("download_column"));
                if (!response.editable) {
                    // Remove delete column if not editable
                    treeble.removeColumn(treeble.getColumn("delete_column"));
                }
                treeble.load();
                treeble.subscribe("rowMouseoverEvent", treeble.onEventHighlightRow);
                treeble.subscribe("rowMouseoutEvent", treeble.onEventUnhighlightRow);
                populateJSONTab(response);
                sm.publish(sm.events.queryFired);
                MV.hideLoadingPanel();
                Y.log("Loaded data tabs.", "info");
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
            var trTemplate = [
                "<div class='docDiv' id='doc[0]'>",
                "<div class='textAreaDiv'><pre><textarea id='ta[1]' class='non-navigable' disabled='disabled' cols='74'>[2]</textarea></pre></div>",
                "</div>"
            ];

            if (response.editable) {
                trTemplate.splice(2, 0, "<div class='actionsDiv'>",
                    "<button id='edit[3]'class='bttn editbtn non-navigable'>edit</button>",
                    "<button id='delete[4]'class='bttn deletebtn non-navigable'>delete</button>",
                    "<button id='save[5]'class='bttn savebtn non-navigable invisible'>save</button>",
                    "<button id='cancel[6]'class='bttn cancelbtn non-navigable invisible'>cancel</button>",
                    "</div>")
            }
            trTemplate = trTemplate.join('\n');
            jsonView += "<table class='jsonTable'><tbody>";

            var documents = response.documents;
            for (var i = 0; i < documents.length; i++) {
                jsonView += trTemplate.format(i, i, Y.JSON.stringify(documents[i], null, 4), i, i, i, i);
            }
            if (i === 0) {
                jsonView = jsonView + "No documents to be displayed";
            }
            jsonView = jsonView + "</tbody></table></div>";
            tabView.getTab(0).setAttributes({
                content: jsonView
            }, false);
            for (i = 0; i < documents.length; i++) {
                Y.on("click", editDoc, "#edit" + i);
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
            Y.log("The documents written on the JSON tab", "debug");
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
         * The function toggles the save/cancel and edit/delete buttons. It just adds/removes class invisible.
         * Also it makes the textArea disabled/enabled based on the condition
         * @param targetNode The dom element on which is clicked
         * @param index the index number of the node that is clicked
         * @param action The action (save/edit) that has been performed
         */
        function toggleSaveEdit(targetNode, index, action) {
            var textArea = Y.one('#doc' + index).one("pre").one("textarea");
            if (action === actionMap.save) {
                textArea.addClass('disabled');
                textArea.setAttribute("disabled", "disabled");
                Y.one("#save" + index).addClass("invisible");
                Y.one("#cancel" + index).addClass("invisible");
                Y.one("#edit" + index).removeClass("invisible");
                Y.one("#delete" + index).removeClass("invisible");
            } else {
                textArea.removeAttribute("disabled");
                textArea.removeClass('disabled');
                Y.one("#edit" + index).addClass("invisible");
                Y.one("#delete" + index).addClass("invisible");
                Y.one("#save" + index).removeClass("invisible");
                Y.one("#cancel" + index).removeClass("invisible");
            }
            targetNode.focus();
        }

        /**
         * The function sends the update Document request.
         * @param doc The updated document
         * @param docId The id of the updated document
         */
        function sendUpdateDocRequest(doc, docId, eventObject) {
            var updateDocumentRequest = Y.io(MV.URLMap.updateDoc(), {
                method: "POST",
                data: "_id=" + docId + "&keys=" + doc,
                on: {
                    success: function(ioId, responseObject) {
                        var parsedResponse = Y.JSON.parse(responseObject.responseText);
                        var response = parsedResponse.response.result;
                        if (response !== undefined) {
                            var targetNode = eventObject.currentTarget;
                            var index = getButtonIndex(targetNode);
                            toggleSaveEdit(targetNode, index, actionMap.save);
                            MV.showAlertMessage("Document updated successfully.", MV.infoIcon);
                            Y.one('#execQueryButton').simulate('click');
                            Y.log("Document update to [0]".format(response), "info");
                        } else {
                            var error = parsedResponse.response.error;
                            MV.showAlertMessage("Could not update Document ! [0]", MV.warnIcon, error.code);
                            Y.log("Could not update Document ! [0]".format(MV.errorCodeMap[error.code]), "error");
                        }
                    },
                    failure: function(ioId, responseObject) {
                        MV.showAlertMessage("Unexpected Error: Could not update the document. Check if app server is running", MV.warnIcon);
                        Y.log("Could not send the request to update the document. Response Status: [0]".format(responseObject.statusText), "error");
                    }
                }
            });
        }

        /**
         * The function checks of all keys are selected in the fields list of the query box
         */

        function allKeysSelected() {
            var fields = Y.all('#fields input');
            var index;
            for (index = 0; index < fields.size(); index++) {
                var item = fields.item(index);
                if (!item.get("checked")) {
                    return false;
                }
            }
            return true;
        }

        /**
         * The function is an event handler to handle the delete button click.
         * It sends request to delete the document
         * @param eventObject The event Object
         */
        function deleteDoc(type, args) {
            var btnIndex;
            var sendDeleteDocRequest = function() {
                var targetNode = args[0].eventObj.currentTarget;
                var index = getButtonIndex(targetNode);
                var doc = Y.one('#doc' + index).one("pre").one("textarea").get("value");
                var parsedDoc = Y.JSON.parse(doc);
                var docId = Y.JSON.stringify(parsedDoc._id);
                var request = Y.io(MV.URLMap.deleteDoc(),
                    // configuration for dropping the document
                    {
                        method: "POST",
                        data: "_id=" + docId,
                        on: {
                            success: function(ioId, responseObj) {
                                var parsedResponse = Y.JSON.parse(responseObj.responseText);
                                var response = parsedResponse.response.result;
                                if (response !== undefined) {
                                    MV.showAlertMessage("Document deleted successfully.", MV.infoIcon);
                                    Y.log("Document with _id= [0] deleted. Response: [1]".format(docId, response), "info");
                                    Y.one('#execQueryButton').simulate('click');
                                } else {
                                    var error = parsedResponse.response.error;
                                    MV.showAlertMessage("Could not delete the document with _id [0]. [1]".format(docId, MV.errorCodeMap[error.code]), MV.warnIcon);
                                    Y.log("Could not delete the document with _id =  [0], Error message: [1], Error Code: [2]".format(docId, error.message, error.code), "error");
                                }
                            },
                            failure: function(ioId, responseObj) {
                                Y.log("Could not delete the document .Status text: ".format(MV.appInfo.currentColl, responseObj.statusText), "error");
                                MV.showAlertMessage("Could not drop the document! Please check if your app server is running and try again. Status Text: [1]".format(responseObj.statusText), MV.warnIcon);
                            }
                        }
                    });
                this.hide();
            };
            if (args[0].eventObj.currentTarget.hasClass('deletebtn') || args[0].eventObj.currentTarget.hasClass('delete-icon')) {
                MV.showYesNoDialog("Do you really want to drop the document ?", sendDeleteDocRequest, function() {
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
            try {
                var parsedDoc = Y.JSON.parse(doc);
                sendUpdateDocRequest(Y.JSON.stringify(parsedDoc), idMap[index].docId, eventObject);
            } catch (e) {
                var message = e.message.substr(e.message.indexOf(":") + 1);
                MV.showAlertMessage("Invalid Document format: " + message, MV.warnIcon);
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

        function editDoc(eventObject) {
            if (!allKeysSelected()) {
                MV.showYesNoDialog("To edit a document you need check all keys in query box. Click YES to do so, NO to cancel", function() {
                    Y.one('#selectAll').simulate('click');
                    Y.one('#execQueryButton').simulate('click');
                    this.hide();
                }, function() {
                    this.hide();
                });
            } else {
                var targetNode = eventObject.currentTarget;
                var index = getButtonIndex(targetNode);
                var textArea = Y.one('#doc' + index).one("pre").one("textarea");
                var doc = textArea.get("value");
                var parsedDoc = Y.JSON.parse(doc);
                var docId = Y.JSON.stringify(parsedDoc._id);
                idMap[index] = {};
                idMap[index].docId = docId;
                idMap[index].originalDoc = doc;
                toggleSaveEdit(targetNode, index, actionMap.edit);
                textArea.focus();
            }
        }

        Y.delegate("click", initQueryBox, "#collNames", "a.collectionLabel");
    });
