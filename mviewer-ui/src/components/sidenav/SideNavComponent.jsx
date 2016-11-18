import React from 'react'
import sideNavStyles from './sideNav.css'
import $ from 'jquery'
import GridFSList from '../gridfslist/GridFSListComponent.jsx'
import { browserHistory, hashHistory } from 'react-router';
import DbList from '../dblist/DbListComponent.jsx'
import dbListStyles from '../dblist/dblist.css'

class SideNavComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem:0,
      selectedDB: null,
      connectionId: this.props.connectionId,
      visible: false,
      urlPart: ''
    }
  }

  refreshDb(){
    this.refs.left.refreshDbList();
  }

  setActiveItem (item) {
    this.setState({selectedDB: item});
  }

  clearActiveClass(){
    this.setState({selectedItem: 1});
  }

  dbList(){
    this.setState({selectedItem:1});
    hashHistory.push({ pathname: '/dashboard/home' });
  }

  mongoGraphs(){
    this.setState({selectedItem:2});
    hashHistory.push({ pathname: 'dashboard/mongoGraphs', query: { db: this.props.loggedInDatabase} });
  }

  serverStats(){
    this.setState({selectedItem:3});
    hashHistory.push({ pathname: 'dashboard/serverStats', query: { db: this.props.loggedInDatabase} });
  }

  componentDidMount(){

    var homeUrl = window.location.href.split('?')[0].search("/home") != -1;
    var collectionUrl = window.location.href.split('?')[0].search("/database") != -1;
    var graphsUrl = window.location.href.split('?')[0].search("/mongoGraphs") != -1;
    var statsUrl = window.location.href.split('?')[0].search("/serverStats") != -1;

    this.setState({urlPart : (homeUrl || collectionUrl)});

    if(homeUrl || collectionUrl){
      this.setState({selectedItem : 1});
    }

    if (graphsUrl){
      this.setState({selectedItem : 2});
    }

    if (statsUrl){
      this.setState({selectedItem : 3});
    }

  }

  componentWillReceiveProps(){

    var homeUrl = window.location.href.split('?')[0].search("/home") != -1;
    var collectionUrl = window.location.href.split('?')[0].search("/database") != -1;
    var graphsUrl = window.location.href.split('?')[0].search("/mongoGraphs") != -1;
    var statsUrl = window.location.href.split('?')[0].search("/serverStats") != -1;

    this.setState({urlPart : (homeUrl || collectionUrl)});

    if(homeUrl || collectionUrl){
      this.setState({selectedItem : 1});
    }

    if (graphsUrl){
      this.setState({selectedItem : 2});
    }

    if (statsUrl){
      this.setState({selectedItem : 3});
    }
  }

  render () {
    var url = window.location.href;
    var params = url.split('?');
    var n = params[1].search("&collapsed=true");
    return(

        <div className ={this.state.urlPart == true ? (n == -1 ? sideNavStyles.mainContainer+' sideContainer col-lg-2 col-sm-3 col-xs-4 col-md-3' : sideNavStyles.mainContainerCollapsed+ ' sideContainer col-lg-1 col-sm-1 col-xs-2 col-md-1') : sideNavStyles.otherContainer}>
          <div className={this.state.urlPart == true ?(n == -1 ? sideNavStyles.sideContainer : sideNavStyles.sideContainerCollapsed) : sideNavStyles.otherSideContainer}>
            <ul className={sideNavStyles.sideNav} >
              <li onClick={this.dbList.bind(this)} className ={this.state.selectedItem == 1 ? sideNavStyles.active : ''}><button data-id = '1'><div><i className={"fa fa-database " + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
              <li onClick={this.mongoGraphs.bind(this)} className ={this.state.selectedItem == 2 ? sideNavStyles.active : ''}><button data-id = '2'><div><i className={"fa fa-area-chart " + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
              <li onClick={this.serverStats.bind(this)} className ={this.state.selectedItem == 3 ? sideNavStyles.active : ''}><button data-id = '3'><div><i className={"fa fa-bar-chart " + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
            </ul>
          </div>
          { (this.state.selectedItem == 1 || this.state.selectedItem == 0) ? <DbList ref="left" selectedNav = {this.state.selectedItem} selectedDB = { this.setActiveItem.bind(this)} alignment={dbListStyles.left} propps = {this.props} ></DbList> : null }
        </div>

    );
  }
}

SideNavComponent.childContextTypes = {
  selectedDB: React.PropTypes.string
};

export default SideNavComponent;
