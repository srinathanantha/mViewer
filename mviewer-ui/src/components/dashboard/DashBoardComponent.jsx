import React from 'react';
import dashStyles from './dashboard.css';
import SideNav from '../side-nav/SideNavComponent.jsx';
import service from '../../gateway/service.js';
import { browserHistory } from 'react-router';

class DashBoardComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      // connectionId : JSON.parse(sessionStorage.getItem('connectionId') || '{}'),
      // loggedInDatabase : JSON.parse(sessionStorage.getItem('db') || '{}'),
      // host : JSON.parse(sessionStorage.getItem('host') || '{}'),
      // username : JSON.parse(sessionStorage.getItem('username') || '{}')
    };
  }

  disconnect = () => {
    var partialUrl = 'disconnect?connectionId=' + this.state.connectionId;
    var disconnectCall = service('GET', partialUrl, '');
    disconnectCall.then(this.success.bind(this), this.failure.bind(this));
  }

  success(data) {
    if(data.response.result === 'User Logged Out') {
      browserHistory.push({ pathname : '/index.html' });
      sessionStorage.setItem('connectionId', JSON.stringify(' '));
      sessionStorage.setItem('username', JSON.stringify(' '));
      sessionStorage.setItem('host', JSON.stringify(' '));
      sessionStorage.setItem('db', JSON.stringify(' '));
      sessionStorage.setItem('queryType', JSON.stringify(' '));
    }
  }

  failure() {

  }

  refreshDb = () => {
    this.refs.sideNav.refreshDb();
  }

  changeDbName () {
    this.refs.sideNav.changeDbName();
  }


  clearActiveClass = () => {
    this.refs.sideNav.clearActiveClass();
    browserHistory.push({ pathname : '/dashboard/home', query : { db : this.state.loggedInDatabase} });
  }

  componentWillMount () {
    // transfers sessionStorage from one tab to another
    let that = this;
    let sessionStorageTransfer = function(event) {
      if(!event) {
        event = window.event;
      } // ie suq
      if(!event.newValue) return;          // do nothing if no value to work with
      if (event.key === 'getSessionStorage') {
        // another tab asked for the sessionStorage -> send it
        localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
        // the other tab should now have it, so we're done with it.
        localStorage.removeItem('sessionStorage'); // <- could do short timeout as well.
      } else if (event.key === 'sessionStorage' && !sessionStorage.length) {
        // another tab sent data <- get it
        let data = JSON.parse(event.newValue);
        for (let key in data) {
          sessionStorage.setItem(key, data[key]);
        }
        that.setState({
          connectionId : JSON.parse(sessionStorage.getItem('connectionId') || '{}'),
          loggedInDatabase : JSON.parse(sessionStorage.getItem('db') || '{}'),
          host : JSON.parse(sessionStorage.getItem('host') || '{}'),
          username : JSON.parse(sessionStorage.getItem('username') || '{}')
        });

      }
    };

    // listen for changes to localStorage
    if(window.addEventListener) {
      window.addEventListener('storage', sessionStorageTransfer, false);
    } else {
      window.attachEvent('onstorage', sessionStorageTransfer);
    }


    // Ask other tabs for session storage (this is ONLY to trigger event)
    if (!sessionStorage.length) {
      localStorage.setItem('getSessionStorage', 'foobar');
      localStorage.removeItem('getSessionStorage', 'foobar');
    }

  }


  componentDidMount() {
    this.setState({
      connectionId : JSON.parse(sessionStorage.getItem('connectionId') || ' '),
      loggedInDatabase : JSON.parse(sessionStorage.getItem('db') || ' '),
      host : JSON.parse(sessionStorage.getItem('host') || ' '),
      username : JSON.parse(sessionStorage.getItem('username') || ' ')
    });
  }

  render() {
    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, {
        connectionId : this.state.connectionId,
        loggedInDatabase : this.state.loggedInDatabase,
        refreshDb : function() {
          this.refreshDb();
        }.bind(this),
        changeDbName : function() {
          this.changeDbName();
        }.bind(this)
      })
    );

    return (
      <div className ='row'>
        <div className = {dashStyles.mainContainer}>
          <header>
            <nav>
              <div className={'row ' + dashStyles.row}>
                <a href= {'#'} className={dashStyles.logo} onClick={this.clearActiveClass}><img src={'/images/logo.png'}></img></a>

                <ul className={dashStyles.mainNav + ' ' + dashStyles.clearfix} >
                  <li><div className={dashStyles.details}>{this.state.host}</div>
                    <div className={dashStyles.details}>{this.state.username}</div></li>
                  <li><a target = '_blank' href='https://Imaginea.github.io/mViewer/'><span><i className='fa fa-question-circle-o'></i></span></a></li>
                  <li className={dashStyles.seperator}><span></span></li>
                  <li className={dashStyles.disconnect}><a href='javascript:void(0);' onClick={this.disconnect}><span><i className='fa fa-sign-out' aria-hidden='true'></i></span></a></li>
                </ul>
               </div>
             </nav>
          </header>
          <div>
            {this.state.connectionId != null || typeof(this.state.connectionId) != 'undefined' ? <SideNav ref='sideNav' connectionId = {this.state.connectionId} loggedInDatabase ={this.state.loggedInDatabase} propss = {this.props}></SideNav> : null}
            {this.state.connectionId != null || typeof(this.state.connectionId) != 'undefined' ? childrenWithProps : null}
          </div>
        </div>
      </div>
    );
  }
}

DashBoardComponent.propTypes = {
  children : React.PropTypes.object
};
export default DashBoardComponent;
