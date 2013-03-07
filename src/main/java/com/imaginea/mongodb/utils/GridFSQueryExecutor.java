package com.imaginea.mongodb.utils;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.mongodb.*;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.StringTokenizer;

/**
 * User: venkateshr
 */
public class GridFSQueryExecutor extends QueryExecutor {

    public static JSONObject executeQuery(DB db, DBCollection dbCollection, String command, String queryStr, String fields, String sortByStr, int limit, int skip) throws JSONException, ApplicationException {
        DBObject sortObj = (DBObject) JSON.parse(sortByStr);
        DBObject keysObj = null;
        StringTokenizer strtok = new StringTokenizer(fields, ",");
        if (strtok.hasMoreTokens()) {
            keysObj = new BasicDBObject();
            while (strtok.hasMoreElements()) {
                keysObj.put(strtok.nextToken(), 1);
            }
        }
        if (command.equals("drop")) {
            return executeDrop(dbCollection);
        } else if (command.equals("find")) {
            return executeFind(dbCollection, queryStr, keysObj, sortObj, limit, skip);
        }
        throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED, "Command is not yet supported");
    }

}
