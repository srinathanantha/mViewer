import React from 'react';
import {render} from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import LoginComponent from './components/login/LoginComponent.jsx';
import DashBoardComponent from './components/dashboard/DashBoardComponent.jsx';
import PageNotFoundComponent from './components/page-not-found/PageNotFoundComponent.jsx';
import HomeComponent from './components/home/HomeComponent.jsx';
import DbStatsComponent from './components/db-stats/DbStatsComponent.jsx';
import DatabaseTabsComponent from './components/database-tabs/DatabaseTabsComponent.jsx';
import GraphsComponent from './components/graphs/GraphsComponent.jsx';
import ServerStatsComponent from './components/server-stats/ServerStatsComponent.jsx';

render((
  <Router history={browserHistory}>
    <Route path="/index.html" component={LoginComponent}/>
    <Route path="/dashboard" component={DashBoardComponent} >
      <Route path="/dashboard/home" component={HomeComponent} />
      <Route path="/dashboard/databases" component={DbStatsComponent} />
      <Route path="/dashboard/database" component={DatabaseTabsComponent} />
      <Route path="/dashboard/serverStats" component={ServerStatsComponent} />
      <Route path='/dashboard/mongoGraphs' component = {GraphsComponent} />
    </Route>
    <Route path="*" component = {PageNotFoundComponent}/>
    </Router>
), document.getElementById('app'));

