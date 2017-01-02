import React from 'react';
import serverStatsStyles from './server-stats.css';
import TreeView from '../../../dependencies/react-json-tree';
import service from '../../gateway/service.js';

class ServerStatsComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      serverStats : {},
      hasRole : null,
      connectionId : JSON.parse(sessionStorage.getItem('connectionId') || '{}'),
      error : false
    };
  }

  componentDidMount() {
    const partialUrl = 'stats?connectionId=' + this.state.connectionId;
    const serverStatsCall = service('GET', partialUrl, '');
    serverStatsCall.then(this.success.bind(this), this.failure.bind(this));
  }

  success(data) {
    this.setState({serverStats : data.response.result});
    if(typeof(data.response.error) != 'undefined') {
      if(data.response.error.code === 'INVALID_CONNECTION') {
        this.setState({error : true});
      }

    } else{
      if (typeof(data.response.result.code) != 'undefined' && data.response.result.code === '13' ) {
        this.setState({hasRole : false});
      } else{
        this.setState({hasRole : true});
      }
    }
  }

  failure() {
  }

  render () {
    const getItemString = () => (<span></span>);
    return(

      <div className={serverStatsStyles.mainContainer}>
      {!this.state.error ?
        <div>
        <p className={serverStatsStyles.title}>Server Statistics</p>
        { this.state.hasRole ? <div className={serverStatsStyles.container}>
          <span className={serverStatsStyles.headContainer}>
            <span className={serverStatsStyles.key}>Key</span> <span className={serverStatsStyles.value}>Value</span>
          </span>
          <TreeView data={this.state.serverStats} shouldExpandNode={() => true } keyPath = {['Statistics']} key = {this.state.serverStats['host']} getItemString={getItemString}/>
        </div>
        : (this.state.hasRole == null ? <div className={serverStatsStyles.loading}><img src={'/images/loading.gif'} ></img><label>Checking for Privileges</label></div> : <div className = {serverStatsStyles.errorHolder}>You are not authorised to view Server Statiscs</div> ) }
      </div> : <p className = {serverStatsStyles.errorHolder}>Not Connected To Mongodb</p> }
      </div>
    );
  }
}

export default ServerStatsComponent;
