package com.imaginea.mongodb.utils;

import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.mongodb.*;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.StringTokenizer;

/**
 * User: venkateshr
 */
public class DatabaseQueryExecutor {

    public static JSONObject executeQuery(DB db, String command, String queryStr, String fields, String sortByStr, int limit, int skip) throws JSONException, InvalidMongoCommandException {
        StringTokenizer strtok = new StringTokenizer(fields, ",");
        DBObject keysObj = new BasicDBObject("_id", 1);
        while (strtok.hasMoreElements()) {
            keysObj.put(strtok.nextToken(), 1);
        }
        DBObject sortObj = (DBObject) JSON.parse(sortByStr);
        if (command.equals("runCommand")) {
            return executeCommand(db, queryStr);
        }
        throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED, "Command is not yet supported");
    }

    private static JSONObject executeCommand(DB db, String queryStr) throws JSONException {
        DBObject queryObj = (DBObject) JSON.parse(queryStr);
        CommandResult commandResult = db.command(queryObj);
        return ApplicationUtils.constructResponse(false, commandResult);
    }
}
