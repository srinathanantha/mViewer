package com.imaginea.mongodb.utils;

import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.mongodb.*;
import com.mongodb.client.MongoDatabase;

import org.bson.Document;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.StringTokenizer;

/**
 * User: venkateshr
 */
public class DatabaseQueryExecutor {

  public static JSONObject executeQuery(MongoDatabase db, String command, String queryStr,
      String fields, String sortByStr, int limit, int skip)
      throws JSONException, InvalidMongoCommandException {
    StringTokenizer strtok = new StringTokenizer(fields, ",");
    Document keysObj = new Document("_id", 1);
    while (strtok.hasMoreElements()) {
      keysObj.put(strtok.nextToken(), 1);
    }
    Document sortObj = Document.parse(sortByStr);
    if (command.equals("runCommand")) {
      return executeCommand(db, queryStr);
    }
    throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
        "Command is not yet supported");
  }

  private static JSONObject executeCommand(MongoDatabase db, String queryStr) throws JSONException {
    Document queryObj = Document.parse(queryStr);
    Document document = db.runCommand(queryObj);
    return ApplicationUtils.constructResponse(false, document);
  }
}
