package com.imaginea.mongodb.controllers;

import java.io.IOException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Created by satyad on 30/11/16.
 */
public class DashboardURLController extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public void doGet(HttpServletRequest httpReq, HttpServletResponse httpRes) throws IOException, ServletException {	
        RequestDispatcher view = httpReq.getRequestDispatcher("/index.html");
        view.forward(httpReq, httpRes);
    }
}

