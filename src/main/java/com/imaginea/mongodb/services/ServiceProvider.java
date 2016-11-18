package com.imaginea.mongodb.services;

import com.imaginea.mongodb.services.impl.CollectionServiceImpl;
import com.imaginea.mongodb.services.impl.DatabaseServiceImpl;
import com.imaginea.mongodb.services.impl.DocumentServiceImpl;

/**
 * Provides ServiceProvider functions that implement service provider interface.
 *
 * @author Rachit Mittal
 * @since 2 Aug 2011
 */
public class ServiceProvider {

  // TODO Usage of this function in each service file

  /**
   * Return implementation provider of serviceClass interface
   *
   * @param serviceClass
   * @return Implementation
   * @throws Exception
   */
  public static Class<?> getServiceImpl(Class<?> serviceClass) throws Exception {
    Class<?> serviceImpl = null;
    if (serviceClass.newInstance() instanceof DatabaseService) {
      return DatabaseServiceImpl.class;
    } else if (serviceClass.newInstance() instanceof CollectionService) {
      return CollectionServiceImpl.class;
    }
    if (serviceClass.newInstance() instanceof DocumentService) {
      return DocumentServiceImpl.class;
    }
    return serviceImpl;

  }
}
