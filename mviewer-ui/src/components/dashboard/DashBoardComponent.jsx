import React from 'react'
import dashStyles from './dashBoard.css'
import $ from 'jquery'
import SideNav from '../sidenav/SideNavComponent.jsx';
import service from '../../gateway/service.js';

class DashBoardComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      connectionId: JSON.parse(sessionStorage.getItem('connectionId') || '{}'),
      loggedInDatabase: this.props.location.query.database,
      host: JSON.parse(sessionStorage.getItem('host') || '{}'),
      username: JSON.parse(sessionStorage.getItem('username') || '{}')
    }
  }

  disconnect(){
    var partialUrl = 'disconnect?connectionId=' + this.state.connectionId;
    var disconnectCall = service('GET', partialUrl, '');
    disconnectCall.then(this.success.bind(this), this.failure.bind(this));
  }

  success(data) {
    if(data.response.result==='User Logged Out')
    {
      window.location.hash = '#';
      sessionStorage.setItem('connectionId', JSON.stringify(" "));
      sessionStorage.setItem('username', JSON.stringify(" "));
      sessionStorage.setItem('host', JSON.stringify(" "));
      sessionStorage.setItem('db', JSON.stringify(" "));
      sessionStorage.setItem('queryType', JSON.stringify(" "));
    }
  }

  failure() {

  }

  refreshDb(){
    this.refs.sideNav.refreshDb();
  }

  clearActiveClass(){
    this.refs.sideNav.clearActiveClass();
  }

  render() {
    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, {
      connectionId: this.state.connectionId,
      loggedInDatabase: this.state.loggedInDatabase,
      refreshDb: function(){
        this.refreshDb();
      }.bind(this)
     })
    );

    return (
      <div className ='row'>
        <div className = {dashStyles.mainContainer}>
          <header>
            <nav>
              <div className={"row " + dashStyles.row}>
                <a href= {"#/dashboard/home"} className={dashStyles.logo} onClick={this.clearActiveClass.bind(this)}><img src={'./images/Logo.png'}></img></a>
	          
                <ul className={dashStyles.mainNav + ' ' + dashStyles.clearfix} >
                  <li><div className={dashStyles.details}>{this.state.host}</div>  
                    <div className={dashStyles.details}>{this.state.username}</div></li>
                  <li><a target = "_blank" href="https://Imaginea.github.io/mViewer/"><span><i className="fa fa-question-circle-o"></i></span></a></li>
                  <li className={dashStyles.seperator}><span></span></li>
                  <li className={dashStyles.disconnect}><a href="javascript:void(0);" onClick={this.disconnect.bind(this)}><span><i className="fa fa-sign-out" aria-hidden="true"></i></span></a></li>
                </ul>
               </div>
             </nav>
          </header>
          <div>
            <SideNav ref='sideNav' connectionId = {this.state.connectionId} loggedInDatabase ={this.state.loggedInDatabase} propss = {this.props}></SideNav>
            {childrenWithProps}
          </div>
        </div>
      </div>
    );
  }
}

export default DashBoardComponent;
