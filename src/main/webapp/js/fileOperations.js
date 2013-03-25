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
}).use("loading-panel", "yes-no-dialog", "alert-dialog", "upload-dialog", "io-base", "json-parse", "node-event-simulate", "node", "event-delegate", "json-stringify", "utility", "treeble-paginator", "event-key", "event-focus", "node-focusmanager", function(Y) {
        YUI.namespace('com.imaginea.mongoV');
        var MV = YUI.com.imaginea.mongoV, sm = MV.StateManager;
        MV.treebleData = {};
        var tabView = new YAHOO.widget.TabView();
        tabView.addTab(new YAHOO.widget.Tab({
            label: 'JSON',
            cacheData: true
        }));
        tabView.addTab(new YAHOO.widget.Tab({
            label: 'Tree Table',
            content: ' <div id="treeTable"></div><div id="table-pagination"></div> ',
            active: true
        }));

        var queryExecutor;

        var initQueryBox = function(event) {
            sm.publish(sm.events.actionTriggered);
            MV.appInfo.currentBucket = event.currentTarget.getAttribute("data-bucket-name");
            MV.selectDBItem(event.currentTarget);
            var config = {
                keysUrl: MV.URLMap.getFilesCount(),
                dataUrl: MV.URLMap.getFiles(),
                query: "db.[0].files.find({\r\r})".format(sm.currentBucket()),
                currentSelection: sm.currentBucket(),
                showKeys: false
            };
            queryExecutor = MV.loadQueryBox(config, showTabView);
        };

        /**
         * The function is an event handler to show the files whenever a bucket name is clicked
         * @param {object} e It is an event object
         *
         */
        var showTabView = function(response) {
            MV.openFileEvent.unsubscribeAll();
            MV.openFileEvent.subscribe(getFile);
            MV.deleteFileEvent.unsubscribeAll();
            MV.deleteFileEvent.subscribe(deleteFile);

            try {
                MV.setHeader(MV.headerConstants.QUERY_RESPONSE);
                var mainBody = MV.mainBody;
                var mainBodyId = mainBody.get('id');
                tabView.appendTo(mainBodyId);
                mainBody.all("div.yui-navset li").each(function(item){
                    item.addClass('navigable');
                    item.setAttribute('data-search_name',item.one('em').getContent());
                });
                var treebleData = MV.getTreebleDataForFiles(response);
                var treeble = MV.getTreeble(treebleData, "file");
                if (!response.editable) {
                    // Remove download column for document operations
                    treeble.removeColumn(treeble.getColumn("download_column"));
                    // Remove delete column if not editable
                    treeble.removeColumn(treeble.getColumn("delete_column"));
                }
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
         * The function creates the json view and adds the edit,delete,save and cancel buttons for each file
         * @param response The response Object containing all the files
         */
        function populateJSONTab(response) {
            var jsonView = "<div class='buffer jsonBuffer'>";

            var trTemplate = ["<div id='file[0]' class='docDiv navigable'>",
                "<div class='textAreaDiv'><pre> <textarea id='ta[1]' class='disabled' disabled='disabled' cols='75'>[2]</textarea></pre></div>",
                "</div>"];

            if (response.editable) {
                trTemplate.splice(2, 0, "<div class='actionsDiv'>",
                    "  <button id='open[3]'class='bttn openbtn navigableChild' data-search_name='open'>open</button>",
                    "  <button id='download[4]'class='bttn downloadbtn navigableChild' data-search_name='download'>download</button>",
                    "  <button id='delete[5]'class='bttn deletebtn navigableChild' data-search_name='delete'>delete</button>",
                    "</div>");
            }
            trTemplate = trTemplate.join('\n');
            jsonView += "<table class='jsonTable'><tbody>";

            var documents = response.documents;
            for (var i = 0; i < documents.length; i++) {
                jsonView += trTemplate.format(i, i, Y.JSON.stringify(documents[i], null, 4), i, i, i);
            }
            if (i === 0) {
                jsonView = jsonView + "No files to be displayed";
            }
            jsonView = jsonView + "</tbody></table></div>";
            tabView.getTab(0).setAttributes({
                content: jsonView
            }, false);
            for (i = 0; i < documents.length; i++) {
                Y.on("click", function(e) {
                    MV.openFileEvent.fire({eventObj: e, isDownload: false});
                }, "#open" + i);
                Y.on("click", function(e) {
                    MV.openFileEvent.fire({eventObj: e, isDownload: true});
                }, "#download" + i);
                Y.on("click", function(e) {
                    MV.deleteFileEvent.fire({eventObj: e});
                }, "#delete" + i);
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
                    var openBtn = currentTR.one('button.openbtn');
                    if (openBtn) {
                        openBtn.focus();
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
        }

        /**
         * The function is an event handler to handle the open button click.
         * It opens the file in new tab
         * @param eventObject The event Object
         */
        function getFile(type, args) {
            var targetNode = args[0].eventObj.currentTarget;
            var index = getButtonIndex(targetNode);
            var doc = Y.one('#file' + index).one("pre").one("textarea").get("value");
            var parsedDoc = Y.JSON.parse(doc);
            var docId = Y.JSON.stringify(parsedDoc._id);
            if (args[0].isDownload == true) {
                if (!MV._downloadIframe) {
                    MV._downloadIframe = document.createElement("iframe");
                    MV._downloadIframe.style.display = "none";
                    document.body.appendChild(MV._downloadIframe);
                }
                MV._downloadIframe.src = MV.URLMap.getFile(docId, true);
            } else {
                window.open(MV.URLMap.getFile(docId, false));
            }
        }

        /**
         * The function is an event handler to handle the delete button click.
         * It sends request to delete the file
         * @param eventObject The event Object
         */
        function deleteFile(type, args) {
            var sendDeleteFileRequest = function() {
                var targetNode = args[0].eventObj.currentTarget;
                var index = getButtonIndex(targetNode);
                var doc = Y.one('#file' + index).one("pre").one("textarea").get("value");
                var parsedDoc = Y.JSON.parse(doc);
                var docId = Y.JSON.stringify(parsedDoc._id);
                var request = Y.io(MV.URLMap.deleteFile(docId), {
                    on: {
                        success: function(ioId, responseObject) {
                            var jsonObject = MV.toJSON(responseObject);
                            var responseResult = MV.getResponseResult(jsonObject);
                            if (responseResult) {
                                MV.showAlertMessage(responseResult, MV.infoIcon);
                                // Re-execute the cached find query to update the view with the new resultSet
                                queryExecutor.adjustQueryParamsOnDelete(1);
                                queryExecutor.executeCachedQuery();
                            } else {
                                var errorMsg = "Could not delete the file: " + MV.getErrorMessage(jsonObject);
                                MV.showAlertMessage(errorMsg, MV.warnIcon, MV.getErrorCode(jsonObject));
                                Y.log(errorMsg, "error");
                            }
                        },
                        failure: function(ioId, responseObject) {
                            MV.showServerErrorMessage(responseObject);
                        }
                    }
                });
                this.hide();
            };

            MV.showYesNoDialog("Delete File", "Are you sure you want to delete the file ?", sendDeleteFileRequest, function() {
                this.hide();
            });
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
                    adjustedHeight = Math.max(text.scrollHeight, adjustedHeight);
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

        Y.delegate("click", initQueryBox, "#bucketNames", "a.collectionLabel");
    });
