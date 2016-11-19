package com.imaginea.mongodb.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.StringTokenizer;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONException;
import org.json.JSONObject;

import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DatabaseException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.mongodb.MapReduceCommand;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;

/**
 * User: venkateshr
 */
public class QueryExecutor {

    public static JSONObject executeQuery(MongoDatabase db, MongoCollection<Document> mongoCollection,
                                          String collectionName, String command, String queryStr, String fields, String sortByStr,
                                          int limit, int skip, boolean allKeys) throws JSONException, ApplicationException {
        StringTokenizer strtok = new StringTokenizer(fields, ",");
        Document keysObj = new Document("_id", 1);
        while (strtok.hasMoreElements()) {
            keysObj.put(strtok.nextToken(), 1);
        }
        Document sortObj = Document.parse(sortByStr);
        if (command.equals("aggregate")) {
            return executeAggregate(mongoCollection, queryStr);
        }
        if (command.equals("count")) {
            return executeCount(mongoCollection, queryStr);
        }
        if (command.equals("distinct")) {
            return executeDistinct(mongoCollection, queryStr);
        }
        if (command.equals("drop")) {
            return executeDrop(mongoCollection);
        }
        if (command.equals("dropIndex")) {
            return executeDropIndex(mongoCollection, queryStr);
        }
        if (command.equals("dropIndexes")) {
            return executeDropIndexes(mongoCollection);
        }
        if (command.equals("ensureIndex")) {
            return executeEnsureIndex(mongoCollection, queryStr);
        }
        if (command.equals("find")) {
            return executeFind(mongoCollection, queryStr, keysObj, sortObj, limit, skip, allKeys);
        }
        if (command.equals("findOne")) {
            return executeFindOne(mongoCollection, queryStr);
        }
        if (command.equals("findAndModify")) {
            return executeFindAndModify(mongoCollection, queryStr, keysObj);
        }
        if (command.equals("group")) {
            return executeGroup(mongoCollection, queryStr);
        }
        if (command.equals("getIndexes")) {
            return executeGetIndexes(mongoCollection);
        }
        if (command.equals("insert")) {
            return executeInsert(mongoCollection, queryStr);
        }
        if (command.equals("mapReduce")) {
            return executeMapReduce(mongoCollection, queryStr);
        }
        if (command.equals("remove")) {
            return executeRemove(mongoCollection, queryStr);
        }
        if (command.equals("stats")) {
            return executeStats(db, collectionName);
        }
        if (command.equals("storageSize")) {
            return executeStorageSize(db, collectionName);
        }
        if (command.equals("totalIndexSize")) {
            return executeTotalIndexSize(db, collectionName);
        }
        if (command.equals("update")) {
            return executeUpdate(mongoCollection, queryStr);
        }
        throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                "Command is not yet supported");
    }

    private static JSONObject executeAggregate(MongoCollection<Document> mongoCollection,
                                               String queryStr) throws DatabaseException, JSONException {
        Document queryObj = Document.parse(queryStr);
        if (queryObj instanceof List) {
            List<Document> listOfAggregates = (List) queryObj;
            int size = listOfAggregates.size();

            MongoCursor<Document> resultIterator = mongoCollection.aggregate(listOfAggregates).iterator();

            // AggregationOutput aggregationOutput =
            // mongoCollection.aggregate(listOfAggregates.get(0),
            // listOfAggregates.subList(1, size).toArray(new Document[size -
            // 1]));
            // Iterator<Document> resultIterator =
            // aggregationOutput.results().iterator();
            List<Document> results = null;
            if (resultIterator.hasNext()) {
                results = new ArrayList<Document>();
                while (resultIterator.hasNext()) {
                    results.add(resultIterator.next());
                }
            }
            return ApplicationUtils.constructResponse(false, results.size(), results);
        }
        throw new DatabaseException(ErrorCodes.INVALID_AGGREGATE_COMMAND,
                "Aggregate command is ill formed");
    }

    private static JSONObject executeCount(MongoCollection<Document> mongoCollection, String queryStr)
            throws JSONException {
        Document queryObj = Document.parse(queryStr);
        long count = mongoCollection.count(queryObj);
        return ApplicationUtils.constructResponse(false, new Document("count", count));
    }

    private static JSONObject executeDistinct(MongoCollection<Document> mongoCollection,
                                              String queryStr) throws JSONException {
        Document queryObj = Document.parse(queryStr);
        List<String> distinctValuesList = null;
        MongoCursor<String> iterator = null;
        if (queryObj.get("1") == null) {
            iterator = mongoCollection.distinct((String) queryObj.get("0"), String.class).iterator();
        } else {
            iterator = mongoCollection
                    .distinct((String) queryObj.get("0"), (Document) queryObj.get("1"), String.class)
                    .iterator();
        }

        if (iterator.hasNext()) {
            distinctValuesList = new ArrayList<>();
            while (iterator.hasNext()) {
                distinctValuesList.add(iterator.next());
            }
        }

        return ApplicationUtils.constructResponse(false, distinctValuesList.size(), distinctValuesList);
    }

    private static JSONObject executeDrop(MongoCollection<Document> mongoCollection)
            throws JSONException {
        mongoCollection.drop();
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("success", true);
        return jsonObject;
    }

    private static JSONObject executeDropIndex(MongoCollection<Document> mongoCollection,
                                               String queryStr) throws JSONException, DatabaseException {
        Document indexInfo = Document.parse(queryStr);
        if (indexInfo == null) {
            throw new DatabaseException(ErrorCodes.INDEX_EMPTY, "Index is null");
        }

        mongoCollection.dropIndex(indexInfo);
        return executeGetIndexes(mongoCollection);
    }

    private static JSONObject executeDropIndexes(MongoCollection<Document> mongoCollection)
            throws JSONException {
        mongoCollection.dropIndexes();
        return executeGetIndexes(mongoCollection);
    }

    private static JSONObject executeEnsureIndex(MongoCollection<Document> mongoCollection,
                                                 String queryStr) throws JSONException, DatabaseException {
        Document queryObj = Document.parse(queryStr);
        Document keys = (Document) queryObj.get("0");
        if (keys == null) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index Keys are null");
        }
        if (keys.equals("")) {
            throw new DatabaseException(ErrorCodes.KEYS_EMPTY, "Index keys are Empty");
        }
        IndexOptions options = (IndexOptions) queryObj.get("1");
        if (options != null) {
            mongoCollection.createIndex(keys, options);
        } else {
            mongoCollection.createIndex(keys);
        }
        return executeGetIndexes(mongoCollection);
    }

    private static JSONObject executeFindOne(MongoCollection<Document> mongoCollection,
                                             String queryStr) throws JSONException {
        Document queryObj = Document.parse(queryStr);

        Document matchedRecord = (Document) mongoCollection.find((Document) queryObj.get("0"))
                .projection((Document) queryObj.get("1")).first();
        return ApplicationUtils.constructResponse(true, matchedRecord);

    }

    private static JSONObject executeFind(MongoCollection<Document> mongoCollection, String queryStr,
                                          Document keysObj, Document sortObj, int limit, int skip, boolean allKeys)
            throws JSONException {
        Document queryObj = Document.parse(queryStr);
        FindIterable<Document> cursor = null;
        if (allKeys) {
            cursor = mongoCollection.find(queryObj);
        } else {

            cursor = mongoCollection.find(queryObj).projection(keysObj);
        }
        cursor = cursor.sort(sortObj).skip(skip).limit(limit);
        MongoCursor<Document> iterator = cursor.iterator();
        ArrayList<Document> dataList = new ArrayList<Document>();
        if (iterator.hasNext()) {
            while (iterator.hasNext()) {
                Document document = iterator.next();

                if (document.get("_id") instanceof ObjectId) {
                    ObjectId objectId = (ObjectId) document.get("_id");
                    document.put("_id", objectId.toHexString());
                }
                dataList.add(document);
            }
        }


        return ApplicationUtils.constructResponse(true, mongoCollection.count(queryObj), dataList);
    }

    private static JSONObject executeFindAndModify(MongoCollection<Document> mongoCollection,
                                                   String queryStr, Document keysObj) throws JSONException {
        Document queryObj = Document.parse(queryStr);
        Document criteria = (Document) queryObj.get("query");
        Document sort = (Document) queryObj.get("sort");
        Document update = (Document) queryObj.get("update");
        keysObj = queryObj.get("fields") != null ? (Document) queryObj.get("") : keysObj;
        boolean returnNew = queryObj.get("new") != null ? (Boolean) queryObj.get("new") : false;
        boolean upsert = queryObj.get("upsert") != null ? (Boolean) queryObj.get("upsert") : false;
        boolean remove = queryObj.get("remove") != null ? (Boolean) queryObj.get("remove") : false;

        FindOneAndUpdateOptions options = new FindOneAndUpdateOptions();
        options.returnDocument(ReturnDocument.AFTER);
        options.upsert(upsert);
        options.sort(sort);

        Document queryResult = (Document) mongoCollection.findOneAndUpdate(criteria, update);

        // Document queryResult = mongoCollection.findAndModify(criteria,
        // keysObj, sort, remove, update, returnNew,upsert);
        return ApplicationUtils.constructResponse(false, queryResult);
    }

    private static JSONObject executeGetIndexes(MongoCollection<Document> mongoCollection)
            throws JSONException {
        MongoCursor<Document> cursor = mongoCollection.listIndexes().iterator();
        List<Document> indexInfo = null;
        if (cursor.hasNext()) {
            indexInfo = new ArrayList<>();
            while (cursor.hasNext()) {
                indexInfo.add(cursor.next());
            }
        }
        // List<Document> indexInfo = mongoCollection.getIndexInfo();
        return ApplicationUtils.constructResponse(false, indexInfo.size(), indexInfo);
    }

    private static JSONObject executeInsert(MongoCollection<Document> mongoCollection,
                                            String queryStr) throws JSONException {
        Document queryObj = Document.parse(queryStr);

        if (queryObj instanceof List) {
            mongoCollection.insertMany((List<Document>) queryObj);
        } else {
            mongoCollection.insertOne(queryObj);
        }

        return ApplicationUtils.constructResponse(false, queryObj);
    }

    private static JSONObject executeGroup(MongoCollection<Document> mongoCollection,
                                           String queryString) throws JSONException {
        Document queryObj = Document.parse(queryString);

        Document key = (Document) queryObj.get("key");
        Document cond = (Document) queryObj.get("cond");
        String reduce = (String) queryObj.get("reduce");
        Document initial = (Document) queryObj.get("initial");
        // There is no way to specify this.
        // Document keyf = (Document) queryObj.get("keyf");
        String finalize = (String) queryObj.get("finalize");

        Document groupQueryResult = (Document) mongoCollection
                .aggregate(Arrays.asList(new Document("$match", cond), new Document("$group", key)));

        // Document groupQueryResult = mongoCollection.group(key, cond, initial,
        // reduce, finalize);
        return ApplicationUtils.constructResponse(false, groupQueryResult);
    }

    private static JSONObject executeMapReduce(MongoCollection<Document> mongoCollection,
                                               String queryString) throws JSONException, InvalidMongoCommandException {
        Document queryObj = Document.parse(queryString);

        String map = (String) queryObj.get("0");
        String reduce = (String) queryObj.get("1");
        Document params = (Document) queryObj.get("2");
        String outputDb = null;
        MapReduceCommand.OutputType outputType = MapReduceCommand.OutputType.REPLACE;
        String outputCollection = null;

        if (params.get("out") instanceof Document) {
            Document out = (Document) params.get("out");
            if (out.get("sharded") != null) {
                throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                        "sharded is not yet supported. Please remove it and run again");
            }
            if (out.get("replace") != null) {
                if (out.get("nonAtomic") != null) {
                    throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                            "nonAtomic is not supported in replace mode. Please remove it and run again");
                }
                outputCollection = (String) out.get("replace");
                outputDb = (String) out.get("db");
                outputType = MapReduceCommand.OutputType.REPLACE;
            } else if (out.get("merge") != null) {
                outputCollection = (String) out.get("merge");
                outputDb = (String) out.get("db");
                outputType = MapReduceCommand.OutputType.INLINE;
            } else if (out.get("reduce") != null) {
                outputCollection = (String) out.get("reduce");
                outputDb = (String) out.get("db");
                outputType = MapReduceCommand.OutputType.INLINE;
            } else if (out.get("inline") != null) {
                outputType = MapReduceCommand.OutputType.INLINE;
                if (out.get("nonAtomic") != null) {
                    throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                            "nonAtomic is not supported in inline mode. Please remove it and run again");
                }
            }
        } else if (params.get("out") instanceof String) {
            outputCollection = (String) params.get("out");
        }

        Document query = (Document) params.get("query");
        Document sort = (Document) params.get("sort");
        int limit = 0;
        if (params.get("limit") != null) {
            limit = (Integer) params.get("limit");
        }
        String finalize = (String) params.get("finalize");
        Document scope = (Document) params.get("scope");
        if (params.get("jsMode") != null) {
            throw new InvalidMongoCommandException(ErrorCodes.COMMAND_NOT_SUPPORTED,
                    "jsMode is not yet supported. Please remove it and run again");
        }
        boolean verbose = true;
        if (params.get("verbose") != null) {
            verbose = (Boolean) params.get("verbose ");
        }

        Document mapReduceOutput = (Document) mongoCollection.mapReduce(map, reduce).filter(query)
                .sort(sort).finalizeFunction(finalize).scope(scope).verbose(verbose).limit(limit);

        // MapReduceCommand mapReduceCommand = new
        // MapReduceCommand(mongoCollection, map, reduce, outputCollection,
        // outputType, query);
        //
        // mapReduceCommand.setSort(sort);
        // mapReduceCommand.setLimit(limit);
        // mapReduceCommand.setFinalize(finalize);
        // mapReduceCommand.setScope(scope);
        // mapReduceCommand.setVerbose(verbose);
        // mapReduceCommand.setOutputDB(outputDb);
        //
        // MapReduceOutput mapReduceOutput =
        // mongoCollection.mapReduce(mapReduceCommand);

        // need to change

        // return ApplicationUtils.constructResponse(false,
        // mapReduceOutput.getCommandResult());
        return ApplicationUtils.constructResponse(false, mapReduceOutput);
    }

    private static JSONObject executeRemove(MongoCollection<Document> mongoCollection,
                                            String queryStr) throws JSONException {
        Document queryObj = Document.parse(queryStr);
        DeleteResult deleteResult = validateForDeleteOne(queryStr) ? mongoCollection.deleteOne(queryObj) : mongoCollection.deleteMany(queryObj);
        long count = deleteResult.getDeletedCount();

        // need to change

        // return ApplicationUtils.constructResponse(false,
        // result.getLastError());

        return ApplicationUtils.constructResponse(false, queryObj);

    }

    private static JSONObject executeUpdate(MongoCollection<Document> mongoCollection,
                                            String queryStr) throws JSONException, InvalidMongoCommandException {
        String reconstructedUpdateQuery = "{updateQueryParams:[" + queryStr + "]}";
        Document queryObj = Document.parse(reconstructedUpdateQuery);

        List queryParams = (List) queryObj.get("updateQueryParams");
        if (queryParams.size() < 2) {
            throw new InvalidMongoCommandException(ErrorCodes.COMMAND_ARGUMENTS_NOT_SUFFICIENT,
                    "Requires atleast 2 params");
        }
        Document criteria = (Document) queryParams.get(0);
        Document updateByValuesMap = (Document) queryParams.get(1);
        UpdateOptions options = new UpdateOptions();
        boolean upsert = false;
        boolean multi = false;
        if (queryParams.size() > 2) {
            for (Object queryParam : queryParams) {
                Document document = (Document) queryParam;
                if (document.containsKey("upsert")) {
                    upsert = document.getBoolean("upsert");
                }
                if (document.containsKey("multi")) {
                    multi = document.getBoolean("multi");
                }
            }
            options.upsert(upsert);
        }
        UpdateResult updateResult = multi ? mongoCollection.updateMany(criteria, updateByValuesMap, options) : mongoCollection.updateOne(criteria, updateByValuesMap, options);
        long count = updateResult.getModifiedCount();

        // need to change

        // CommandResult commandResult = updateResult.getLastError();
        // return ApplicationUtils.constructResponse(false, commandResult);
        return ApplicationUtils.constructResponse(false, queryObj);
    }

    private static JSONObject executeStats(MongoDatabase db, String collectionName)
            throws JSONException {

        Document stats = db.runCommand(new Document("collStats", collectionName));
        return ApplicationUtils.constructResponse(false, stats);
    }

    private static JSONObject executeStorageSize(MongoDatabase db, String collectionName)
            throws JSONException {
        Integer storageSize =
                (Integer) db.runCommand(new Document("collStats", collectionName)).get("storageSize");
        return ApplicationUtils.constructResponse(false, new Document("storageSize", storageSize));
    }

    private static JSONObject executeTotalIndexSize(MongoDatabase db, String collectionName)
            throws JSONException {
        Integer totalIndexSize =
                (Integer) db.runCommand(new Document("collStats", collectionName)).get("totalIndexSize");
        return ApplicationUtils.constructResponse(false,
                new Document("totalIndexSize", totalIndexSize));
    }

    private static boolean validateForDeleteOne(String queryString) {
        // if query string contains 1 or true after the remove condition, delete only one document.
        String filterPart = queryString.substring(queryString.lastIndexOf('}'));
        if (filterPart.contains(",")) {
            String[] filterArray = filterPart.split(",");
            if (filterArray.length == 2 && (filterArray[1].trim().equals("1") || filterArray[1].trim().equalsIgnoreCase("true")))
                return true;
        }
        return false;
    }

}
