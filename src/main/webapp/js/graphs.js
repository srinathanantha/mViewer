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
}).use("io-base", "node", "json-parse", "utility", function(Y) {
        YUI.namespace('com.imaginea.mongoV');
        var MV = YUI.com.imaginea.mongoV;
        var pollingTime = 5000;
        var combinedChart;
        var chartOptions = "<table width='30%'>";
        chartOptions += "<tr>";
        chartOptions += "<td><button id='animation' class='bttn'>Stop Animation</button></td>";
        chartOptions += "</tr>";
        chartOptions += "</table>";

        function drawChart() {
            YAHOO.widget.Chart.SWFURL = "lib/yui2/build/charts/assets/charts.swf";
            var tabView = new YAHOO.widget.TabView();
            //Add tabs for Combined View, Queries, Updates etc
            tabView.addTab(new YAHOO.widget.Tab({
                label: 'Combined View',
                content: '<span class="chart_title">Combined View</span> <div class="chart" id="combinedChart"></div><center><span class="chart_title">Time Stamp</span></center>' + chartOptions,
                active: true,
                width: '100%'
            }));
            tabView.addTab(new YAHOO.widget.Tab({
                label: 'Queries',
                content: '<span class="chart_title">Queries/Second</span><div class="chart" id="queryChart"></div><center><span class="chart_title">Time Stamp</span></center>',
                width: '100%'
            }));
            //    Add a tab for the Update
            tabView.addTab(new YAHOO.widget.Tab({
                label: 'Updates',
                content: '<span class="chart_title">Updates/Second</span><div class="chart" id="updateChart"></div><center><span class="chart_title">Time Stamp</span></center>',
                width: '100%'
            }));
            //    Add a tab for the Delete
            tabView.addTab(new YAHOO.widget.Tab({
                label: 'Deletes',
                content: '<span class="chart_title">Deletes/Second</span><div class="chart" id="deleteChart"></div><center><span class="chart_title">Time Stamp</span></center>',
                width: '100%'
            }));
            //    Add a tab for the Insert
            tabView.addTab(new YAHOO.widget.Tab({
                label: 'Inserts',
                content: '<span class="chart_title">Inserts/Second</span><div class="chart" id="insertChart"></div><center><span class="chart_title">Time Stamp</span></center>',
                width: '100%'
            }));
            //Append TabView to its container div
            tabView.appendTo('tabContainer');
            //--- data
            var queryData = new YAHOO.util.DataSource(MV.URLMap.graphQuery());
            queryData.connMethodPost = false;
            queryData.responseType = YAHOO.util.DataSource.TYPE_JSON;
            queryData.responseSchema = {
                resultsList: "response.result",
                fields: ["TimeStamp", "QueryValue", "UpdateValue", "DeleteValue", "InsertValue"]
            };
            var seriesDef = [
                {
                    displayName: "Query",
                    yField: "QueryValue",
                    style: {
                        color: 0xFF4848
                    }
                },
                {
                    displayName: "Update",
                    yField: "UpdateValue",
                    style: {
                        color: 0xAE70ED
                    }
                },
                {
                    displayName: "Delete",
                    yField: "DeleteValue",
                    style: {
                        color: 0x62D0FF
                    }
                },
                {
                    displayName: "Insert",
                    yField: "InsertValue",
                    style: {
                        color: 0x2DC800
                    }
                }
            ];
            combinedChart = new YAHOO.widget.LineChart("combinedChart", queryData, {
                xField: "TimeStamp",
                series: seriesDef,
                style: {
                    legend: {
                        display: "right",
                        padding: 10,
                        spacing: 5,
                        font: {
                            family: "Arial",
                            size: 13
                        }
                    }
                }
            });
            var queryChart = new YAHOO.widget.LineChart("queryChart", queryData, {
                xField: "TimeStamp",
                yField: "QueryValue"
            });
            var updateChart = new YAHOO.widget.LineChart("updateChart", queryData, {
                xField: "TimeStamp",
                yField: "UpdateValue"
            });
            var deleteChart = new YAHOO.widget.LineChart("deleteChart", queryData, {
                xField: "TimeStamp",
                yField: "DeleteValue"
            });
            var insertChart = new YAHOO.widget.LineChart("insertChart", queryData, {
                xField: "TimeStamp",
                yField: "InsertValue"
            });
            var updateCharts = {
                success: function() {
                    queryChart._loadDataHandler.apply(queryChart, arguments);
                    updateChart._loadDataHandler.apply(updateChart, arguments);
                    deleteChart._loadDataHandler.apply(deleteChart, arguments);
                    insertChart._loadDataHandler.apply(insertChart, arguments);
                    combinedChart._loadDataHandler.apply(combinedChart, arguments);
                },
                failure: function() {
                    alert("Polling failure for getting Graph info");
                    Y.log("Polling failure for getting Graph info", "error");
                }
            };
            queryData.setInterval(pollingTime, null, updateCharts);
        }

        var cfg = {
            method: "GET",
            data: "pollingTime=" + pollingTime / 1000
        };

        function requestInitialData() {
            var fullUrl = window.location.search;
            MV.appInfo.connectionId = fullUrl.substring(fullUrl.indexOf("=") + 1);
            var sUrl = MV.URLMap.graphInitiate();
            var request = Y.io(sUrl, cfg);
        }

        function stopAnimation(e) {
            if (e.currentTarget.get("innerHTML") === 'Stop Animation') {
                combinedChart.setStyle("animationEnabled", false);
                e.currentTarget.set("innerHTML", "Start Animation");
            } else {
                combinedChart.setStyle("animationEnabled", true);
                e.currentTarget.set("innerHTML", "Stop Animation");
            }
        }

        Y.on("load", requestInitialData);

        Y.on('click', stopAnimation, '#animation');

        //Subscribe our handlers to IO's global custom events:
        Y.on('io:success', function(ioId, responseObject) {
            var parsedResponse = Y.JSON.parse(responseObject.responseText);
            response = parsedResponse.response.result;
            if (response !== undefined) {
                drawChart();
            } else {
                MV.showAlertMessage("Error: [0]".format(parsedResponse.response.error.message), MV.warnIcon);
                Y.log("Error: [0]".format(parsedResponse.response.error.message), "error");
            }
        });

        Y.on('io:failure', function(ioId, responseObject) {
            MV.showAlertMessage("Could not send request!", MV.warnIcon);
            Y.log("Sending request to initiate the graph failed. Response Status: [0]".format(responseObject.statusText), "error", "chart");
        });
    });
