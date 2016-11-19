package com.imaginea.mongodb.utils;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import eu.medsea.mimeutil.MimeType;
import eu.medsea.mimeutil.MimeUtil;

import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONString;

import javax.ws.rs.core.MediaType;
import java.io.File;
import java.util.*;

/**
 * Author: Srinath Anantha Date: Mar 16, 2012 Time: 3:57:38 PM
 */
public class ApplicationUtils {

  static {
    MimeUtil.registerMimeDetector("eu.medsea.mimeutil.detector.MagicMimeMimeDetector");
  }

  public static String getContentType(File file) {
    Collection types =
        MimeUtil.getMimeTypes(file, new MimeType(MediaType.APPLICATION_OCTET_STREAM));
    return MimeUtil.getMostSpecificMimeType(types).toString();
  }

  public static String serializeToJSON(JSONObject object) {
    try {
      Iterator keys = object.keys();
      StringBuilder sb = new StringBuilder("{");

      while (keys.hasNext()) {
        if (sb.length() > 1) {
          sb.append(',');
        }
        Object o = keys.next();
        sb.append(JSONObject.quote(o.toString()));
        sb.append(':');
        sb.append(valueToString(object.get(o.toString())));
      }
      sb.append('}');
      return sb.toString();
    } catch (Exception e) {
      return null;
    }
  }

  private static String valueToString(Object value) throws JSONException {
    if (value == null) {
      return "null";
    }
    // BasicDBObject & BasicDBList is also an instanceof Map.
    // Hence they should be handled in precedence to Map.
    if (value instanceof BasicDBObject) {
      return value.toString();
    }
    if (value instanceof BasicDBList) {
      return value.toString();
    }
    if (value instanceof JSONString) {
      Object o;
      try {
        o = ((JSONString) value).toJSONString();
      } catch (Exception e) {
        throw new JSONException(e);
      }
      if (o instanceof String) {
        return (String) o;
      }
      throw new JSONException("Bad value from toJSONString: " + o);
    }
    if (value instanceof Number) {
      return JSONObject.numberToString((Number) value);
    }
    if (value instanceof Boolean) {
      return value.toString();
    }
    if (value instanceof JSONObject) {
      return serializeToJSON((JSONObject) value);
    }
    if (value instanceof Map) {
      JSONObject jsonObject = new JSONObject((Map) value);
      return serializeToJSON(jsonObject);
    }
    if (value instanceof JSONArray) {
      return join((JSONArray) value);
    }
    if (value instanceof Collection) {
      return join(new ArrayList((Collection) value));
    }
    if (value.getClass().isArray()) {
      return join((ArrayList) Arrays.asList(value));
    }
    return JSONObject.quote(value.toString());
  }

  /**
   * Make a string from the contents of this collection. The <code>separator</code> string is
   * inserted between each element. Warning: This method assumes that the data structure is
   * acyclical.
   *
   * @return a string.
   * @throws JSONException If the array contains an invalid number.
   */
  private static String join(ArrayList value) throws JSONException {
    int len = value.size();
    StringBuilder sb = new StringBuilder();

    for (int i = 0; i < len; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(valueToString(value.get(i)));
    }
    return '[' + sb.toString() + ']';
  }

  /**
   * Make a string from the contents of this collection. The <code>separator</code> string is
   * inserted between each element. Warning: This method assumes that the data structure is
   * acyclical.
   *
   * @return a string.
   * @throws JSONException If the array contains an invalid number.
   */
  private static String join(JSONArray value) throws JSONException {
    int len = value.length();
    StringBuilder sb = new StringBuilder();

    for (int i = 0; i < len; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(valueToString(value.get(i)));
    }
    return '[' + sb.toString() + ']';
  }

  public static JSONObject constructResponse(boolean isEditable, long size, List docs)
      throws JSONException {
    
    
    
    JSONObject result = new JSONObject();
    result.put("documents", docs);
    result.put("count", size);
    result.put("editable", isEditable);
    
    
    return result;
  }

  public static JSONObject constructResponse(boolean isEditable, Document... documents)
      throws JSONException {
    List<Document> docs = Arrays.asList(documents);
    return constructResponse(isEditable, docs.size(), docs);
  }
}
