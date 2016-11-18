import React from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { Router, Route, hashHistory, browserHistory } from 'react-router'
import LoginComponent from './components/login/LoginComponent.jsx';
import DashBoardComponent from './components/dashboard/DashBoardComponent.jsx';
import PageNotFoundComponent from './components/pagenotfound/PageNotFoundComponent.jsx';
import HomeComponent from './components/home/HomeComponent.jsx';
import DbStatsComponent from './components/dbstats/DbStatsComponent.jsx';
import CollectionsComponent from  './components/collections/CollectionsComponent.jsx';
import GraphsComponent from  './components/graphs/GraphsComponent.jsx';
import ServerStatsComponent from  './components/serverstats/ServerStatsComponent.jsx';
// import Bootstrap from './vendors/css/bootstrap/dist/css/bootstrap.css';

render((
  <Router history={hashHistory}>
    <Route path="/" component={LoginComponent}/>
      <Route path="/dashboard" component={DashBoardComponent} >
        <Route path="/dashboard/home" component={HomeComponent} />
        <Route path="/dashboard/databases" component={DbStatsComponent} />
        <Route path="/dashboard/database" component={CollectionsComponent} />
        <Route path="/dashboard/serverStats" component={ServerStatsComponent} />
        <Route path='/dashboard/mongoGraphs' component = {GraphsComponent} />
      </Route>
      <Route path="*" component = {PageNotFoundComponent}/>
    </Router>
), document.getElementById('app'));
