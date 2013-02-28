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
            } else if (menuOpt === 'troubleshoot') {
                window.open(MV.URLMap.troubleShootPage(), '_newtab');
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
                    MV.showAlertMessage("Failed: ServerStats could not be loaded! Please check if the app server is still running.", MV.warnIcon);
                    Y.log("Server Statistics could not be loaded. Response Status: [0]".format(responseObject.statusText), "error");
                }
            });
        }

        function disconnect(eventObject) {
            Y.io(MV.URLMap.disconnect(), {
                method: "GET",
                on: {
                    success: function(ioId, responseObject) {
                        var parsedResponse = Y.JSON.parse(responseObject.responseText);
                        var response = parsedResponse.response.result;
                        if (response !== undefined) {
                            window.location = "index.html";
                        } else {
                            var error = parsedResponse.response.error;
                            MV.showAlertMessage("Cannot disconnect! [0]", MV.warnIcon, error.code);
                            Y.log("Could not disconnect. Message: [0], Code: [1]".format(error.message, error.code), "error");
                        }
                    },
                    failure: function(ioId, responseObject) {
                        MV.showAlertMessage("Could not send request. Check if app server is running. Response message: [0]".format(responseObject.statusText), MV.warnIcon);
                        Y.log("Could not send request to disconnect. Status text: [0] ".format(responseObject.statusText), "error");
                    }
                }
            });
        }
    });
