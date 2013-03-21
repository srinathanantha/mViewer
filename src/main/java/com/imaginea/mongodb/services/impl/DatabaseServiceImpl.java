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

package com.imaginea.mongodb.services.impl;

import com.imaginea.mongodb.domain.ConnectionDetails;
import com.imaginea.mongodb.domain.MongoConnectionDetails;
import com.imaginea.mongodb.exceptions.*;
import com.imaginea.mongodb.services.AuthService;
import com.imaginea.mongodb.services.DatabaseService;
import com.imaginea.mongodb.utils.DatabaseQueryExecutor;
import com.mongodb.CommandResult;
import com.mongodb.DB;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * Defines services definitions for performing operations like create/drop on
 * databases present in mongo to which we are connected to. Also provides
 * service to get list of all databases present and Statistics of a particular
 * database.
 *
 * @author Srinath Anantha
 */
public class DatabaseServiceImpl implements DatabaseService {

    /**
     * Mongo Instance to communicate with mongo
     */
    private Mongo mongoInstance;
    private ConnectionDetails connectionDetails;

    private static final AuthService AUTH_SERVICE = AuthServiceImpl.getInstance();

    /**
     * Creates an instance of MongoInstanceProvider which is used to get a mongo
     * instance to perform operations on databases. The instance is created
     * based on a userMappingKey which is received from the database request
     * dispatcher and is obtained from tokenId of user.
     *
     * @param connectionId A combination of username,mongoHost and mongoPort
     */
    public DatabaseServiceImpl(String connectionId) throws ApplicationException {
        MongoConnectionDetails mongoConnectionDetails = AUTH_SERVICE.getMongoConnectionDetails(connectionId);
        mongoInstance = mongoConnectionDetails.getMongo();
        connectionDetails = mongoConnectionDetails.getConnectionDetails();
    }

    /**
     * Gets the list of databases present in mongo database to which user is
     * connected to.
     *
     * @return List of All Databases present in MongoDb
     * @throws DatabaseException If any error while getting database list.
     */

    public List<String> getDbList() throws DatabaseException {
        try {
            Set<String> authenticatedDbNames = connectionDetails.getAuthenticatedDbNames();
            if (!connectionDetails.isAdminLogin()) {
                return new ArrayList<String>(authenticatedDbNames);
            }
            return mongoInstance.getDatabaseNames();
        } catch (MongoException m) {
            throw new DatabaseException(ErrorCodes.GET_DB_LIST_EXCEPTION, m.getMessage());
        }
    }

    /**
     * Creates a Database with the specified name in mongo database to which
     * user is connected to.
     *
     * @param dbName Name of Database to be created
     * @return Success if Created else throws Exception
     * @throws DatabaseException   throw super type of
     *                             DuplicateDatabaseException,InsertDatabaseException
     * @throws ValidationException throw super type of EmptyDatabaseNameException
     */

    public String createDb(String dbName) throws DatabaseException, ValidationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        try {
            boolean dbAlreadyPresent = getDbList().contains(dbName);
            if (dbAlreadyPresent) {
                throw new DatabaseException(ErrorCodes.DB_ALREADY_EXISTS, "DB with name '" + dbName + "' ALREADY EXISTS");
            }

            mongoInstance.getDB(dbName).getCollectionNames();
            connectionDetails.addToAuthenticatedDbNames(dbName);
        } catch (MongoException e) {

            throw new DatabaseException("DB_CREATION_EXCEPTION", e.getMessage());
        }

        return "Created DB with name '" + dbName + "'";
    }

    /**
     * Deletes a Database with the specified name in mongo database to which
     * user is connected to.
     *
     * @param dbName Name of Database to be deleted
     * @return Success if deleted else throws Exception
     * @throws DatabaseException   throw super type of
     *                             UndefinedDatabaseException,DeleteDatabaseException
     * @throws ValidationException throw super type of EmptyDatabaseNameException
     */
    public String dropDb(String dbName) throws DatabaseException, ValidationException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");

        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        try {
            boolean dbPresent = getDbList().contains(dbName);
            if (!dbPresent) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "DB with name '" + dbName + "'  DOES NOT EXIST");
            }

            mongoInstance.dropDatabase(dbName);
        } catch (MongoException e) {

            throw new DatabaseException("DB_DELETION_EXCEPTION", e.getMessage());
        }

        return "Successfully dropped DB '" + dbName + "'. The page will reload now.";
    }

    /**
     * Return Stats of a particular Database in mongo to which user is connected
     * to.
     *
     * @param dbName Name of Database
     * @return Array of JSON Objects each containing a key value pair in Db
     *         Stats.
     * @throws JSONException       While parsing JSON
     * @throws DatabaseException   Error while performing this operation
     * @throws ValidationException throw super type of EmptyDatabaseNameException
     */

    public JSONArray getDbStats(String dbName) throws DatabaseException, ValidationException, JSONException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }

        JSONArray dbStats = new JSONArray();
        try {
            List<String> dbList = getDbList();
            boolean dbPresent = dbList.contains(dbName);
            if (!dbPresent) {
                throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "DB with name '" + dbName + "'  DOES NOT EXIST");
            }

            DB db = mongoInstance.getDB(dbName);
            CommandResult stats = db.getStats();
            Set<String> keys = stats.keySet();

            Iterator<String> keyIterator = keys.iterator();

            while (keyIterator.hasNext()) {
                JSONObject temp = new JSONObject();
                String key = keyIterator.next();
                temp.put("Key", key);
                String value = stats.get(key).toString();
                temp.put("Value", value);
                String type = stats.get(key).getClass().toString();
                temp.put("Type", type.substring(type.lastIndexOf('.') + 1));
                dbStats.put(temp);
            }
        } catch (MongoException m) {
            throw new DatabaseException(ErrorCodes.GET_DB_STATS_EXCEPTION, m.getMessage());
        }

        return dbStats;
    }

    /**
     * Gets the result of the command
     *
     * @param dbName   Name of Database
     * @param command  Name of the Command to be executed
     * @param queryStr query to be performed. In case of empty query {} return all
     * @param keys     Keys to be present in the resulted docs.
     * @param limit    Number of docs to show.
     * @param skip     Docs to skip from the front.
     * @return Result of executing the command.
     * @throws DatabaseException throw super type of UndefinedDatabaseException
     */
    public JSONObject executeQuery(String dbName, String command, String queryStr, String keys, String sortBy, int limit, int skip) throws DatabaseException, JSONException, InvalidMongoCommandException {
        if (dbName == null) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database name is null");
        }
        if (dbName.equals("")) {
            throw new DatabaseException(ErrorCodes.DB_NAME_EMPTY, "Database Name Empty");
        }
        List<String> databaseNames = getDbList();
        if (!databaseNames.contains(dbName)) {
            throw new DatabaseException(ErrorCodes.DB_DOES_NOT_EXISTS, "DB with name [" + dbName + "]DOES_NOT_EXIST");
        }
        try {
            DB db = mongoInstance.getDB(dbName);
            return DatabaseQueryExecutor.executeQuery(db, command, queryStr, keys, sortBy, limit, skip);
        } catch (MongoException e) {
            throw new DatabaseException(ErrorCodes.MONGO_EXCEPTION, e.getMessage());
        }
    }
}
