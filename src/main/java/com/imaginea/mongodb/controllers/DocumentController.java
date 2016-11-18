/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd. Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in
 * writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
package com.imaginea.mongodb.controllers;

import java.util.HashSet;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;
import org.bson.Document;
import org.json.JSONException;
import org.json.JSONObject;

import com.imaginea.mongodb.domain.DocumentUserQueryData;
import com.imaginea.mongodb.exceptions.ApplicationException;
import com.imaginea.mongodb.exceptions.DocumentException;
import com.imaginea.mongodb.exceptions.ErrorCodes;
import com.imaginea.mongodb.exceptions.InvalidMongoCommandException;
import com.imaginea.mongodb.services.DocumentService;
import com.imaginea.mongodb.services.impl.DocumentServiceImpl;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;

import io.swagger.annotations.Api;

/**
 * Defines resources for performing create/delete/update operations on documents present inside
 * collections in databases in Mongo we are currently connected to. Also provide resources to get
 * list of all documents present inside a collection in a database in mongo.
 * <p/>
 * These resources map different HTTP requests made by the client to access these resources to
 * services file which performs these operations. The resources also form a JSON response using the
 * output received from the services files. GET and POST request resources for documents are defined
 * here. For PUT and DELETE functionality , a POST request with an action parameter taking values
 * PUT and DELETE is made.
 *
 * @author Rachit Mittal
 * @since 6 July 2011
 */
@Path("/{dbName}/{collectionName}/document")
@Api(value = "/{dbName}/{collectionName}/document", description = "Mongo Collection Documents Operations")
public class DocumentController extends BaseController {
  private final static Logger logger = Logger.getLogger(DocumentController.class);


