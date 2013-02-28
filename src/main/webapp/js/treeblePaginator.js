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

YUI.add('treeble-paginator', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;

    MV.getTreeble = function(dataSource, type) {
        var Dom = YAHOO.util.Dom, Event = YAHOO.util.Event, DT = YAHOO.widget.DataTable;

        var treeColumnDef = [
            {
                key: "toggle_column",
                label: "",
                formatter: function(elCell, oRecord, oColumn, oData) {
                    Dom.addClass(elCell.parentNode, 'treeble-nub');
                    if (oRecord.getData('kiddies')) {
                        var path = oRecord.getData('_yui_node_path');
                        var open = this.rowIsOpen(path);
                        var clazz = open ? 'row-open' : 'row-closed';
                        Dom.addClass(elCell, 'row-toggle');
                        Dom.replaceClass(elCell, /row-(open|closed)/, clazz);
                        elCell.innerHTML = '<a class="treeble-collapse-nub" href="javascript:void(0);"></a>';
                        Event.on(elCell, 'click', function(e, path) {
                            this.toggleRow(path);
                        }, path, this);
                    }
                }
            },
            {
                key: "download_column",
                label: "",
                formatter: function(elCell, oRecord, oColumn, oData) {
                    var depth = oRecord.getData('_yui_node_depth');
                    var index = oRecord.getData('_yui_node_path');
                    if (depth == 0) {
                        Dom.addClass(elCell.parentNode, 'treeble-nub');
                        Dom.addClass(elCell, 'row-toggle');
                        elCell.innerHTML = "<a id='downloadFile[0]' class='download-icon' href='javascript:void(0);'></a>".format(index);
                        Y.on("click", function(e) {
                            MV.openFileEvent.fire({eventObj: e, isDownload: true});
                        }, elCell.firstChild);
                    }
                }
            },
            {
                key: "delete_column",
                label: "",
                formatter: function(elCell, oRecord, oColumn, oData) {
                    var depth = oRecord.getData('_yui_node_depth');
                    var index = oRecord.getData('_yui_node_path');
                    if (depth == 0) {
                        Dom.addClass(elCell.parentNode, 'treeble-nub');
                        Dom.addClass(elCell, 'row-toggle');
                        elCell.innerHTML = "<a id='deleteIcon[0]' class='delete-icon' href='javascript:void(0);'></a>".format(index);
                        Y.on("click", function(e) {
                            if (type == "file") {
                                MV.deleteFileEvent.fire({eventObj: e});
                            } else if (type == "document") {
                                MV.deleteDocEvent.fire({eventObj: e});
                            }
                        }, elCell.firstChild);
                    }
                }
            },
            {
                key: "key",
                label: "Key",
                width: MV.mainBody.get('scrollWidth') / 2 - 48,
                formatter: function(elCell, oRecord, oColumn, oData) {
                    elCell.innerHTML = '<span style="font-weight: bolder;padding-left:' + oRecord.getData('_yui_node_depth') * 15 + 'px;">' + oData + '</span>';
                    Y.on("click", function(e) {
                        MV.openFileEvent.fire({eventObj: e, isDownload: false});
                    }, elCell.firstChild.firstChild);
                }
            },
            {
                key: "value",
                label: "Value",
                width: MV.mainBody.get('scrollWidth') / 2 - 48,
                editor: new YAHOO.widget.TextboxCellEditor()
            }
        ];

        var treeDataSource = new YAHOO.util.TreebleDataSource(new YAHOO.util.DataSource(dataSource.result.documents, {
            responseType: YAHOO.util.DataSource.TYPE_JSARRAY,
            responseSchema: {
                fields: ["key", "value",
                    {
                        key: 'kiddies',
                        parser: 'datasource'
                    }]
            },
            treebleConfig: {
                generateRequest: function(state) {
                    return state;
                },
                totalRecordsReturnExpr: '.meta.totalRecords'
            }
        }), {
            paginateChildren: false
        });

        var treeConfig = {
            initialLoad: false,
            initialRequest: {
                startIndex: 0,
                results: 50 // Max resutls
            },
            dynamicData: true,
            displayAllRecords: true,
            generateRequest: function(oState, oSelf) {
                // Set defaults
                oState = oState || {
                    pagination: null,
                    sortedBy: null
                };
                var sort = encodeURIComponent((oState.sortedBy) ? oState.sortedBy.key : oSelf.getColumnSet().keys[0].getKey());
                var dir = (oState.sortedBy && oState.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";
                var startIndex = (oState.pagination) ? oState.pagination.recordOffset : 0;
                var results = (oState.pagination) ? oState.pagination.rowsPerPage : 50;  // Max resutls

                // Build the request
                var state = {
                    sort: sort,
                    dir: dir,
                    startIndex: startIndex,
                    results: results
                };
                return state;
            }
        };

        var treeTable = new YAHOO.widget.DataTable(
            "treeTable", // Root element id
            treeColumnDef, // Column configuration
            treeDataSource, // Data Source
            treeConfig);

        treeTable.handleDataReturnPayload = function(oRequest, oResponse, oPayload) {
            oPayload.totalRecords = oResponse.meta.totalRecords;
            return oPayload;
        };

        return treeTable;
    };

    MV.getTreebleDataForDocs = function(response) {
        var allDocs = response.documents,
            aDoc, parentNode, kiddiesArray, result = [];
        var i;
        var skip = parseInt(Y.one('#skip').get("value"));
        for (i = 0; i < allDocs.length; i++) {
            aDoc = allDocs[i];
            parentNode = {};
            kiddiesArray = [];
            parentNode.key = "Document [0]".format(skip + i + 1);
            kiddiesArray = getChildrenArray(aDoc);
            parentNode.kiddies = kiddiesArray.sort(sortFunc);
            result.push(parentNode);
        }
        return (prepareReturnObject(response, result));
    };

    MV.getTreebleDataForFiles = function(response) {
        var allDocs = response.documents,
            aDoc, parentNode, kiddiesArray, result = [];
        var i;
        for (i = 0; i < allDocs.length; i++) {
            aDoc = allDocs[i];
            parentNode = {};
            kiddiesArray = [];
            parentNode.key = "<a id='openFile[0]' href='javascript:void(0);' style='color:#0e2137'>[1]</a>".format(i, aDoc.filename);
            kiddiesArray = getChildrenArray(aDoc);
            parentNode.kiddies = kiddiesArray.sort(sortFunc);
            result.push(parentNode);
        }
        return (prepareReturnObject(response, result));
    };

    MV.getTreebleDataForServerStats = function(response) {
        var data = response.results[0];
        var aDoc, docCopy, parentNode, kiddiesArray, result = [],
            finalObject, resultObject;
        var i;
        var allKeys = MV.getProperties(data);
        for (i = 0; i < allKeys.length; i++) {
            parentNode = {};
            parentNode.key = allKeys[i];
            var value = data[allKeys[i]];
            if (MV.isObject(value)) {
                newArray = [];
                newArray = getChildrenArray(value);
                parentNode.kiddies = newArray;
            } else {
                parentNode.value = value;
            }
            result.push(parentNode);
        }
        return (prepareReturnObject(response, result));
    };

    var getChildrenArray = function(doc) {
        var i, tempObject, key, value, newArray, kiddiesArray = [];
        var allKeys = MV.getProperties(doc);
        for (i = 0; i < allKeys.length; i++) {
            tempObject = {};
            key = allKeys[i];
            tempObject.key = key;
            value = doc[key];
            if (MV.isArray(value)) {
                newArray = [];
                // tempObject.type = "BasicDBList";
                newArray = getChildrenArray(value);
                tempObject.kiddies = newArray;
            } else if (MV.isObject(value)) {
                newArray = [];
                // tempObject.type = "BasicDBObject";
                newArray = getChildrenArray(value);
                tempObject.kiddies = newArray;
            } else {
                tempObject.value = value;
            }
            kiddiesArray.push(tempObject);
        }
        return kiddiesArray;
    };

    var prepareReturnObject = function(response, result) {
        var returnObject = {};
        var resultObject = {};
        resultObject.documents = result;
        returnObject.result = resultObject;
        return (returnObject);
    };

    function sortFunc(a, b) {
        return a.key.localeCompare(b.key);
    }

}, '3.3.0', {
    requires: ["node"]
});
