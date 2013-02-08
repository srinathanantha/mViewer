var gRegistry = [];
YUI.add('utility', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;
    // Check if String.prototype.format already exists because in future
    // versions
    // format function can be added
    if (typeof String.prototype.format !== 'function') {
        String.prototype.format = function() {
            var formatted = this,
                i;
            for (i = 0; i < arguments.length; i++) {
                formatted = formatted.replace("[" + i + "]", arguments[i]);
            }
            return formatted;
        };
    }
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            var str = this;
            // AN typeof recipe for disaster in IE8
            // if (!str || typeof str !== 'string') {
            if (!str) {
                return "";
            } else {
                str = str.toString();
                return str.replace(/^[\s]+/, '').replace(/[\s]+$/, '').replace(/[\s]{2,}/, ' ');
            }
        };
    }

    MV.getProperties = function(doc) {
        var key, name, allKeys = [];
        for (key in doc) {
            if (doc.hasOwnProperty(key)) {
                allKeys.push(key);
            }
        }
        return allKeys;
    };
    MV.isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };
    MV.isObject = function(o) {
        return (typeof o === "object");
    };

    MV.mainBody = Y.one("#mainBody");
    MV.header = Y.one("#mainBodyHeader");
    MV.warnIcon = "warnIcon";
    MV.infoIcon = "infoIcon";
    MV.users = "system.users";
    MV.indexes = "system.indexes";
    MV.appInfo = {
        currentColl: "",
        currentDB: "",
        currentBucket: "",
        username: "",
        host: "",
        port: "",
        newName: "",
        connectionId: ""
    };

    MV.openFileEvent = new YAHOO.util.CustomEvent("OpenFile");
    MV.deleteFileEvent = new YAHOO.util.CustomEvent("DeleteFile");
    MV.deleteDocEvent = new YAHOO.util.CustomEvent("DeleteDoc");

    MV.selectHeader = function(node) {
        if (MV.selectedHeader) {
            MV.selectedHeader.removeClass('nav-link-sel');
        }
        $(node._node).closest('a').addClass('nav-link-sel');
        MV.selectedHeader = $(node._node).closest('a');
    };

    MV.databaseIdPrefix = "db-";
    MV.collectionIdPrefix = "coll-";
    MV.bucketIdPRefix = "bucket-";

    MV.getDatabaseElementId = function(databaseName) {
        return MV.databaseIdPrefix + (databaseName.replace(/ /g, '_').replace('.', '_'));
    };

    MV.getCollectionElementId = function(collectionName) {
        return MV.collectionIdPrefix + (collectionName.replace(/ /g, '_').replace('.', '_'));
    };

    MV.getBucketElementId = function(bucketName) {
        return MV.bucketIdPRefix + bucketName.replace(/ /g, '_');
    };

    MV.selectDatabase = function(node) {
        if (MV.selectedDB) {
            MV.selectedDB.removeClass('sel');
        }
        $(node._node).closest('li').addClass('sel');
        MV.selectedDB = $(node._node).closest('li');
    };

    /* Highlights the selected database item(collection, bucket, system collections)*/
    MV.selectDBItem = function(node) {
        if (MV.selectedDBItem) {
            MV.selectedDBItem.removeClass('sel');
        }
        $(node._node).closest('li').addClass('sel');
        MV.selectedDBItem = $(node._node).closest('li');
    };

    MV.StateManager = (function() {
        var self = this, stateVariables = ['currentDB', 'currentColl', 'currentBucket', 'host', 'port', 'connectionId', 'newName'], exports = {}, i = 0;

        function getVal(key) {
            return MV.appInfo[key];
        }

        function setVal(key, value) {
            MV.appInfo[key] = value;
        }

        function deliverEvent(eventName, eventArgs) {
            var callbackArray = gRegistry[eventName];
            for (var i = 0; i < callbackArray.length; i++) {
                callbackArray[i].call(this, eventArgs);
            }
        }

        function methodMaker(stateVariable) {
            exports[stateVariable] = function() {
                return getVal(stateVariable);
            };
            exports[stateVariable + "AsNode"] = function() {
                var id = getVal(stateVariable).replace(/ /g, '_').replace('.', '_');
                return Y.one('#' + id);
            };

            var upcasedVar = stateVariable.substring(0, 1).toUpperCase() + stateVariable.substring(1);
            exports['set' + upcasedVar] = function(newValue) {
                return setVal(stateVariable, newValue);
            };
            exports['clear' + upcasedVar] = function(newValue) {
                return setVal(stateVariable, "");
            };
        }

        // AN stupid IE8 does not understand forEach
        for (i = 0; i < stateVariables.length; i++) {
            var currVariable = stateVariables[i];
            methodMaker(currVariable);
        }

        exports.connectionId = function() {
            if (!MV.appInfo.connectionId) {
                var query = window.location.search.substring(1);
                var vars = query.split("&");
                var params = new Array()
                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split("=");
                    params[pair[0]] = pair[1]
                }
                MV.appInfo.connectionId = params["connectionId"];
            }
            return MV.appInfo.connectionId;
        };

        exports.publish = function(eventName, eventArgs) {
            if (gRegistry[eventName]) {
                deliverEvent(eventName, eventArgs);
            }
        };

        exports.subscribe = function(callback, eventArgs) {
            var i = 0, eventNames;
            // if it is not a number assume it is an array
            if (isNaN(eventArgs)) {
                eventNames = eventArgs;
            } else {
                eventNames = [eventArgs];
            }

            for (; i < eventNames.length; i++) {
                eventName = eventNames[i];
                if (gRegistry[eventName] === undefined) {
                    gRegistry[eventName] = [];
                }
                gRegistry[eventName].push(callback);
            }
        };
        exports.recordLastArrowNavigation = function() {
            self.lastArrowNavTS = new Date().getTime();
        };
        exports.isNavigationSideEffect = function() {
            return ((self.lastArrowNavTS) ? ((new Date().getTime() - self.lastArrowNavTS) < 100) : false);
        };
        exports.now = function() {
            return new Date().getTime().toString();
        };
        exports.events = {
            collectionsChanged: 1,
            dbsChanged: 2,
            queryFired: 3,
            openFile: 4
        };
        return exports;

    }());

    var sm = MV.StateManager;

    MV.URLMap = {
        getConnectionDetails: function() {
            return "services/login/details?connectionId=[0]&ts=[1]".format(sm.connectionId());
        },
        getDBs: function() {
            return "services/db?connectionId=[0]&ts=[1]".format(sm.connectionId());
        },
        insertDB: function() {
            return "services/db/[0]?connectionId=[1]&action=PUT&ts=[2]".format(sm.newName(), sm.connectionId(), sm.now());
        },
        dropDB: function() {
            return "services/db/[0]?connectionId=[1]&action=DELETE&ts=[2]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        dbStatistics: function() {
            return "services/stats/db/[0]?connectionId=[1]&ts=[2]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        getColl: function() {
            return "services/[0]/collection?connectionId=[1]&ts=[2]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        insertColl: function() {
            return "services/[0]/collection/[1]?connectionId=[2]&action=PUT&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        dropColl: function() {
            return "services/[0]/collection/[1]?connectionId=[2]&action=DELETE&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        isCappedCollection: function() {
            return "services/[0]/collection/[1]/isCapped?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        collStatistics: function() {
            return "services/stats/db/[0]/collection/[1]?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        adduser: function() {
            return "services/[0]/usersIndexes/addUser?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        removeUser: function() {
            return "services/[0]/usersIndexes/removeUser?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        removeAllUsers: function() {
            return "services/[0]/usersIndexes/removeAllUsers?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        addIndex: function() {
            return "services/[0]/usersIndexes/addIndex?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        dropIndex: function() {
            return "services/[0]/usersIndexes/dropIndex?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        dropAllIndexes: function() {
            return "services/[0]/usersIndexes/dropAllIndexes?connectionId=[1]&ts=[3]".format(sm.currentDB(), sm.connectionId(), sm.now());
        },
        getDocKeys: function() {
            return "services/[0]/[1]/document/keys?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        getDocs: function(params) {
            return "services/[0]/[1]/document?connectionId=[2]&ts=[3][4]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now(), params);
        },
        insertDoc: function() {
            return "services/[0]/[1]/document?connectionId=[2]&action=PUT&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        updateDoc: function() {
            return "services/[0]/[1]/document?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        deleteDoc: function() {
            return "services/[0]/[1]/document?connectionId=[2]&action=DELETE&ts=[3]".format(sm.currentDB(), sm.currentColl(), sm.connectionId(), sm.now());
        },
        addGridFS: function(bucketName) {
            return "services/[0]/[1]/gridfs/create?connectionId=[2]&ts=[3]".format(sm.currentDB(), bucketName, sm.connectionId(), sm.now());
        },
        getFilesCount: function() {
            return "services/[0]/[1]/gridfs/count?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentBucket(), sm.connectionId(), sm.now());
        },
        getFiles: function() {
            return "services/[0]/[1]/gridfs/getfiles?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentBucket(), sm.connectionId(), sm.now());
        },
        getFile: function(id, download) {
            return "services/[0]/[1]/gridfs/getfile?id=[2]&download=[3]&connectionId=[4]&ts=[5]".format(sm.currentDB(), sm.currentBucket(), id, download, sm.connectionId(), sm.now());
        },
        insertFile: function() {
            return "services/[0]/[1]/gridfs/uploadfile?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentBucket(), sm.connectionId(), sm.now());
        },
        deleteFile: function(id) {
            return "services/[0]/[1]/gridfs/dropfile?id=[2]&connectionId=[3]&ts=[4]".format(sm.currentDB(), sm.currentBucket(), id, sm.connectionId(), sm.now());
        },
        dropBucket: function() {
            return "services/[0]/[1]/gridfs/dropbucket?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentBucket(), sm.connectionId(), sm.now());
        },
        bucketStatistics: function(ext) {
            return "services/stats/db/[0]/collection/[1]?connectionId=[2]&ts=[3]".format(sm.currentDB(), sm.currentBucket() + ext, sm.connectionId(), sm.now());
        },
        login: function() {
            return "services/login";
        },
        disconnect: function() {
            return "services/disconnect?connectionId=[0]".format(sm.connectionId());
        },
        serverStatistics: function() {
            return "services/stats?connectionId=[0]&ts=[1]".format(sm.connectionId(), sm.now());
        },
        help: function() {
            return "http://imaginea.github.com/mViewer/";
        },
        troubleShootPage: function() {
            return "troubleshoot.html";
        },
        troubleShoot: function() {
            return "admin";
        },
        graphs: function() {
            return "graphs.html?connectionId=[0]&ts=[1]".format(sm.connectionId(), sm.now());
        },
        graphInitiate: function() {
            return "graphs/initiate?connectionId=[0]&ts=[1]".format(sm.connectionId(), sm.now());
        },
        graphQuery: function() {
            return "graphs/query?connectionId=[0]&ts=[1]".format(sm.connectionId(), sm.now());
        }
    };

    MV.errorCodeMap = {
        "HOST_UNKNOWN": "Connection Failed ! Please check if MongoDB is running at the given host and port !",
        "MISSING_LOGIN_FIELDS": "Please fill in all the login fields !",
        "ERROR_PARSING_PORT": "You have entered an invalid port number !",
        "INVALID_ARGUMENT": "You have entered an invalid input data !",
        "INVALID_USERNAME": "You have entered an invalid username and password combination ! To access you need to add user in admin database of mongodb.",
        "NEED_AUTHORISATION": "mongod is running in secure mode. Please enter username and password.",
        "INVALID_SESSION": "Your session has timed out ! Please login again.",
        "INVALID_CONNECTION": "You are currently not connected to Mongo DB ! Please Connect.",
        "GET_DB_LIST_EXCEPTION": "Could not load the DB list ! Please check if mongo is still running and then refresh the page.",
        "GET_COLLECTION_LIST_EXCEPTION": "Please check if mongod is still running and then refresh the page.",
        "DB_DELETION_EXCEPTION": "Please check if mongo is running and then refresh the page and try again.",
        "DB_DOES_NOT_EXISTS": "The db you are trying to delete does not exist! Refresh the page.",
        "DB_NAME_EMPTY": "Received an empty name for the database which is invalid",
        "DB_ALREADY_EXISTS": "A database with the given name already exist ! Try another name.",
        "COLLECTION_ALREADY_EXISTS": "A collection with the given name already exists ! Try another name.",
        "COLLECTION_DOES_NOT_EXIST": "The collection you are trying to delete does not exist !",
        "COLLECTION_NAME_EMPTY": "Recieved an empty collection name.",
        "GET_DOCUMENT_LIST_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "DOCUMENT_DELETION_EXCEPTION": " Please check if mongod is running and refresh the page.",
        "DOCUMENT_CREATION_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "DOCUMENT_UPDATE_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "DOCUMENT_DOES_NOT_EXIST": "Document does not exist !",
        "INVALID_USER": "Your session is corrupted or timed out ! Please login again from the login page.",
        "DB_INFO_ABSENT": "Mongo Config details are not provided in session ! Please login again from the login page.",
        "GET_DB_STATS_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "GET_COLL_STATS_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "COLLECTION_CREATION_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "COLLECTION_UPDATE_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "COLLECTION_DELETION_EXCEPTION": "Please check if mongod is running and refresh the page.",
        "INVALID_OBJECT_ID": "Value provided for '_id' is invalid .",
        "UPDATE_OBJECT_ID_EXCEPTION": "_id cannot be updated.",
        "ANY_OTHER_EXCEPTION": "An unknown exception occured ! Please try to login again.",
        "ERROR_INITIATING_GRAPH": "Could not initiate the graph ! Please check if mongod is running.",
        "FILE_NOT_FOUND": "Logger Config File or Mongo Config File cannot be found ! Please check if they are present in the resources of src/main and src/test respectively.",
        "IO_EXCEPTION": "An IO Exception Occured ! Please Refresh the page.",
        "ERROR_PARSING_POLLING_INTERVAL": "An error occured while initiating graph ! Please chcek if polling interval is passed.",
        "LOGGING_LEVEL_UNDEFINED": "The Logging level that you are trying to change to is undefined for log4j logger. Please select from the given options only.",
        "DELETING_FROM_CAPPED_COLLECTION": "Deleting from a Capped Collection is not allowed by database. Drop the whole Collection instead.",
        "USERNAME_IS_EMPTY": "Username is empty",
        "PASSWORD_IS_EMPTY": "Password is empty",
        "KEYS_EMPTY": "Index keys is empty",
        "INDEX_EMPTY": "Index name is empty"
    };
}, '3.3.0', {
    requires: ["node"]
});
