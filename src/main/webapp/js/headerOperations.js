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
}).use("alert-dialog", "utility", "treeble-paginator", "node", "event-delegate", "custom-datatable", function(Y) {
        YUI.namespace('com.imaginea.mongoV');
        var MV = YUI.com.imaginea.mongoV;

        Y.delegate("click", handleHeaderOption, ".nav-link-right", "li a");
        Y.delegate("click", handleHeaderOption, ".nav-link-top", "li a");
        Y.on("click", disconnect, "#disconnect");

        function handleHeaderOption(eventObject) {
            var menuOpt = eventObject.currentTarget.get("id");
            MV.selectHeader(eventObject.currentTarget);
            if (menuOpt === "home") {
                window.location = "home.html?connectionId=" + MV.StateManager.connectionId();
            } else if (menuOpt === "serverStats") {
                MV.hideQueryForm();
                showServerStats();
                MV.header.addClass('tab-cont');
                MV.setHeader(MV.headerConstants.SERVER_STATS);
            } else if (menuOpt === 'graphs') {
                window.open(MV.URLMap.graphs(), '_newtab');
            } else if (menuOpt === 'help') {
                window.open(MV.URLMap.help(), '_newtab');
            }
        }

        function showServerStats() {
            var data = new YAHOO.util.XHRDataSource(MV.URLMap.serverStatistics(), {
                responseType: YAHOO.util.XHRDataSource.TYPE_JSON,
                responseSchema: {
                    resultsList: "response.result"
                }
            });
            data.sendRequest("", {
                success: function(request, responseObject) {
                    MV.mainBody.set("innerHTML", '<div id="treeTable"></div><div id="table-pagination"></div>');
                    var treebleData = MV.getTreebleDataForServerStats(responseObject);
                    treeble = MV.getTreeble(treebleData);
                    // Remove download & delete columns for server statistics
                    treeble.removeColumn(treeble.getColumn("download_column"));
                    treeble.removeColumn(treeble.getColumn("delete_column"));
                    treeble.load();
                },
                failure: function(request, responseObject) {
                    MV.showServerErrorMessage(responseObject);
                }
            });
        }

        function disconnect(eventObject) {
            Y.io(MV.URLMap.disconnect(), {
                method: "GET",
                on: {
                    success: function(ioId, responseObj) {
                        var response = MV.getResponseResult(responseObj);
                        if (response !== undefined) {
                            window.location = "index.html";
                        } else {
                            var errorMsg = "Cannot disconnect: " + MV.getErrorMessage(responseObj);
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
    });
