package com.imaginea.mongodb.controllers;

import com.imaginea.mongodb.exceptions.*;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import com.mongodb.MongoInternalException;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.UnknownHostException;
import java.util.Properties;

/**
 * Defined an Error Template to catch more exceptions here while Testing. and
 * new asserts in case of some. Exceptions for a block of Code for test files.
 *
 *
 * @author Rachit Mittal
 * @since 2 Aug 2011
 *
 */
public class TestingTemplate extends BaseController {

    protected static Mongo mongoInstance;

    private static Properties prop;
    private static String MONGO_CONFIG_FILE = "src/test/resources/mongo.config";
    private static String MONGO_HOST = "mongoHost";
    private static String MONGO_PORT = "mongoPort";
    private static String USERNAME = "username";
    private static String PASSWORD = "password";

    private static final String LOG_CONFIG_FILE = "src/main/resources/log4j.properties";
    private static final String FILE_NOT_FOUND_EXCEPTION = "FILE_NOT_FOUND_EXCEPTION";

    private static Logger logger = Logger.getLogger(TestingTemplate.class);

    static {
        PropertyConfigurator.configure(LOG_CONFIG_FILE);
        mongoInstance = getTestMongoInstance();
    }

    public static void execute(Logger logger, ResponseCallback callback) {

		try {
			Object dispatcherResponse = callback.execute();
			JSONObject tempResult = new JSONObject();
			JSONObject jsonResponse = new JSONObject();
			tempResult.put("result", dispatcherResponse);
			jsonResponse.put("response", tempResult);
			jsonResponse.toString();
		} catch (FileNotFoundException m) {
			ApplicationException e = new ApplicationException(FILE_NOT_FOUND_EXCEPTION, m.getMessage(), m.getCause());
			formErrorResponse(logger, e);
		} catch (DatabaseException e) {
			formErrorResponse(logger, e);
			// This condition is ok .. as if service throw this error while
			// creating Db that already exist
			assert (true);
		} catch (CollectionException e) {
			formErrorResponse(logger, e);
			assert (true);
		} catch (DocumentException e) {
			formErrorResponse(logger, e);
			assert (true);
		} catch (ValidationException e) {
			formErrorResponse(logger, e);
			assert (true);
		} catch (Exception m) {
			// For any other exception call the template as defined in src folder
			BaseController.ErrorTemplate.execute(logger, callback);
		}
	}

    public static Mongo getTestMongoInstance() {
        try {
            Mongo mongo = new Mongo(getMongoHost(), getMongoPort());
            DB adminDB = mongo.getDB("admin");
            adminDB.authenticate(getMongoUsername(), getMongoPassword().toCharArray());
            return mongo;
        } catch (Exception e) {
            logger.error("Couldn't create a test mongo instance", e);
            throw new RuntimeException("Couldn't create a test mongo instance", e);
        }
    }

    protected String loginAndGetConnectionId(HttpServletRequest request) {
        String response = new LoginController().authenticateUser(getMongoUsername(), getMongoPassword(), getMongoHost(), String.valueOf(getMongoPort()), null, request);
        BasicDBObject responseObject = (BasicDBObject) JSON.parse(response);
        return (String) ((BasicDBObject)((BasicDBObject) responseObject.get("response")).get("result")).get("connectionId");
    }

    protected static void logout(String connectionId, HttpServletRequest request) {
        new LogoutController().doGet(connectionId, request);
    }

    private static Properties getMongoProperties() {
        if(prop == null) {
            InputStream is = null;
            try {
                is = new FileInputStream(MONGO_CONFIG_FILE);
                prop = new Properties();
                prop.load(is);
                is.close();
                return prop;
            } catch (IOException e) {
                logger.error("Couldn't get the properties from the " + MONGO_CONFIG_FILE + " file", e);
                throw new RuntimeException("Couldn't get the properties from the " + MONGO_CONFIG_FILE + " file", e);
            } finally {
                if(is != null) {
                    try {
                        is.close();
                    } catch (IOException e) {
                        logger.error("Couldn't close the input stream", e);
                    }
                }
            }
        }
        return prop;
    }

    private static String getMongoHost() {
        return getMongoProperties().getProperty(MONGO_HOST);
    }

    private static int getMongoPort() {
        return Integer.parseInt(getMongoProperties().getProperty(MONGO_PORT));
    }

    private static String getMongoUsername() {
        return getMongoProperties().getProperty(USERNAME);
    }

    private static String getMongoPassword() {
        return getMongoProperties().getProperty(PASSWORD);
    }

}
