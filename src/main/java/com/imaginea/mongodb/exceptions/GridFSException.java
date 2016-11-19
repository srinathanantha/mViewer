package com.imaginea.mongodb.exceptions;

/**
 * User: venkateshr
 */
public class GridFSException extends ApplicationException {

  /**
   * Defines an GridFSException
   *
   * @param errorCode
   * @param message
   */
  public GridFSException(String errorCode, String message) {
    super(errorCode, message);
  }
}
