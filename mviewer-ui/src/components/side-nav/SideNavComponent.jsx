import React from 'react';
import sideNavStyles from './side-nav.css';
import { browserHistory} from 'react-router';
import DbList from '../db-list/DbListComponent.jsx';
import dbListStyles from '../db-list/db-list.css';

class SideNavComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem : 0,
      selectedDB : null,
      connectionId : this.props.connectionId,
      visible : false,
      urlPart : ''
    };

    this.setActiveItem = this.setActiveItem.bind(this);
  }

  refreshDb = () => {
    this.refs.left.refreshDbList();
  }

  changeDbName () {
    this.refs.left.changeDbName();
  }

  setActiveItem (item) {
    this.setState({selectedDB : item});
  }

  clearActiveClass = () => {
    this.setState({selectedItem : 1});
    this.setState({selectedDB : null});
  }

  dbList = () => {
    this.setState({selectedItem : 1});
    browserHistory.push({ pathname : '/dashboard/home', query : { db : this.props.loggedInDatabase} });
  }

  mongoGraphs = () => {
    this.setState({selectedItem : 2});
    browserHistory.push({ pathname : '/dashboard/mongoGraphs', query : { db : this.props.loggedInDatabase} });
  }

  serverStats = () => {
    this.setState({selectedItem : 3});
    browserHistory.push({ pathname : '/dashboard/serverStats', query : { db : this.props.loggedInDatabase} });
  }

  componentDidMount() {

    var homeUrl = window.location.href.split('?')[0].search('/home') !== -1;
    var collectionUrl = window.location.href.split('?')[0].search('/database') !== -1;
    var graphsUrl = window.location.href.split('?')[0].search('/mongoGraphs') !== -1;
    var statsUrl = window.location.href.split('?')[0].search('/serverStats') !== -1;

    this.setState({urlPart : (homeUrl || collectionUrl)});

    if(homeUrl || collectionUrl) {
      this.setState({selectedItem : 1});
    }

    if (graphsUrl) {
      this.setState({selectedItem : 2});
    }

    if (statsUrl) {
      this.setState({selectedItem : 3});
    }

  }

  componentWillReceiveProps() {

    var homeUrl = window.location.href.split('?')[0].search('/home') !== -1;
    var collectionUrl = window.location.href.split('?')[0].search('/database') !== -1;
    var graphsUrl = window.location.href.split('?')[0].search('/mongoGraphs') !== -1;
    var statsUrl = window.location.href.split('?')[0].search('/serverStats') !== -1;

    this.setState({urlPart : (homeUrl || collectionUrl)});

    if(homeUrl || collectionUrl) {
      this.setState({selectedItem : 1});
    }

    if (graphsUrl) {
      this.setState({selectedItem : 2});
    }

    if (statsUrl) {
      this.setState({selectedItem : 3});
    }
  }

  render () {
    var url = window.location.href;
    var params = url.split('?');
    var n = params[1].search('collapsed=true');
    return(

        <div className ={this.state.urlPart === true ? (n === -1 ? sideNavStyles.mainContainer + ' sideContainer col-lg-2 col-sm-3 col-xs-4 col-md-3' : sideNavStyles.mainContainerCollapsed + ' sideContainer col-lg-1 col-sm-1 col-xs-2 col-md-1') : sideNavStyles.otherContainer}>
          <div className={this.state.urlPart === true ? (n === -1 ? sideNavStyles.sideContainer : sideNavStyles.sideContainerCollapsed) : sideNavStyles.otherSideContainer}>
            <ul className={sideNavStyles.sideNav} >
              <li onClick={this.dbList} className ={this.state.selectedItem === 1 ? sideNavStyles.active : ''}><button data-id = '1'><div><i className={'fa fa-database ' + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
              <li onClick={this.mongoGraphs} className ={this.state.selectedItem === 2 ? sideNavStyles.active : ''}><button data-id = '2'><div><i className={'fa fa-area-chart ' + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
              <li onClick={this.serverStats} className ={this.state.selectedItem === 3 ? sideNavStyles.active : ''}><button data-id = '3'><div><i className={'fa fa-bar-chart ' + sideNavStyles.icon} aria-hidden="true"></i></div></button></li>
            </ul>
          </div>
          { (this.state.selectedItem === 1 || this.state.selectedItem === 0) ? <DbList ref="left" selectedNav = {this.state.selectedItem} selectedDB = { this.setActiveItem} alignment={dbListStyles.left} propps = {this.props} ></DbList> : null }
        </div>

    );
  }
}

SideNavComponent.childContextTypes = {
  selectedDB : React.PropTypes.string,
};

SideNavComponent.propTypes = {
  loggedInDatabase : React.PropTypes.string,
  connectionId : React.PropTypes.string
};

export default SideNavComponent;
