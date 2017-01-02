import React from 'react';
import _ from 'lodash';
import databaseTabsStyles from './database-tabs.css';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
import {Tabs, Tab} from 'react-draggable-tab';
import { browserHistory } from 'react-router';
import CloseButtonComponent from './CloseButtonComponent.jsx';
import CollectionsComponent from '../collections/CollectionsComponent.jsx';

//allow react dev tools work
window.React = React;

const tabsClassNames = {
  tabWrapper : databaseTabsStyles.myWrapper,
  tabBar : databaseTabsStyles.myTabBar,
  tabBarAfter : databaseTabsStyles.myTabBarAfter,
  tab : databaseTabsStyles.myTab,
  tabTitle : databaseTabsStyles.myTabTitle,
  tabAfterTitle : databaseTabsStyles.myTabAfterTitle,
  tabCloseIcon : databaseTabsStyles.tabCloseIcon,
  tabBefore : databaseTabsStyles.myTabBefore,
  tabAfter : databaseTabsStyles.myTabAfter,
  tabActive : databaseTabsStyles.myTabActive
};

const tabsStyles = {
  tabWrapper : {marginTop : '0px'},
  tabBar : {},
  tab : {},
  tabTitle : {},
  tabCloseIcon : {},
  tabBefore : {},
  tabAfter : {},
  tabActive : {}
};

class DatabaseTabsComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabs : [
        (<Tab key={'tab1'} title={this.props.location.query.db} afterTitle={<CloseButtonComponent closeButtonHandler = {this.closeButtonHandler} key1 = {'tab1'}/>} disableClose={true} >
          <CollectionsComponent propss = {this.props} closeDbTab = {this.closeDbTab} ref='child' />
        </Tab>)
      ],
      badgeCount : 0,
      menuPosition : {},
      showMenu : false,
      currentDb : this.props.location.query.db,
      closedTabs : []
    };
  }

  handleTabSelect(e, key, currentTabs) {
    var selectedTabObject = null;
    for (let i = 0; i < currentTabs.length; i++) {
      if (currentTabs[i].key === key) {
        selectedTabObject = currentTabs[i];
        break;
      }
    }
    if(selectedTabObject != null) {
      sessionStorage.setItem('selectedTabTitle', JSON.stringify(selectedTabObject.props.title));
      sessionStorage.setItem('selectedTabKey', JSON.stringify(selectedTabObject.key));
      this.setState({currentDb : selectedTabObject.props.title});
      this.props.changeDbName();
      this.setState({selectedTab : key, tabs : currentTabs});
    }
  }

  handleTabClose(e, key, currentTabs) {
    this.setState({tabs : currentTabs});
    if (currentTabs.length === 0 ) {
      browserHistory.push({ pathname : '/dashboard/home', query : { collapsed : false} });
    }
  }

  closeButtonHandler = (tabId) =>{
    let currentTabs = this.state.tabs;
    currentTabs = currentTabs.filter((tab) => {
      return tab.key !== tabId;
    });

    this.setState({tabs : currentTabs});

    if(currentTabs.length === 0 ) {
      browserHistory.push({ pathname : '/dashboard/home', query : { collapsed : false} });
    } else{
      let nextSelected;
      if (this.state.selectedTab === tabId) {
        nextSelected = this._getNextTabKey(tabId);
        if (!nextSelected) {
          nextSelected = this._getPrevTabKey(tabId);
        }
      } else {
        nextSelected = this.state.selectedTab;
      }
      this.setState({
        closedTabs : this.state.closedTabs.concat([tabId]),
        selectedTab : nextSelected,
      });
      this.setState({selectedTab : nextSelected});
      this.handleTabSelect('', nextSelected, currentTabs);
    }
  }

  _isClosed(key) {
    return this.state.closedTabs.indexOf(key) > -1;
  }

  _getIndexOfTabByKey(key) {
    return _.findIndex(this.state.tabs, (tab) => tab.key === key);
  }

  _getNextTabKey(key) {
    let nextKey;
    const current = this._getIndexOfTabByKey(key);
    if (current + 1 < this.state.tabs.length) {
      nextKey = this.state.tabs[current + 1].key;
      if (this._isClosed(nextKey)) {
        nextKey = this._getNextTabKey(nextKey);
      }
    }
    return nextKey;
  }

  _getPrevTabKey(key) {
    let prevKey;
    const current = this._getIndexOfTabByKey(key);
    if (current > 0) {
      prevKey = this.state.tabs[current - 1].key;
      if (this._isClosed(prevKey)) {
        prevKey = this._getPrevTabKey(prevKey);
      }
    }
    return prevKey;
  }

  closeDbTab = () => {
    this.closeTab();
  }

  closeTab() {
    let currentTabs = this.state.tabs;
    if (currentTabs.length === 1 || typeof(sessionStorage.getItem('selectedTabTitle')) == 'undefined') {
      browserHistory.push({ pathname : '/dashboard/home', query : { collapsed : false} });
    } else{
      let tabTitle = JSON.parse(sessionStorage.getItem('selectedTabTitle'));
      currentTabs = currentTabs.filter((tab) => {
        return tab.props.title !== tabTitle;
      });
      this.setState({tabs : currentTabs});
      if(currentTabs.length === 0) {
        browserHistory.push({ pathname : '/dashboard/home', query : { collapsed : false} });
      } else{
        browserHistory.push({ pathname : '/dashboard/database', query : { collapsed : false} });
      }
    }
  }

  handleTabPositionChange(e, key, currentTabs) {
    this.setState({tabs : currentTabs});
  }


  handleTabContextMenu(key, e) {
    e.preventDefault();
    this.setState({
      showMenu : true,
      contextTarget : key,
      menuPosition : {
        top : `${e.pageY}px`,
        left : `${e.pageX}px`
      }
    });
  }


  shouldTabClose() {
    return true;
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.location.query.db !== this.props.location.query.db && typeof(nextProps.location.query.db) != 'undefined') {
      let tabAlreadyOpened = [];
      let previousTabs = this.state.tabs;
      tabAlreadyOpened = previousTabs.filter((tab) => {
        return tab.props.title === nextProps.location.query.db ;
      });
      if (tabAlreadyOpened.length === 0) {
        const key = 'newTab_' + Date.now();
        let newTab = (<Tab key={key} title={nextProps.location.query.db} afterTitle={<CloseButtonComponent closeButtonHandler = {this.closeButtonHandler} key1={key}/>} disableClose={true} >
                      <CollectionsComponent propss = {nextProps} closeDbTab = {this.closeDbTab} />
                    </Tab>);
        let newTabs = previousTabs.concat([newTab]);
        this.setState({
          tabs : newTabs,
          selectedTab : key
        });
        sessionStorage.setItem('selectedTabKey', JSON.stringify(key));
      } else {
        let key = tabAlreadyOpened[0].key;
        this.setState({
          selectedTab : key
        });
        sessionStorage.setItem('selectedTabKey', JSON.stringify(key));
      }
      this.setState({currentDb : nextProps.location.query.db});
      sessionStorage.setItem('selectedTabTitle', JSON.stringify(nextProps.location.query.db));
    }

  }



  componentDidMount () {

  }

  render() {
    return (

      <div className={this.props.location.query.collapsed === 'false' ? databaseTabsStyles.mainContainer + ' collectionsContainer col-lg-10  col-sm-9 col-xs-8 col-md-9' : databaseTabsStyles.mainContainer + ' collectionsContainer col-lg-11  col-sm-11 col-xs-10 col-md-11 ' + databaseTabsStyles.collapsedContainer}>
        <Tabs
          tabsClassNames={tabsClassNames}
          tabsStyles={tabsStyles}
          selectedTab={this.state.selectedTab ? this.state.selectedTab : 'tab1'}
          onTabSelect={this.handleTabSelect.bind(this)}
          onTabClose={this.handleTabClose.bind(this)}
          onTabPositionChange={this.handleTabPositionChange.bind(this)}
          shouldTabClose={this.shouldTabClose.bind(this)}
          tabs={this.state.tabs}
          keepSelectedTab={true}
        />
      </div>
    );
  }
}

DatabaseTabsComponent.propTypes = {
  location : React.PropTypes.object,
  changeDbName : React.PropTypes.func
};

export default DatabaseTabsComponent;