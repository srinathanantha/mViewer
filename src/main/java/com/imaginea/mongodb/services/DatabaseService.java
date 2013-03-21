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
package com.imaginea.mongodb.services;

import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.imaginea.mongodb.exceptions.ValidationException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * Defines services for performing operations like create/drop on databases
 * present in the current mongo instance, see MongoInstanceProvider for details
 * about controlling the current instance. Also provides service to get list of
 * all databases present and Statistics of a particular database.
 *
 * @author Srinath Anantha
 */
public interface DatabaseService {

    /**
     * Gets the list of databases present in the current mongo instance
     *
     * @return List of All Databases present in MongoDb
     * @throws DatabaseException If any error while getting database list.
     */

    public List<String> getDbList() throws DatabaseException;

    /**
     * Return Stats of a particular Database in current mongo instance
     *
     * @param dbName Name of Database
     * @return Array of JSON Objects each containing a key value pair in Db
     *         Stats.
     * @throws JSONException       While parsing JSON
     * @throws DatabaseException   Error while performing this operation
     * @throws ValidationException throw super type of EmptyDatabaseNameException
     */
    public JSONArray getDbStats(String dbName) throws DatabaseException, ValidationException, JSONException;

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

    public String createDb(String dbName) throws DatabaseException, ValidationException;

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
    public String dropDb(String dbName) throws DatabaseException, ValidationException;

    /**
     *
     * @param dbName
     * @param command
     * @param queryStr
     * @param keys
     * @param sortBy
     * @param limit
     * @param skip
     * @return
     * @throws DatabaseException
     * @throws JSONException
     */
    public JSONObject executeQuery(String dbName, String command, String queryStr, String keys, String sortBy, int limit, int skip) throws DatabaseException, JSONException, InvalidMongoCommandException;

}
