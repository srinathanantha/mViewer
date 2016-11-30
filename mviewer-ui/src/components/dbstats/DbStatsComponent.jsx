import React from 'react'
import dbStatsStyles from './dbstats.css'
import $ from 'jquery'
import service from '../../gateway/service.js';

class DbStatsComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dbStats: {},
      selectedDB: null,
      sidebarOpen: false
    }
  }

  componentDidMount(){
    var that = this;
    var queryData = {};
    queryData['query'] = "db.runCommand({dbStats:1})";
    queryData['fields'] = "";
    queryData['limit'] = 10;
    queryData['skip'] = 0;
    queryData['sortBy'] =  "{'_id':-1}";
    var partialUrl = 'db/' + that.props.selectedDB + '?connectionId=' + that.props.connectionId;
    var dbStatsCall = service('POST', partialUrl, JSON.stringify(queryData), 'query');
    dbStatsCall.then(this.success.bind(this), this.failure.bind(this));
  }

  success(data) {
    var that = this;
    var stats = [];
    var oldStats = data.response.result.documents;
    oldStats.length > 0 ? Object.keys(oldStats[0]).map(function(key) {
      if(typeof(oldStats[0][key]) == "object") {
        Object.keys(oldStats[0][key]).map(function(item){
          var keyValue = key + '.' + item;
          stats.push({key: keyValue, value: oldStats[0][key][item]});
        })
      } else {
        stats.push({key: key, value: oldStats[0][key]});
      }
    }) : null
    this.setState({dbStats: stats});
  }

  failure() {
  }

  render () {
    var that = this;
    return(
      <div className={dbStatsStyles.mainContainer}>
        { that.props.selectedDB  ?
          <div className={dbStatsStyles.dbStatsBody}>
            <table>
              <tbody>
                <tr>
                  <th>Keys</th>
                  <th>Values</th>
                </tr>
                { that.state.dbStats.length > 0 ? that.state.dbStats.map(function(item) {
                    return <tr key={item.key}><td>{item.key}</td><td>{item.value}</td></tr>
                }): null}
              </tbody>
            </table>
          </div>
          : null
        }
      </div>
    );
  }
}

export default DbStatsComponent;