  /**
   * Maps GET Request to get list of documents inside a collection inside a database present in
   * mongo db to a service function that returns the list. Also forms the JSON response for this
   * request and sent it to client. In case of any exception from the service files an error object
   * if formed.
   *
   * @param dbName Name of Database
   * @param collectionName Name of Collection
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with list of All Documents in a collection.
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public String executeQuery(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName,
      @QueryParam("query") final String query,
      @QueryParam("connectionId") final String connectionId,
      @QueryParam("fields") final String fields, @QueryParam("limit") final String limit,
      @QueryParam("skip") final String skip, @QueryParam("sortBy") final String sortBy,
      @QueryParam("allKeys") final boolean allKeys, @Context final HttpServletRequest request)
      throws JSONException {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            DocumentService documentService = new DocumentServiceImpl(connectionId);
            // Get query
            int startIndex = query.indexOf("("), endIndex = query.lastIndexOf(")");
            if (startIndex == -1 || endIndex == -1) {
              throw new InvalidMongoCommandException(ErrorCodes.INVALID_QUERY, "Invalid query");
            }
            String cmdStr = query.substring(0, startIndex);
            int lastIndexOfDot = cmdStr.lastIndexOf(".");
            if (lastIndexOfDot + 1 == cmdStr.length()) {
              // In this case the cmsStr = db.collectionName.
              throw new InvalidMongoCommandException(ErrorCodes.COMMAND_EMPTY, "Command is empty");
            }
            String command = cmdStr.substring(lastIndexOfDot + 1, cmdStr.length());
            String collection = null;
            int firstIndexOfDot = cmdStr.indexOf(".");
            if (firstIndexOfDot != lastIndexOfDot) {
              collection = cmdStr.substring(firstIndexOfDot + 1, lastIndexOfDot);
            }
            String jsonStr = query.substring(startIndex + 1, endIndex);
            int docsLimit = Integer.parseInt(limit);
            int docsSkip = Integer.parseInt(skip);
            return documentService.executeQuery(dbName, collection, command, jsonStr, fields,
                sortBy, docsLimit, docsSkip, allKeys);
          }
        });

    return response;
  }

  @POST
  @Path("/query")
  @Produces(MediaType.APPLICATION_JSON)
  @Consumes(MediaType.APPLICATION_JSON)
  public String executeQuery(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName,
      @QueryParam("connectionId") final String connectionId, final DocumentUserQueryData queryData,
      @Context final HttpServletRequest request) throws JSONException {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            DocumentService documentService = new DocumentServiceImpl(connectionId);
            // Get query
            int startIndex = queryData.getQuery().indexOf("("),
                endIndex = queryData.getQuery().lastIndexOf(")");
            if (startIndex == -1 || endIndex == -1) {
              throw new InvalidMongoCommandException(ErrorCodes.INVALID_QUERY, "Invalid query");
            }
            String cmdStr = queryData.getQuery().substring(0, startIndex);
            int lastIndexOfDot = cmdStr.lastIndexOf(".");
            if (lastIndexOfDot + 1 == cmdStr.length()) {
              // In this case the cmsStr = db.collectionName.
              throw new InvalidMongoCommandException(ErrorCodes.COMMAND_EMPTY, "Command is empty");
            }
            String command = cmdStr.substring(lastIndexOfDot + 1, cmdStr.length());
            String collection = null;
            int firstIndexOfDot = cmdStr.indexOf(".");
            if (firstIndexOfDot != lastIndexOfDot) {
              collection = cmdStr.substring(firstIndexOfDot + 1, lastIndexOfDot);
            }
            String jsonStr = queryData.getQuery().substring(startIndex + 1, endIndex);
            int docsLimit = Integer.parseInt(queryData.getLimit());
            int docsSkip = Integer.parseInt(queryData.getSkip());
            return documentService.executeQuery(dbName, collection, command, jsonStr,
                queryData.getFields(), queryData.getSortBy(), docsLimit, docsSkip,
                queryData.isAllKeys());
          }
        });

    return response;
  }


  /**
   * Maps GET Request to get all keys of document inside a collection inside a database present in
   * mongo db to a service function that returns the list. Also forms the JSON response for this
   * request and sent it to client. In case of any exception from the service files an error object
   * if formed.
   *
   * @param dbName Name of Database
   * @param collectionName Name of Collection
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return A String of JSON format with all keys in a collection.
   */
  @GET
  @Path("/keys")
  @Produces(MediaType.APPLICATION_JSON)
  public String getKeysRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName,
      @QueryParam("allKeys") final Boolean allKeys,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {
            // Perform the operation here only.
            MongoClient mongoInstance = authService.getMongoInstance(connectionId);

            long count = mongoInstance.getDatabase(dbName).getCollection(collectionName).count();
            FindIterable<Document> findIterable =
                mongoInstance.getDatabase(dbName).getCollection(collectionName).find();
            if (!allKeys) {
              findIterable.limit(10);
            }
            MongoCursor<Document> cursor = findIterable.iterator();
            Set<String> completeSet = new HashSet<String>();
            if (cursor.hasNext()) {
              while (cursor.hasNext()) {
                Document doc = cursor.next();
                getNestedKeys(doc, completeSet, "");
              }
            }
            completeSet.remove("_id");
            JSONObject result = new JSONObject();
            result.put("keys", completeSet);
            result.put("count", count);
            return result;
          }
        });
    return response;
  }

  /**
   * Gets the keys within a nested document and adds it to the complete Set. Used by getKeysRequest
   * function above.
   *
   * @param doc document
   * @param completeSet collection of all keys
   * @param prefix For nested docs. For the key <foo.bar.baz>, the prefix would be <foo.bar>
   */
  private void getNestedKeys(Document doc, Set<String> completeSet, String prefix) {
    Set<String> allKeys = doc.keySet();
    for (String key : allKeys) {
      completeSet.add(prefix + key);
      if (doc.get(key) instanceof Document) {
        getNestedKeys((Document) doc.get(key), completeSet, prefix + key + ".");
      }
    }
  }

  /**
   * Maps POST Request to perform operation insert document inside a collection inside a database
   * present in mongo db to a service function that returns the list. Also forms the JSON response
   * for this request and sent it to client. In case of any exception from the service files an
   * error object if formed.
   *
   * @param dbName Name of Database
   * @param collectionName Name of Collection
   * @param documentData Contains the document to be inserted
   * 
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * @return String with Status of operation performed.
   */
  @POST
  @Produces(MediaType.APPLICATION_JSON)
  public String insertDocsRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName,
      @FormParam("document") final String documentData,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {

            DocumentService documentService = new DocumentServiceImpl(connectionId);
            JSONObject resultJSON = new JSONObject();
            String result = null;
            if ("".equals(documentData)) {
              ApplicationException e = new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                  "Document Data Missing in Request Body");
              result = formErrorResponse(logger, e);
            } else {
              Document document = Document.parse(documentData);
              result = documentService.insertDocument(dbName, collectionName, document);
            }

            resultJSON.put("result", result);
            return resultJSON;
          }
        });
    return response;
  }

  /**
   * Maps PUT Request to perform operation update document inside a collection inside a database
   * present in mongo db to a service function that returns the list. Also forms the JSON response
   * for this request and sent it to client. In case of any exception from the service files an
   * error object if formed.
   * 
   * @param dbName Name of Database
   * @param collectionName Name of Collection
   * @param _id Object id of document to delete or update
   * @param keys new Document values in case of update
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * 
   * @return String with Status of operation performed.
   */

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  public String updateDocsRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName, @FormParam("_id") final String _id,
      @FormParam("keys") final String keys, @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {

            DocumentService documentService = new DocumentServiceImpl(connectionId);
            JSONObject resultJSON = new JSONObject();
            String result = null;

            if ("".equals(_id) || "".equals(keys)) {
              ApplicationException e = new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                  "Document Data Missing in Request Body");
              formErrorResponse(logger, e);
            } else {
              // New Document Keys
              Document newDoc = Document.parse(keys);
              result = documentService.updateDocument(dbName, collectionName, _id, newDoc);
              Set<String> completeSet = new HashSet<String>();
              getNestedKeys(newDoc, completeSet, "");
              completeSet.remove("_id");
              resultJSON.put("keys", completeSet);
            }

            resultJSON.put("result", result);
            return resultJSON;
          }
        });
    return response;
  }

  /**
   * Maps DELETE Request to perform operation delete document inside a collection inside a database
   * present in mongo db to a service function that returns the list. Also forms the JSON response
   * for this request and sent it to client. In case of any exception from the service files an
   * error object if formed.
   * 
   * @param dbName Name of Database
   * @param collectionName Name of Collection
   * @param _id Object id of document to delete or update
   *
   * @param connectionId Mongo Db Configuration provided by user to connect to.
   * @param request Get the HTTP request context to extract session parameters
   * 
   * @return String with Status of operation performed.
   */

  @DELETE
  @Produces(MediaType.APPLICATION_JSON)
  public String deleteDocsRequest(@PathParam("dbName") final String dbName,
      @PathParam("collectionName") final String collectionName, @FormParam("_id") final String _id,
      @QueryParam("connectionId") final String connectionId,
      @Context final HttpServletRequest request) {

    String response =
        new ResponseTemplate().execute(logger, connectionId, request, new ResponseCallback() {
          public Object execute() throws Exception {

            DocumentService documentService = new DocumentServiceImpl(connectionId);
            JSONObject resultJSON = new JSONObject();
            String result = null;

            if ("".equals(_id)) {
              ApplicationException e = new DocumentException(ErrorCodes.DOCUMENT_DOES_NOT_EXIST,
                  "Document Data Missing in Request Body");
              result = formErrorResponse(logger, e);
            } else {
              result = documentService.deleteDocument(dbName, collectionName, _id);
            }
            resultJSON.put("result", result);
            return resultJSON;
          }
        });
    return response;
  }

}
